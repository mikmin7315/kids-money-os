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

  const { paymentId } = await req.json() as { paymentId?: string };
  if (!paymentId) {
    return NextResponse.json({ message: "paymentId 누락" }, { status: 400 });
  }

  const portoneApiSecret = process.env.PORTONE_API_SECRET;
  if (!portoneApiSecret) {
    return NextResponse.json({ message: "서버 설정 오류" }, { status: 500 });
  }

  // 포트원 V2 결제 검증
  const portoneRes = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `PortOne ${portoneApiSecret}` } }
  );

  if (!portoneRes.ok) {
    return NextResponse.json({ message: "결제 검증 실패" }, { status: 400 });
  }

  const payment = await portoneRes.json() as { status?: string; amount?: { total?: number } };

  if (payment.status !== "PAID" || payment.amount?.total !== 3900) {
    return NextResponse.json({ message: "결제 금액 또는 상태가 올바르지 않아요" }, { status: 400 });
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 31);

  // 결제 기록 저장 (중복 paymentId는 무시)
  const { error: recordError } = await adminSupabase.from("payment_records").insert({
    user_id: auth.user!.id,
    payment_id: paymentId,
    amount: 3900,
    status: "paid",
    plan: "plus",
    period_start: now.toISOString(),
    period_end: periodEnd.toISOString(),
  });

  if (recordError && recordError.code !== "23505") {
    return NextResponse.json({ message: "결제 기록 저장 실패" }, { status: 500 });
  }

  // 구독 티어·만료일 업데이트
  const { error } = await adminSupabase
    .from("profiles")
    .update({
      subscription_tier: "plus",
      subscription_expires_at: periodEnd.toISOString(),
      subscription_cancelled_at: null,
    })
    .eq("id", auth.user!.id);

  if (error) {
    return NextResponse.json({ message: "구독 처리 중 오류" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
