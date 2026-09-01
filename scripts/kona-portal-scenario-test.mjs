// scripts/kona-portal-scenario-test.mjs
// KONA PLATE 포털 테스트 데이터 — 전체 결제 시나리오
// 회원가입 → 은행계좌 등록(ARS) → 실물카드 연결 → 충전 → 잔액조회 → 결제승인 → 거래내역 → 결제취소

import { readFileSync } from "fs";
import {
  createHmac, publicEncrypt, privateDecrypt,
  randomBytes, createCipheriv, createDecipheriv, constants,
} from "crypto";

// ── 환경 변수 로드 ─────────────────────────────────────────
function loadEnv(path) {
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

const env = loadEnv(".env.local");
const BASE_URL          = env.KONAPLATE_BASE_URL          ?? "https://sandbox.konaplate.com/open-api";
const ASP_ID            = env.KONAPLATE_ASP_ID            ?? "";
const ACCESS_KEY        = env.KONAPLATE_ACCESS_KEY        ?? "";
const SECRET_KEY        = env.KONAPLATE_SECRET_KEY        ?? "";
const CRYPTO_KEY_ID     = env.KONAPLATE_CRYPTO_KEY_ID     ?? "";
const SERVER_PUBLIC_KEY = env.KONAPLATE_SERVER_PUBLIC_KEY ?? "";
const CLIENT_PRIVATE_KEY = env.KONAPLATE_CLIENT_PRIVATE_KEY ?? "";

if (!CLIENT_PRIVATE_KEY) {
  console.warn("⚠  KONAPLATE_CLIENT_PRIVATE_KEY 미설정 — 응답 복호화 불가 (encData 원문 노출)");
}

// ── KST 타임스탬프 ────────────────────────────────────────
function nowKST() {
  const kst = new Date(Date.now() + 9 * 3600000);
  const p = (n, l) => String(n).padStart(l, "0");
  const ts17 = `${p(kst.getUTCFullYear(),4)}${p(kst.getUTCMonth()+1,2)}${p(kst.getUTCDate(),2)}` +
               `${p(kst.getUTCHours(),2)}${p(kst.getUTCMinutes(),2)}${p(kst.getUTCSeconds(),2)}` +
               `${p(kst.getUTCMilliseconds(),3)}`;
  return { ts17, ts14: ts17.slice(0, 14) };
}

// yyMMddHHmmss-xxxxxxx (20자) — KONA 공식 스펙
function makeCorr20() {
  const { ts17 } = nowKST();
  return `${ts17.slice(2, 14)}-${randomBytes(4).toString("hex").slice(0, 7)}`;
}

// ── JWE 유틸 ──────────────────────────────────────────────
function b64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function fromB64url(s) {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function encryptJWE(plaintext) {
  const header = { enc: "A128GCM", alg: "RSA-OAEP-256" };
  const encodedHeader = b64url(Buffer.from(JSON.stringify(header)));
  const cek = randomBytes(16);
  const encryptedKey = publicEncrypt(
    { key: SERVER_PUBLIC_KEY, oaepHash: "sha256", padding: constants.RSA_PKCS1_OAEP_PADDING }, cek);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-128-gcm", cek, iv);
  cipher.setAAD(Buffer.from(encodedHeader));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [encodedHeader, b64url(encryptedKey), b64url(iv), b64url(ciphertext), b64url(tag)].join(".");
}

// 응답 JWE 복호화 (resEncrypt: Y — RSA-OAEP-256 + A128GCM / A256GCM)
function decryptJWE(jwe) {
  const parts = jwe.split(".");
  if (parts.length !== 5) throw new Error(`Invalid JWE (${parts.length} parts)`);
  const [encodedHeader, encKeyB64, ivB64, ciphertextB64, tagB64] = parts;
  const header = JSON.parse(fromB64url(encodedHeader).toString("utf8"));
  const cipherAlgo = header.enc === "A256GCM" ? "aes-256-gcm" : "aes-128-gcm";
  const cek = privateDecrypt(
    { key: CLIENT_PRIVATE_KEY, oaepHash: "sha256", padding: constants.RSA_PKCS1_OAEP_PADDING },
    fromB64url(encKeyB64));
  const decipher = createDecipheriv(cipherAlgo, cek, fromB64url(ivB64));
  decipher.setAuthTag(fromB64url(tagB64));
  decipher.setAAD(Buffer.from(encodedHeader));
  return Buffer.concat([decipher.update(fromB64url(ciphertextB64)), decipher.final()]).toString("utf8");
}

// ── API 호출 래퍼 ─────────────────────────────────────────
const SUCCESS = "000_000";  // KONA 공식 성공 코드
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiPost(label, path, bodyObj, encrypted = false) {
  let bodyStr;
  if (encrypted) {
    const jwe = encryptJWE(JSON.stringify(bodyObj));
    bodyStr = JSON.stringify({ encData: jwe });
  } else {
    bodyStr = JSON.stringify(bodyObj);
  }

  const { ts17, ts14 } = nowKST();
  const hmac   = createHmac("sha256", SECRET_KEY).update(bodyStr).digest("base64");
  const corrId = makeCorr20();
  const headers = {
    "Content-Type": "application/json",
    "X-KM-User-AspId":     ASP_ID,
    "X-KM-Correlation-Id": corrId,
    "X-KM-Access-Key":     ACCESS_KEY,
    "X-KM-Tran-Token":     `KMV1:${ts17}:${hmac}`,
    "X-KM-Tran-Time":      ts14,
    "X-KM-Time-Zone":      "KST",
    ...(encrypted ? { "X-KM-Crypto-Key-Id": CRYPTO_KEY_ID } : {}),
  };

  console.log(`\n${"─".repeat(60)}`);
  console.log(`▶ ${label}`);
  console.log(`  POST ${path}${encrypted ? "  🔒" : "  📄"}`);
  console.log(`  corrId[${corrId.length}]: ${corrId}`);

  const res  = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body: bodyStr });
  const text = await res.text();

  // 응답 복호화: encData 있으면 클라이언트 개인키로 JWE 복호화
  let json = null;
  try {
    const raw = JSON.parse(text);
    if (raw?.encData && typeof raw.encData === "string" && CLIENT_PRIVATE_KEY) {
      const plaintext = decryptJWE(raw.encData);
      json = JSON.parse(plaintext);
      console.log("  🔓 응답 복호화 완료");
    } else {
      json = raw;
    }
  } catch (e) {
    console.warn(`  ⚠ 파싱/복호화 실패: ${e.message}`);
    json = null;
  }

  const code = json?.response?.code ?? "?";
  const desc = json?.response?.description ?? (json ? "" : text.slice(0, 100));
  const ok   = code === SUCCESS;
  console.log(`  ${ok ? "✅" : "❌"} HTTP ${res.status}  code=${code}  ${desc}`);

  if (json && typeof json === "object") {
    const d = JSON.parse(JSON.stringify(json));
    const mask4 = v => v ? `****${String(v).slice(-4)}` : v;
    if (d.cardNo)          d.cardNo       = mask4(d.cardNo);
    if (d.bankAccount)     d.bankAccount  = mask4(d.bankAccount);
    if (d.nrNumber)        d.nrNumber     = `${String(d.nrNumber).slice(0,4)}...`;
    if (d.par)             d.par          = `${String(d.par).slice(0,6)}...`;
    if (d.dcvv)            d.dcvv         = "***";
    if (d.oneTimeToken)    d.oneTimeToken = "***";
    if (d.basicCardInfo) {
      if (d.basicCardInfo.cardNo) d.basicCardInfo.cardNo = mask4(d.basicCardInfo.cardNo);
      if (d.basicCardInfo.par)    d.basicCardInfo.par    = `${String(d.basicCardInfo.par).slice(0,6)}...`;
    }
    const s = JSON.stringify(d);
    console.log(`  DATA: ${s.length > 500 ? s.slice(0, 497) + "..." : s}`);
  }

  return { status: res.status, code, data: json };
}

