"use server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// KONA PLATE 실시간 웹훅 수신기
// 결제 승인(APPROVE), 취소(CANCEL), 편의점 충전(TOP_UP) 이벤트 처리
// 웹훅 포맷은 KONA PLATE 연동 가이드 기준 (Sandbox 환경)

const WEBHOOK_SECRET = process.env.KONAPLATE_WEBHOOK_SECRET ?? "";

function verifyRequest(req: NextRequest): boolean {
  if (!WEBHOOK_SECRET) return true;
  const token = req.headers.get("x-km-webhook-token")
    ?? req.headers.get("x-km-webhook-signature")
    ?? req.headers.get("authorization")?.replace("Bearer ", "");
  return token === WEBHOOK_SECRET;
}

// KONA PLATE 카테고리 코드 → 내부 카테고리
function mapCategory(raw: string, eventType: string): string {
  if (eventType === "TOP_UP" || eventType === "TOPUP") return "convenience_top_up";
  const map: Record<string, string> = {
    CVS: "convenience", CONVENIENCE: "convenience",
    FOOD: "food", RESTAURANT: "food", CAFE: "food",
    EDUCATION: "education", BOOK: "education",
    TRANSPORT: "transport", BUS: "transport", SUBWAY: "transport", TAXI: "transport",
    ENTERTAINMENT: "entertainment", GAME: "entertainment",
    SHOPPING: "shopping", CLOTHES: "shopping", FASHION: "shopping",
    MART: "mart", SUPERMARKET: "mart", GROCERY: "mart",
    PHARMACY: "pharmacy", DRUG: "pharmacy",
    MEDICAL: "medical", HOSPITAL: "medical",
  };
  return map[raw.toUpperCase()] ?? raw.toLowerCase();
}

// YYYYMMDDHHMMSS → ISO 8601 (KST)
function parseKonaTime(raw: string): string {
  if (raw.length === 14) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T`
      + `${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}+09:00`;
  }
  return new Date().toISOString();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const userId = String(payload.userId ?? payload.user_id ?? "");
  const eventType = String(payload.eventType ?? payload.event_type ?? "APPROVE").toUpperCase();

  if (!userId) return NextResponse.json({ ok: true });

  // konaplate userId로 card_applications → child_cards 조회
  const { data: app } = await supabase
    .from("card_applications")
    .select("id, child_id, parent_id")
    .eq("external_reference", userId)
    .maybeSingle();

  if (!app) {
    console.warn("[konaplate webhook] unknown userId:", userId);
    await supabase.from("card_integration_logs").insert({
      event_type: "webhook_unknown_user",
      request: payload,
      error_message: `Unknown userId: ${userId}`,
      status_code: 200,
    });
    return NextResponse.json({ ok: true });
  }

  const { data: card } = await supabase
    .from("child_cards")
    .select("id")
    .eq("application_id", app.id)
    .maybeSingle();

  if (!card) return NextResponse.json({ ok: true });

  const amount = Number(payload.amount ?? payload.transactionAmount ?? 0);
  const rawMerchant = String(payload.merchantName ?? payload.merchant_name ?? "");
  const rawCategory = String(payload.merchantCategory ?? payload.merchant_category ?? "");
  const transactionId = String(payload.transactionId ?? payload.tid ?? payload.transaction_id ?? "");
  const approvedAt = parseKonaTime(String(payload.approvedAt ?? payload.approved_at ?? ""));

  const merchantCategory = mapCategory(rawCategory, eventType);
  const isTopUp = merchantCategory === "convenience_top_up";
  const merchantName = rawMerchant || (isTopUp ? "편의점 충전" : "가맹점 미상");

  const status =
    eventType === "CANCEL" || eventType === "REVERSE" ? "cancelled"
    : eventType === "REVERSED" ? "reversed"
    : "approved";

  // 웹훅 로그
  await supabase.from("card_integration_logs").insert({
    card_id: card.id,
    event_type: `webhook_${eventType.toLowerCase()}`,
    request: payload,
    response: { merchantName, amount, status },
    status_code: 200,
  });

  // 거래 삽입 (transactionId 기반 중복 방지 — raw_payload에 저장 후 체크)
  if (transactionId) {
    const { count } = await supabase
      .from("card_transactions")
      .select("id", { count: "exact", head: true })
      .eq("card_id", card.id)
      .contains("raw_payload", { transactionId });
    if ((count ?? 0) > 0) return NextResponse.json({ ok: true }); // 중복 웹훅
  }

  await supabase.from("card_transactions").insert({
    card_id: card.id,
    child_id: app.child_id,
    merchant_name: merchantName,
    merchant_category: merchantCategory,
    amount,
    status,
    approved_at: approvedAt,
    raw_payload: payload,
  });

  return NextResponse.json({ ok: true });
}
