/**
 * KONA PLATE API 클라이언트
 * Sandbox(MOCK) 환경 기준 구현
 * 환경변수:
 *   KONAPLATE_ASP_ID        - 서비스 제공자 ID (15자)
 *   KONAPLATE_ACCESS_KEY    - MOCK 액세스 키 (40자)
 *   KONAPLATE_SECRET_KEY    - MOCK 시크릿 키
 *   KONAPLATE_BASE_URL      - Sandbox base URL
 */

const BASE_URL = process.env.KONAPLATE_BASE_URL ?? "https://mock-api.konaplate.com";
const ASP_ID = process.env.KONAPLATE_ASP_ID ?? "";
const ACCESS_KEY = process.env.KONAPLATE_ACCESS_KEY ?? "";
const SECRET_KEY = process.env.KONAPLATE_SECRET_KEY ?? "";

function nowKST(): string {
  return new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14); // YYYYMMDDHHMMSS
}

function correlationId(): string {
  const ts = nowKST().slice(2); // yyMMddHHmiSS (12자)
  const rand = Math.random().toString(36).slice(2, 10).padEnd(8, "0"); // 8자
  return ts + rand; // 20자
}

// X-KM-Tran-Token: HMAC-SHA256(ACCESS_KEY + tranTime, SECRET_KEY) → hex (64자) + 패딩 2자 = 66자
async function makeTranToken(tranTime: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(ACCESS_KEY + tranTime));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // 64자
  return hex + "00"; // 66자
}

async function buildHeaders(extra?: Record<string, string>) {
  const tranTime = nowKST();
  const tranToken = await makeTranToken(tranTime);
  return {
    "Content-Type": "application/json",
    "X-KM-User-AspId": ASP_ID,
    "X-KM-Correlation-Id": correlationId(),
    "X-KM-Access-Key": ACCESS_KEY,
    "X-KM-Tran-Token": tranToken,
    "X-KM-Tran-Time": tranTime,
    "X-KM-Time-Zone": "KST",
    ...extra,
  };
}

export async function konaPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KONA PLATE API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function konaGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: await buildHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KONA PLATE API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