// ═══════════════════════════════════════════════════════════
//  포털 테스트 데이터 (2026-09-01 캡처)
// ═══════════════════════════════════════════════════════════

// 회원 데이터 — KONA 포털 테스트 데이터 2026-09-01 캡처 (joinChannel: OPENAPI)
// bankName은 포털 표시값을 직접 저장 (BANK_NAMES 추론 사용 안 함)
const MEMBERS = {
  김코나: { birthDate: "19751112", bankCode: "003", bankName: "IBK기업은행",      bankAccount: "333015555557",  balanceY: true  },
  김코코: { birthDate: "19890530", bankCode: "010", bankName: "NH농협은행",        bankAccount: "11112333333",   balanceY: true  },
  박탐나: { birthDate: "19920315", bankCode: "020", bankName: "우리은행",          bankAccount: "1006122222222", balanceY: true  },
  유대코: { birthDate: "19991202", bankCode: "034", bankName: "광주은행",          bankAccount: "100333888888",  balanceY: false },
  이모나: { birthDate: "20050628", bankCode: "092", bankName: "토스뱅크",          bankAccount: "100666666668",  balanceY: false },
  정푸루: { birthDate: "19880214", bankCode: "005", bankName: "KEB하나은행",       bankAccount: "2224444455605", balanceY: true  },
  조동백: { birthDate: "19950525", bankCode: "021", bankName: "신한은행",          bankAccount: "10044444445",   balanceY: false },
  최이음: { birthDate: "19970911", bankCode: "031", bankName: "DGB대구은행",       bankAccount: "505222222224",  balanceY: false },
  추비즈: { birthDate: "20020126", bankCode: "045", bankName: "새마을금고중앙회",  bankAccount: "9002777777779", balanceY: false },
  한배코: { birthDate: "19800704", bankCode: "004", bankName: "KB국민은행",        bankAccount: "3333015555556", balanceY: true  },
};

