import { NextRequest, NextResponse } from "next/server";
import { requireParentSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let auth;
  try {
    auth = await requireParentSession();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { billingKey } = await req.json() as { billingKey?: string };
  if (!billingKey) {
    return NextResponse.json({ message: "billingKey 누락" }, { status: 400 });
  }

  const portoneApiSecret = process.env.PORTONE_API_SECRET;
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  if (!portoneApiSecret || !storeId) {
    return NextResponse.json({ message: "서버 설정 오류" }, { status: 500 });
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const paymentId = `mr-${auth.user!.id.slice(0, 8)}-${Date.now().toString(36)}`;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 31);

  // 빌링키로 즉시 결제
  const chargeRes = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/instant`,
    {
      method: "POST",
      headers: {
        Authorization: `PortOne ${portoneApiSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storeId,
        billingKey,
        orderName: "모나리 플러스 구독 (1개월)",
        amount: { total: 3900 },
        currency: "KRW",
        customer: { id: auth.user!.id, email: auth.user!.email },
      }),
    }
  );

  if (!chargeRes.ok) {
    const errData = await chargeRes.json().catch(() => ({})) as { message?: string };
    return NextResponse.json(
      { message: errData.message ?? "결제에 실패했어요. 카드 정보를 확인해 주세요." },
      { status: 400 }
    );
  }

  const chargeData = await chargeRes.json() as { status?: string; amount?: { total?: number } };
  if (chargeData.status !== "PAID" || chargeData.amount?.total !== 3900) {
    return NextResponse.json({ message: "결제 금액 또는 상태가 올바르지 않아요" }, { status: 400 });
  }

  // 빌링키 저장 + 구독 활성화
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({
      billing_key: billingKey,
      billing_key_issued_at: now.toISOString(),
      subscription_tier: "plus",
      subscription_expires_at: periodEnd.toISOString(),
      subscription_cancelled_at: null,
    })
    .eq("id", auth.user!.id);

  if (profileError) {
    return NextResponse.json({ message: "구독 처리 중 오류" }, { status: 500 });
  }

  // 결제 기록 저장 (멱등: payment_id unique)
  await adminSupabase.from("payment_records").insert({
    user_id: auth.user!.id,
    payment_id: paymentId,
    amount: 3900,
    status: "paid",
    plan: "plus",
    period_start: now.toISOString(),
    period_end: periodEnd.toISOString(),
  });

  return NextResponse.json({ ok: true });
}
