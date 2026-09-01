/**
 * KONA PLATE Open API 클라이언트
 *
 * X-KM-Tran-Token: "KMV1:" + yyyyMMddHHmmssSSS + ":" + Base64(HMAC-SHA256(secretKey, bodyString))
 * Message Encryption: JWE (RSA-OAEP-256 + A128GCM), 요청 형식: {"encData":"<JWE>"}
 *
 * 샌드박스 주의: sandbox.konaplate.com 의 `tid` 컬럼 오버플로우 버그로
 * 회원가입 등 INSERT 요청이 500을 반환함. 암호화 자체는 정상.
 */

import {
  createHmac,
  publicEncrypt,
  privateDecrypt,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  constants,
} from "crypto";

const BASE_URL =
  process.env.KONAPLATE_BASE_URL ?? "https://sandbox.konaplate.com/open-api";
const ASP_ID = process.env.KONAPLATE_ASP_ID ?? "";
const ACCESS_KEY = process.env.KONAPLATE_ACCESS_KEY ?? "";
const SECRET_KEY = process.env.KONAPLATE_SECRET_KEY ?? "";
const CRYPTO_KEY_ID = process.env.KONAPLATE_CRYPTO_KEY_ID ?? "";
const SERVER_PUBLIC_KEY = process.env.KONAPLATE_SERVER_PUBLIC_KEY ?? "";
// 응답 암호화(resEncrypt: Y) 복호화용 클라이언트 개인키 (PEM 형식, \n 포함)
const CLIENT_PRIVATE_KEY = process.env.KONAPLATE_CLIENT_PRIVATE_KEY ?? "";

// yyyyMMddHHmmssSSS (17자)
function nowKSTLong(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const p = (n: number, l: number) => String(n).padStart(l, "0");
  return (
    p(kst.getUTCFullYear(), 4) +
    p(kst.getUTCMonth() + 1, 2) +
    p(kst.getUTCDate(), 2) +
    p(kst.getUTCHours(), 2) +
    p(kst.getUTCMinutes(), 2) +
    p(kst.getUTCSeconds(), 2) +
    p(kst.getUTCMilliseconds(), 3)
  );
}

// yyyyMMddHHmmss (14자)
function nowKSTShort(): string {
  return nowKSTLong().slice(0, 14);
}

// yyMMddHHmmss-xxxxxxx (20자) — KONA 스펙: 정확히 20자, 밀리초 제외
function correlationId(): string {
  const ts = nowKSTLong().slice(2, 14); // 12자 yyMMddHHmmss (SSS 밀리초 제거)
  const rand = randomBytes(4).toString("hex").slice(0, 7);
  return `${ts}-${rand}`;
}

// KMV1:yyyyMMddHHmmssSSS:Base64(HMAC-SHA256(secretKey, bodyString))
// 500 "tid too long" 시절에 이 형식(67자, 표준 base64 with = 패딩)으로 KONA 인증 통과 확인됨
function makeTranToken(bodyString: string): string {
  const sig = createHmac("sha256", SECRET_KEY)
    .update(bodyString)
    .digest("base64");
  return `KMV1:${nowKSTLong()}:${sig}`;
}

function buildBaseHeaders(bodyString: string = "") {
  return {
    "Content-Type": "application/json",
    "X-KM-User-AspId": ASP_ID,
    "X-KM-Correlation-Id": correlationId(),
    "X-KM-Access-Key": ACCESS_KEY,
    "X-KM-Tran-Token": makeTranToken(bodyString),
    "X-KM-Tran-Time": nowKSTShort(),
    "X-KM-Time-Zone": "KST",
  };
}

// base64url 인코딩 (JWE 표준)
function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * JWE Compact Serialization (RSA-OAEP-256 + A128GCM)
 * header.encryptedKey.iv.ciphertext.tag
 */