// 발급 카드 데이터 — 모두 ACTIVE, expiryDate=3108(2031.08), serviceId=000170000002000
const PORTAL_CARDS = [
  { cardNo: "9491339401250765", cvc: "211", par: "Q180BEA3B2F1BBD8410336D66A4" },
  { cardNo: "9491339401250906", cvc: "761", par: "Q12EA18694F1BBD928C3ADB3048" },
  { cardNo: "9491339401250898", cvc: "181", par: "Q167819387F1BBD913786BB7055" },
  { cardNo: "9491339401250880", cvc: "195", par: "Q1C9820531F1BBD90E10F5A9273" },
  { cardNo: "9491339401250872", cvc: "371", par: "Q12B94ED50F1BBD8F7B05994A0A" },
  { cardNo: "9491339401250864", cvc: "228", par: "Q121997E0EF1BBD8E9391BC82A4" },
  { cardNo: "9491339401250856", cvc: "176", par: "Q1E0B86C1FF1BBD8D98A727BADE" },
  { cardNo: "9491339401250849", cvc: "249", par: "Q103B78709F1BBD8CB648E8D0FB" },
  { cardNo: "9491339401250831", cvc: "561", par: "Q1898E85DBF1BBD8B2A4E910953" },
  { cardNo: "9491339401250823", cvc: "951", par: "Q181B56345F1BBD8AC43331C59C" },
];
const CARD_EXPIRY = "3108"; // YYMM: 2031.08

// 가맹점 데이터 — 코나 acquirer 우선
const MERCHANTS = [
  { merchantId: "410195430033901", name: "네네치킨 청학점",     acquirer: "코나" },
  { merchantId: "410894040073801", name: "본죽 김포전원마을점", acquirer: "코나" },
  { merchantId: "410147370025101", name: "상상만화카페",         acquirer: "코나" },
  { merchantId: "410616271317501", name: "현재약국",             acquirer: "코나" },
  { merchantId: "410121137754301", name: "용가리노래연습장",     acquirer: "코나" },
];

const TC_IDS = ["29184","29186","29187","29188","601151","601152","604150","606153"];

// ═══════════════════════════════════════════════════════════
//  시나리오 설정
// ═══════════════════════════════════════════════════════════
const M_NAME         = "김코나";
const M              = MEMBERS[M_NAME];
const CARD           = PORTAL_CARDS[0];
const MERCHANT       = MERCHANTS[0];
const CHARGE_AMOUNT  = 10000;
const PAYMENT_AMOUNT = 1000;
const UID = Date.now().toString().slice(-9);
const CHARGE_SEQ_ID  = `MNR${UID}CR`;

