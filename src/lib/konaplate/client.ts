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
  randomBytes,
  createCipheriv,
  constants,
} from "crypto";

const BASE_URL =
  process.env.KONAPLATE_BASE_URL ?? "https://sandbox.konaplate.com/open-api";
const ASP_ID = process.env.KONAPLATE_ASP_ID ?? "";
const ACCESS_KEY = process.env.KONAPLATE_ACCESS_KEY ?? "";
const SECRET_KEY = process.env.KONAPLATE_SECRET_KEY ?? "";
const CRYPTO_KEY_ID = process.env.KONAPLATE_CRYPTO_KEY_ID ?? "";
const SERVER_PUBLIC_KEY = process.env.KONAPLATE_SERVER_PUBLIC_KEY ?? "";

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

// yyMMddHHmmssSSS-xxxxxxx (23자)
function correlationId(): string {
  const ts = nowKSTLong().slice(2); // 15자 yyMMddHHmmssSSS
  const rand = randomBytes(4).toString("hex").slice(0, 7);
  return `${ts}-${rand}`;
}

// KMV1:yyyyMMddHHmmssSSS:Base64(HMAC-SHA256(secretKey, bodyString))
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

/** 평문 JSON 요청 (암호화 불필요 엔드포인트) */
export async function konaPost<T>(path: string, body: unknown): Promise<T> {
  const bodyString = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: buildBaseHeaders(bodyString),
    body: bodyString,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`KONA PLATE ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}

/** JWE 암호화 요청 (개인정보 포함 엔드포인트) */
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
  return JSON.parse(text) as T;
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
