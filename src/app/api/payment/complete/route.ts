import { NextRequest, NextResponse } from "next/server";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

  // 포트원 V2 결제 검증
  const portoneApiSecret = process.env.PORTONE_API_SECRET;
  if (!portoneApiSecret) {
    return NextResponse.json({ message: "서버 설정 오류" }, { status: 500 });
  }

  const portoneRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${portoneApiSecret}` },
  });

  if (!portoneRes.ok) {
    return NextResponse.json({ message: "결제 검증 실패" }, { status: 400 });
  }

  const payment = await portoneRes.json() as { status?: string; totalAmount?: number };

  if (payment.status !== "PAID" || payment.totalAmount !== 3900) {
    return NextResponse.json({ message: "결제 금액 또는 상태가 올바르지 않아요" }, { status: 400 });
  }

  // 구독 티어 업그레이드 (service role key 사용)
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await adminSupabase
    .from("profiles")
    .update({ subscription_tier: "plus" })
    .eq("id", auth.user!.id);

  if (error) {
    return NextResponse.json({ message: "구독 처리 중 오류" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