console.log("═".repeat(60));
console.log("  KONA PLATE 포털 데이터 — 전체 결제 시나리오 테스트");
console.log("═".repeat(60));
console.log(`  회원   : ${M_NAME}  birthDate=${M.birthDate}`);
console.log(`  은행   : ${M.bankCode}(${M.bankName})  ****${M.bankAccount.slice(-4)}  balance=${M.balanceY?"Y":"N"}`);
console.log(`  카드   : ****${CARD.cardNo.slice(-4)}  expiry=${CARD_EXPIRY}  cvc=${CARD.cvc}`);
console.log(`  가맹점 : ${MERCHANT.name}  ${MERCHANT.merchantId}`);
console.log(`  UID    : ${UID}`);
console.log(`  복호화 : ${CLIENT_PRIVATE_KEY ? "✅ 개인키 있음" : "⚠ 개인키 없음"}`);
console.log();

let userId       = null;
let activeCardNo = CARD.cardNo;
let activePar    = CARD.par;
let nrNumber     = null;
let passed = 0, attempted = 0;

// ─────────────────────────────────────────────────────────
//  1/9  회원가입  POST /api/v1/user/registration  (reqEncrypt: Y, resEncrypt: Y)
// ─────────────────────────────────────────────────────────
attempted++;
const s1 = await apiPost("1/9  회원가입", "/api/v1/user/registration", {
  loginId:       `km${UID}@kona.test`,
  loginPassword: "111111",
  birthDate:     M.birthDate,
  userName:      M_NAME,
  email:         `km${UID}@kona.test`,
  nationality:   "Korean",
  gender:        "Male",
  mobileNumber:  "01012341234",
  addressInfo:   { address: "서울특별시 강남구 테헤란로 1", zipCode: "06234" },
  joinChannel:   "OPENAPI",
  tcIdList:      TC_IDS,
}, true);

if (s1.code !== SUCCESS) {
  console.log(`\n⛔ 회원가입 실패 (code=${s1.code}) → 시나리오 중단`);
  process.exit(1);
}
passed++;
userId = s1.data?.userId;
if (s1.data?.basicCardInfo?.cardNo) {
  activeCardNo = s1.data.basicCardInfo.cardNo;
  if (s1.data.basicCardInfo.par) activePar = s1.data.basicCardInfo.par;
  console.log(`  → 자동발급 카드 ****${activeCardNo.slice(-4)}`);
}
console.log(`  → userId = ${userId}`);
await sleep(500);

// ─────────────────────────────────────────────────────────
//  2/9  은행계좌 등록 (4단계 ARS 플로우)
//  2a: 실명검증  /api/v1/bankaccounts/user/valid     (reqEncrypt: Y)
//  2b: ARS 인증  /api/v1/bankaccounts/ars/auth       (reqEncrypt: Y)  req={userId}
//  2c: ARS 등록  /api/v1/bankaccounts/ars/register   (reqEncrypt: Y)  res={bankAccRegNo}
//  2d: 결과조회  /api/v1/bankaccounts/ars/register/inquiry  (polling, req={regNo})
// ─────────────────────────────────────────────────────────
attempted++;
const s2a = await apiPost("2a/9  은행계좌 실명검증", "/api/v1/bankaccounts/user/valid", {
  userId,
  userName:    M_NAME,
  birthDate:   M.birthDate,
  bankCode:    M.bankCode,
  bankAccount: M.bankAccount,
}, true);
await sleep(400);

if (s2a.code === SUCCESS) {
  // 2b: ARS 인증 — request: { userId } 만 전송, response: authNumber(2자리)
  const s2b = await apiPost("2b/9  ARS 인증 요청", "/api/v1/bankaccounts/ars/auth", {
    userId,
  }, true);
  await sleep(400);
  console.log(`  authNumber=${s2b.data?.authNumber ?? "(없음)"}`);

  // 2c: ARS 등록
  // 공식 필수: userId, bankAccount, bankCode, bankName, userName, birthDate
  const s2c = await apiPost("2c/9  ARS 등록", "/api/v1/bankaccounts/ars/register", {
    userId,
    bankCode:    M.bankCode,
    bankAccount: M.bankAccount,
    bankName:    M.bankName,
    userName:    M_NAME,
    birthDate:   M.birthDate,
  }, true);
  await sleep(400);

  const bankAccRegNo = s2c.data?.bankAccRegNo;

  if (bankAccRegNo) {
    // 2d: 결과 polling — ARS는 비동기, status가 BANK_ACC_REGISTERED될 때까지 대기
    console.log(`  → bankAccRegNo=${bankAccRegNo}  polling 시작...`);
    const ARS_DONE = "BANK_ACC_REGISTERED";
    const ARS_FAIL = ["ARS_AUTH_FAILED", "BANK_ACC_REG_FAILED"];
    let arsOk = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      await sleep(2000);
      const s2d = await apiPost(
        `2d/9  ARS 결과 조회 (${attempt + 1}/10)`,
        "/api/v1/bankaccounts/ars/register/inquiry",
        { regNo: bankAccRegNo },
        false,
      );
      const status = s2d.data?.status;
      console.log(`  status=${status ?? "?"}`);
      if (status === ARS_DONE) { arsOk = true; passed++; break; }
      if (ARS_FAIL.includes(status)) { console.log(`  ⛔ ARS 실패: ${status}`); break; }
    }
    if (!arsOk) console.log("  ⚠ ARS 등록 미완료 (timeout 또는 실패)");
  } else {
    // bankAccRegNo 없이 성공 코드면 동기 완료로 간주
    if (s2c.code === SUCCESS) passed++;
  }
} else {
  console.log(`\n  ⚠ 실명검증 실패 (code=${s2a.code}) — ARS 단계 건너뜀`);
}
await sleep(300);