function encryptJWE(plaintext: string): string {
  const header = { enc: "A128GCM", alg: "RSA-OAEP-256" };
  const encodedHeader = b64url(Buffer.from(JSON.stringify(header)));

  // CEK: AES-128 랜덤 키 (16 bytes)
  const cek = randomBytes(16);

  // CEK를 서버 RSA 공개키로 암호화 (OAEP-SHA256)
  const encryptedKey = publicEncrypt(
    {
      key: SERVER_PUBLIC_KEY,
      oaepHash: "sha256",
      padding: constants.RSA_PKCS1_OAEP_PADDING,
    },
    cek,
  );

  // AES-128-GCM 암호화, AAD = encodedHeader
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-128-gcm", cek, iv);
  cipher.setAAD(Buffer.from(encodedHeader));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag(); // 16 bytes

  return [
    encodedHeader,
    b64url(encryptedKey),
    b64url(iv),
    b64url(ciphertext),
    b64url(tag),
  ].join(".");
}

// base64url → Buffer
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * JWE Compact Serialization 복호화 (RSA-OAEP-256 + A128GCM / A256GCM)
 * resEncrypt: Y 응답에서 encData 필드 값을 복호화할 때 사용
 */
function decryptJWE(jwe: string): string {
  const parts = jwe.split(".");
  if (parts.length !== 5) throw new Error("Invalid JWE compact format");

  const [encodedHeader, encryptedKeyB64, ivB64, ciphertextB64, tagB64] = parts;

  // JWE 헤더에서 enc 알고리즘 파악 (A128GCM / A256GCM)
  const header = JSON.parse(
    Buffer.from(fromB64url(encodedHeader)).toString("utf8"),
  ) as { enc: string; alg: string };
  const cipherAlgo = header.enc === "A256GCM" ? "aes-256-gcm" : "aes-128-gcm";

  const encryptedKey = fromB64url(encryptedKeyB64);
  const iv = fromB64url(ivB64);
  const ciphertext = fromB64url(ciphertextB64);
  const tag = fromB64url(tagB64);

  // RSA-OAEP-256로 CEK 복호화
  const cek = privateDecrypt(
    {
      key: CLIENT_PRIVATE_KEY,
      oaepHash: "sha256",
      padding: constants.RSA_PKCS1_OAEP_PADDING,
    },
    encryptedKey,
  );

  // AES-GCM으로 페이로드 복호화, AAD = encoded header
  const decipher = createDecipheriv(cipherAlgo, cek, iv);
  decipher.setAuthTag(tag);
  decipher.setAAD(Buffer.from(encodedHeader));

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}

/** 평문 JSON 요청 — request는 평문이지만 response가 encData로 올 수 있음 (예: /api/v1/payment/no-hce) */
export async function konaPost<T>(path: string, body: unknown): Promise<T> {
  const bodyString = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: buildBaseHeaders(bodyString),
    body: bodyString,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`KONA PLATE ${res.status}: ${text}`);
  const parsed = JSON.parse(text) as Record<string, unknown>;
  if (parsed.encData && typeof parsed.encData === "string" && CLIENT_PRIVATE_KEY) {
    const plaintext = decryptJWE(parsed.encData);
    return JSON.parse(plaintext) as T;
  }
  return parsed as T;
}

/** JWE 암호화 요청 (개인정보 포함 엔드포인트) + 응답 복호화 */
export async function konaPostEncrypted<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const jwe = encryptJWE(JSON.stringify(body));
  const encBody = JSON.stringify({ encData: jwe });
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...buildBaseHeaders(encBody),
      "X-KM-Crypto-Key-Id": CRYPTO_KEY_ID,
    },
    body: encBody,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`KONA PLATE ${res.status}: ${text}`);

  // resEncrypt: Y 응답인 경우 encData 필드를 클라이언트 개인키로 복호화
  const parsed = JSON.parse(text) as Record<string, unknown>;
  if (parsed.encData && typeof parsed.encData === "string" && CLIENT_PRIVATE_KEY) {
    const plaintext = decryptJWE(parsed.encData);
    return JSON.parse(plaintext) as T;
  }
  return parsed as T;
}

export async function konaGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: buildBaseHeaders(""),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`KONA PLATE ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}
