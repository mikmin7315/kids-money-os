/**
 * KONA PLATE 공용 샌드박스 — 전체 연동 시나리오 테스트
 * 포털 테스트 데이터 (회원 #1: 김코나) 사용
 *
 * Flow:
 * 1. 회원가입 (POST /api/v1/user/registration)
 * 2. 은행계좌 등록 (POST /api/v1/user/bank-account)
 * 3. 발급카드 회원 연결 (POST /api/v1/user/card/apply)
 * 4. 은행계좌 충전 (POST /api/v1/recharges/by-bank-accounts/no-hce)
 * 5. 카드 잔액 조회 (POST /api/v1/user/card/info  — reqEncrypt:Y)
 * 6. 결제 승인 (POST /api/v1/payment/approval)
 * 7. 거래내역 조회 (POST /api/v1/transaction/card)
 * 8. 결제 취소 (POST /api/v1/payment/cancel)
 */

import { readFileSync } from "fs";
import { createHmac, publicEncrypt, randomBytes, createCipheriv, constants } from "crypto";

// ── 환경변수 로드 ──────────────────────────────────────────────────────────────
function loadEnvFile(path) {
  const content = readFileSync(path, "utf-8");
  const result = {};
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) { i++; continue; }
    const eqIdx = line.indexOf("=");
    if (eqIdx < 0) { i++; continue; }
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && !val.endsWith('"')) {
      const parts = [val.slice(1)]; i++;
      while (i < lines.length) {
        const next = lines[i];
        if (next.endsWith('"')) { parts.push(next.slice(0, -1)); break; }
        parts.push(next); i++;
      }
      result[key] = parts.join("\n");
    } else {
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      result[key] = val.replace(/\\n/g, "\n");
    }
    i++;
  }
  return result;
}

const env = loadEnvFile(".env.local");
const BASE_URL = env.KONAPLATE_BASE_URL ?? "https://sandbox.konaplate.com/open-api";
const ASP_ID = env.KONAPLATE_ASP_ID ?? "";
const ACCESS_KEY = env.KONAPLATE_ACCESS_KEY ?? "";
const SECRET_KEY = env.KONAPLATE_SECRET_KEY ?? "";
const CRYPTO_KEY_ID = env.KONAPLATE_CRYPTO_KEY_ID ?? "";
const SERVER_PUBLIC_KEY = env.KONAPLATE_SERVER_PUBLIC_KEY ?? "";

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────
function nowKST17() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const p = (n, l) => String(n).padStart(l, "0");
  return p(kst.getUTCFullYear(),4)+p(kst.getUTCMonth()+1,2)+p(kst.getUTCDate(),2)+
    p(kst.getUTCHours(),2)+p(kst.getUTCMinutes(),2)+p(kst.getUTCSeconds(),2)+p(kst.getUTCMilliseconds(),3);
}

// KONA 공식 스펙: yyMMddHHmmss-xxxxxxx (20자, 밀리초 제외)
function makeCorr20(ts17) {
  const rand = randomBytes(4).toString("hex").slice(0, 7);
  return `${ts17.slice(2, 14)}-${rand}`; // 12+1+7 = 20자
}
// 라우팅 통과 시험용 21자 (이전 실험에서 라우팅은 통과됨)
function makeCorr21(ts17) {
  const rand = randomBytes(3).toString("hex").slice(0, 5);
  return `${ts17.slice(2)}-${rand}`; // 15+1+5 = 21자
}

function b64url(buf) {
  return buf.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}

function encryptJWE(plaintext) {
  const header = { enc: "A128GCM", alg: "RSA-OAEP-256" };
  const encodedHeader = b64url(Buffer.from(JSON.stringify(header)));
  const cek = randomBytes(16);
  const encryptedKey = publicEncrypt(
    { key: SERVER_PUBLIC_KEY, oaepHash: "sha256", padding: constants.RSA_PKCS1_OAEP_PADDING },
    cek
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-128-gcm", cek, iv);
  cipher.setAAD(Buffer.from(encodedHeader));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [encodedHeader, b64url(encryptedKey), b64url(iv), b64url(ciphertext), b64url(tag)].join(".");
}

function buildHeaders(bodyStr, corrId) {
  const ts17 = nowKST17();
  // 표준 base64 (= 패딩 포함, 44자) → KMV1:17자:44자 = 67자
  const sig = createHmac("sha256", SECRET_KEY).update(bodyStr).digest("base64");
  const token = `KMV1:${ts17}:${sig}`;
  return {
    "Content-Type": "application/json",
    "X-KM-User-AspId": ASP_ID,
    "X-KM-Correlation-Id": corrId,
    "X-KM-Access-Key": ACCESS_KEY,
    "X-KM-Tran-Token": token,
    "X-KM-Tran-Time": ts17.slice(0, 14),
    "X-KM-Time-Zone": "KST",
  };
}

async function post(label, path, body, encrypt = false, corrFn = makeCorr21) {
  const ts17 = nowKST17();
  const corrId = corrFn(ts17);
  let bodyStr, headers;

  if (encrypt) {
    const jwe = encryptJWE(JSON.stringify(body));
    bodyStr = JSON.stringify({ encData: jwe });
    headers = { ...buildHeaders(bodyStr, corrId), "X-KM-Crypto-Key-Id": CRYPTO_KEY_ID };
  } else {
    bodyStr = JSON.stringify(body);
    headers = buildHeaders(bodyStr, corrId);
  }

  const corrLen = corrId.length;
  const tokenLen = headers["X-KM-Tran-Token"].length;

  console.log(`\n▶ [Step: ${label}]`);
  console.log(`  corrId[${corrLen}]: ${corrId} | token[${tokenLen}] | encrypt: ${encrypt}`);
  console.log(`  → ${path}`);

  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body: bodyStr });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text.slice(0, 200) }; }

  const code = json?.response?.code ?? "?";
  const desc = json?.response?.description ?? json?._raw ?? "";
  console.log(`  ← HTTP ${res.status} / code=${code} / ${desc}`);

  if (res.status === 200 || code === "00") {
    const safe = JSON.stringify(json, (k, v) => {
      if (["cardNo", "par", "bankAccount", "nrNumber", "approvalCode"].includes(k) && typeof v === "string") {
        return v.slice(0, 4) + "****" + v.slice(-4);
      }
      return v;
    });
    console.log(`  ✅ 성공:`, safe.slice(0, 400));
  }

  return { status: res.status, code, data: json };
}