// ─────────────────────────────────────────────────────────
//  3/9  실물카드 회원 연결  POST /api/v1/prepay-card/physical/register  (reqEncrypt: Y)
// ─────────────────────────────────────────────────────────
attempted++;
const s3 = await apiPost("3/9  실물카드 회원 연결", "/api/v1/prepay-card/physical/register", {
  userId,
  physicalCardNo:      CARD.cardNo,
  physicalCardExpDate: CARD_EXPIRY,  // YYMM
  physicalCardCVC:     CARD.cvc,
}, true);

if (s3.code === SUCCESS) {
  passed++;
  if (s3.data?.par) activePar = s3.data.par;
}
await sleep(500);

// ─────────────────────────────────────────────────────────
//  4/9  충전용 일회용 토큰 발급  POST /api/v2/payment/generate/onetimetoken  (reqEncrypt: Y)
//  은행계좌 충전용 — type 생략
// ─────────────────────────────────────────────────────────
attempted++;
const s4 = await apiPost("4/9  충전용 토큰 발급", "/api/v2/payment/generate/onetimetoken", {
  cardNo: activeCardNo,
}, true);

const dcvv         = s4.data?.dcvv;
const oneTimeToken = s4.data?.oneTimeToken;
if (s4.code === SUCCESS) passed++;
await sleep(500);

// ─────────────────────────────────────────────────────────
//  5/9  은행계좌 충전  POST /api/v1/recharges/by-bank-accounts/no-hce  (reqEncrypt: N)
//  balance=Y 계좌만 충전 가능. isPending=true면 결과조회 polling
// ─────────────────────────────────────────────────────────
let chargeOk = false;
attempted++;
if (dcvv && oneTimeToken) {
  const s5 = await apiPost(
    `5/9  은행계좌 충전 (${CHARGE_AMOUNT.toLocaleString()}원)`,
    "/api/v1/recharges/by-bank-accounts/no-hce",
    {
      dcvv,
      oneTimeToken,
      userId,
      merchantId: MERCHANT.merchantId,
      amount:     CHARGE_AMOUNT,
      sequenceId: CHARGE_SEQ_ID,
    },
    false,
  );

  if (s5.code === SUCCESS) {
    if (s5.data?.isPending === true) {
      // 비동기 처리 중 — 결과 polling
      // /result/inquiry 응답: result = "COMPLETED" | "FAILED" | "PENDING"
      console.log("  isPending=true → 충전 결과 polling...");
      for (let attempt = 0; attempt < 10; attempt++) {
        await sleep(2000);
        const s5p = await apiPost(
          `5p 충전 결과 조회 (${attempt + 1}/10)`,
          "/api/v1/recharges/by-bank-account/result/inquiry",
          { sequenceId: CHARGE_SEQ_ID },
          false,
        );
        const result = s5p.data?.result;
        console.log(`  result=${result ?? "?"} code=${s5p.code}`);
        if (result === "COMPLETED") { chargeOk = true; passed++; break; }
        if (result === "FAILED")    { console.log("  ⛔ 충전 최종 실패: FAILED"); break; }
        // result === "PENDING" → 계속 polling
      }
      if (!chargeOk) console.log("  ⚠ 충전 결과 미확정 (timeout)");
    } else {
      chargeOk = true; passed++;
    }
  }
} else {
  console.log("\n  [5/9 충전] 토큰 미발급 → 건너뜀");
}
await sleep(500);

// ─────────────────────────────────────────────────────────
//  6/9  카드 잔액 조회  POST /api/v1/user/card/info  (reqEncrypt: Y)
// ─────────────────────────────────────────────────────────
attempted++;
const s6 = await apiPost("6/9  카드 잔액 조회", "/api/v1/user/card/info", {
  cardNo: activeCardNo,
}, true);
if (s6.code === SUCCESS) passed++;
await sleep(500);

// ─────────────────────────────────────────────────────────
//  7/9  결제 승인 (No-HCE)
//  7a: 결제용 토큰 발급  (충전용 토큰과 별개로 재발급)
//  7b: POST /api/v1/payment/no-hce  (reqEncrypt: N)
// ─────────────────────────────────────────────────────────
attempted++;
if (chargeOk) {
  const s7a = await apiPost("7a/9  결제용 토큰 발급", "/api/v2/payment/generate/onetimetoken", {
    cardNo: activeCardNo,
  }, true);
  await sleep(400);

  const payDcvv         = s7a.data?.dcvv;
  const payOneTimeToken = s7a.data?.oneTimeToken;

  if (payDcvv && payOneTimeToken) {
    const s7 = await apiPost(
      `7b/9  결제 승인 (${PAYMENT_AMOUNT.toLocaleString()}원)`,
      "/api/v1/payment/no-hce",
      {
        oneTimeToken:  payOneTimeToken,
        dcvv:          payDcvv,
        amount:        PAYMENT_AMOUNT,
        merchantId:    MERCHANT.merchantId,
        channel:       "OPENAPI",
        transactionId: `MNR${UID}PY`,
      },
      false,
    );
    if (s7.code === SUCCESS) {
      passed++;
      nrNumber = s7.data?.nrNumber;
      console.log(`  → nrNumber = ${nrNumber ? String(nrNumber).slice(0,6)+"..." : "없음"}`);
    }
  } else {
    console.log("\n  [7/9 결제] 결제용 토큰 발급 실패 → 건너뜀");
  }
} else {
  console.log("\n  [7/9 결제] 충전 미완료 → 건너뜀");
}
await sleep(500);

// ─────────────────────────────────────────────────────────
//  8/9  거래내역 조회  POST /api/v1/transaction/card  (reqEncrypt: N)
// ─────────────────────────────────────────────────────────
attempted++;
const kd = new Date(Date.now() + 9 * 3600000);
const todayStr = `${kd.getUTCFullYear()}${String(kd.getUTCMonth()+1).padStart(2,"0")}${String(kd.getUTCDate()).padStart(2,"0")}`;
const s8 = await apiPost("8/9  거래내역 조회", "/api/v1/transaction/card", {
  userId,
  par:         activePar,
  startDate:   todayStr,
  endDate:     todayStr,
  pageRequest: { page: 0, pageSize: 10, sort: "approvalDateTime", orderByDirection: "DESC" },
}, false);
if (s8.code === SUCCESS) passed++;
await sleep(500);

// ─────────────────────────────────────────────────────────
//  9/9  결제 취소 (No-HCE)  POST /api/v1/payment/cancel/no-hce  (reqEncrypt: Y)
// ─────────────────────────────────────────────────────────
attempted++;
if (nrNumber) {
  const s9 = await apiPost("9/9  결제 취소", "/api/v1/payment/cancel/no-hce", {
    cardNo:     activeCardNo,
    amount:     PAYMENT_AMOUNT,
    nrNumber,
    merchantId: MERCHANT.merchantId,
    channel:    "OPENAPI",
  }, true);
  if (s9.code === SUCCESS) passed++;
} else {
  console.log("\n  [9/9 결제 취소] 결제 승인 없음 → 건너뜀");
}

// ─────────────────────────────────────────────────────────
//  결과 요약
// ─────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log(`  시나리오 완료  ${passed}/${attempted} 성공`);
if (userId)   console.log(`  userId   : ${userId}`);
if (nrNumber) console.log(`  nrNumber : ${String(nrNumber).slice(0,6)}...`);
console.log("═".repeat(60));