// ── 포털 테스트 데이터 ────────────────────────────────────────────────────────
// 회원 #1: 김코나
const MEMBER = {
  userName: "김코나",
  birthDate: "19751112",
  bankCode: "003",         // IBK기업은행
  bankAccount: "333015555557",
};

// 포털 발급 카드 (serviceId=000170000002000, expiryDate=3108)
const PORTAL_CARD_NO = "9491339401250765";
const SERVICE_ID = "000170000002000";

// 포털 가맹점 (코나 acquirer)
const MERCHANT_ID = "410195430033901";

// KONA 샌드박스 약관 ID
const TC_IDS = ["29184","29186","29187","29188","601151","601152","604150","606153"];

// ── 테스트 상태 ───────────────────────────────────────────────────────────────
let userId = null;
let cardNo = PORTAL_CARD_NO; // 등록 성공 시 basicCardInfo.cardNo로 교체
let par = null;
let chargeNrNumber = null;
let paymentNrNumber = null;

console.log("=".repeat(60));
console.log("KONA PLATE 공용 샌드박스 연동 시나리오 테스트");
console.log(`ASP_ID: ${ASP_ID || "(미설정)"}`);
console.log(`BASE_URL: ${BASE_URL}`);
console.log(`CRYPTO_KEY_ID: ${CRYPTO_KEY_ID || "(미설정)"}`);
console.log("=".repeat(60));

// ── Step 1: 회원가입 ──────────────────────────────────────────────────────────
const ts = Date.now().toString().slice(-8);
const loginId = `kona${ts}`;

const r1 = await post("1/8 회원가입", "/api/v1/user/registration", {
  ci: "",
  loginId,
  loginPassword: MEMBER.birthDate.slice(2), // YYMMDD
  birthDate: MEMBER.birthDate,
  userName: MEMBER.userName,
  email: `${loginId}@monari.card`,
  nationality: "KOR",
  gender: "M",
  mobileNumber: "01000000000",
  addressInfo: { address: "서울특별시 강남구 테헤란로 1", zipCode: "06234" },
  joinChannel: "OPENAPI",   // 포털 테스트 데이터 기준
  tcIdList: TC_IDS,
}, true /* encrypt */);

if (r1.data?.userId) {
  userId = r1.data.userId;
  cardNo = r1.data.basicCardInfo?.cardNo ?? PORTAL_CARD_NO;
  par = r1.data.basicCardInfo?.par ?? null;
  console.log(`  → userId=${userId}, cardNo(masked)=${cardNo?.slice(0,4)}****${cardNo?.slice(-4)}`);
} else {
  console.log(`  ⚠ 등록 실패 — 포털 카드(${PORTAL_CARD_NO.slice(-4)})로 계속`);
  // 포털 카드로 userId 조회 시도
  const r1b = await post("1b/8 포털카드→userId 조회", "/api/v1/user/card/info",
    { cardNo: PORTAL_CARD_NO }, true);
  if (r1b.data?.userId) {
    userId = r1b.data.userId;
    console.log(`  → 포털 카드에서 userId=${userId} 확인`);
  }
}
await new Promise(r => setTimeout(r, 600));

// ── Step 2: 은행계좌 등록 ─────────────────────────────────────────────────────
if (userId) {
  const r2 = await post("2/8 은행계좌 등록", "/api/v1/user/bank-account", {
    userId,
    bankCode: MEMBER.bankCode,
    bankAccount: MEMBER.bankAccount,
    userName: MEMBER.userName,
    birthDate: MEMBER.birthDate,
  }, true /* encrypt */);
  await new Promise(r => setTimeout(r, 600));

  // 엔드포인트가 맞지 않으면 다른 경로 시도
  if (r2.status === 404) {
    console.log("  → /api/v1/user/bank-account 404 → /api/v1/accounts/bank 시도");
    await post("2b/8 은행계좌 등록(alt)", "/api/v1/accounts/bank", {
      userId, bankCode: MEMBER.bankCode, bankAccount: MEMBER.bankAccount,
      userName: MEMBER.userName, birthDate: MEMBER.birthDate,
    }, true);
    await new Promise(r => setTimeout(r, 600));
  }
}

// ── Step 3: 발급카드 회원 연결 ────────────────────────────────────────────────
if (userId) {
  const r3 = await post("3/8 발급카드 회원 연결", "/api/v1/user/card/apply", {
    userId,
    serviceId: SERVICE_ID,
  }, true /* encrypt */);

  if (r3.data?.cardNo) {
    cardNo = r3.data.cardNo;
    par = r3.data.par ?? par;
  }
  await new Promise(r => setTimeout(r, 600));

  // 연결 실패 시 카드 목록으로 par 조회
  if (!par && r3.code !== "00") {
    const r3b = await post("3b/8 카드목록 조회", "/api/v1/user/card/list",
      { userId }, false);
    if (r3b.data?.cardDataInfo?.length > 0) {
      const card = r3b.data.cardDataInfo[0];
      cardNo = card.mobileCardNo ?? card.physicalCardNo ?? cardNo;
      par = card.par ?? par;
      console.log(`  → card from list: cardNo(masked)=${cardNo?.slice(-4)}, par(masked)=${par?.slice(-4)}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }
}

// ── Step 4: 은행계좌 충전 ─────────────────────────────────────────────────────
if (userId && cardNo) {
  // 4a: 일회용 토큰 발급
  const r4a = await post("4a/8 일회용토큰 발급", "/api/v2/payment/generate/onetimetoken",
    { cardNo, type: "CREDIT" }, true);
  await new Promise(r => setTimeout(r, 400));

  if (r4a.data?.oneTimeToken && r4a.data?.dcvv) {
    const { dcvv, oneTimeToken } = r4a.data;
    const seqId = `monari-${Date.now()}`;

    // 4b: 충전
    const r4b = await post("4b/8 은행계좌 충전", "/api/v1/recharges/by-bank-accounts/no-hce", {
      dcvv,
      amount: 10000,
      userId,
      merchantId: ASP_ID || "000170000000000",
      sequenceId: seqId,
      oneTimeToken,
    }, false);

    if (r4b.data?.nrNumber) chargeNrNumber = r4b.data.nrNumber;
    await new Promise(r => setTimeout(r, 600));
  }
}

// ── Step 5: 카드 잔액 조회 ────────────────────────────────────────────────────
if (cardNo) {
  const r5 = await post("5/8 카드 잔액 조회", "/api/v1/user/card/info",
    { cardNo }, true /* encrypt — KONA 문서상 reqEncrypt:Y */);
  await new Promise(r => setTimeout(r, 400));
}

// ── Step 6: 결제 승인 ─────────────────────────────────────────────────────────
if (userId && cardNo) {
  const seqId = `pay-${Date.now()}`;
  const r6 = await post("6/8 결제 승인", "/api/v1/payment/approval", {
    cardNo,
    merchantId: MERCHANT_ID,
    amount: 1000,
    userId,
    sequenceId: seqId,
  }, false);

  if (r6.data?.nrNumber) paymentNrNumber = r6.data.nrNumber;
  await new Promise(r => setTimeout(r, 600));
}

// ── Step 7: 거래내역 조회 ─────────────────────────────────────────────────────
if (userId && par) {
  const today = nowKST17().slice(0, 8); // YYYYMMDD
  const r7 = await post("7/8 거래내역 조회", "/api/v1/transaction/card", {
    userId,
    par,
    startDate: today,
    endDate: today,
    pageRequest: { page: 0, pageSize: 10, sort: "approvalDateTime", orderByDirection: "DESC" },
  }, false);
  await new Promise(r => setTimeout(r, 400));
}

// ── Step 8: 결제 취소 ─────────────────────────────────────────────────────────
if (paymentNrNumber && userId) {
  await post("8/8 결제 취소", "/api/v1/payment/cancel", {
    nrNumber: paymentNrNumber,
    userId,
    sequenceId: `cancel-${Date.now()}`,
  }, false);
}

// ── 결과 요약 ─────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log("테스트 완료 — 결과 요약");
console.log(`userId: ${userId ?? "없음"}`);
console.log(`cardNo: ${cardNo ? cardNo.slice(0,4)+"****"+cardNo.slice(-4) : "없음"}`);
console.log(`par: ${par ? par.slice(-6) : "없음"}`);
console.log(`chargeNrNumber: ${chargeNrNumber ?? "없음"}`);
console.log(`paymentNrNumber: ${paymentNrNumber ?? "없음"}`);
console.log("=".repeat(60));
