import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function verifyWebhookSignature(
  rawBody: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string
): Promise<boolean> {
  try {
    const data = new TextEncoder().encode(`${webhookId}.${webhookTimestamp}.${rawBody}`);
    const keyData = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);

    for (const sig of webhookSignature.split(" ")) {
      const v1Sig = sig.replace(/^v1,/, "");
      const sigBytes = Uint8Array.from(atob(v1Sig), (c) => c.charCodeAt(0));
      if (await crypto.subtle.verify("HMAC", key, sigBytes, data)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

type WebhookPayload = {
  type: string;
  data: {
    paymentId?: string;
    storeId?: string;
  };
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Svix 서명 검증 (선택적 — PORTONE_WEBHOOK_SECRET 설정 시 강제)
  const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const valid = await verifyWebhookSignature(
      rawBody,
      req.headers.get("webhook-id") ?? "",
      req.headers.get("webhook-timestamp") ?? "",
      req.headers.get("webhook-signature") ?? "",
      webhookSecret
    );
    if (!valid) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const portoneApiSecret = process.env.PORTONE_API_SECRET;
  if (!portoneApiSecret) return NextResponse.json({ ok: true });

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  if (payload.type === "Transaction.Paid") {
    const paymentId = payload.data.paymentId;
    if (!paymentId) return NextResponse.json({ ok: true });

    // 포트원 API 재검증
    const portoneRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `PortOne ${portoneApiSecret}` } }
    );
    if (!portoneRes.ok) return NextResponse.json({ ok: true });

    const payment = await portoneRes.json() as { status?: string; totalAmount?: number };
    if (payment.status !== "PAID" || payment.totalAmount !== 3900) {
      return NextResponse.json({ ok: true });
    }

    // 이미 처리된 결제면 구독 상태 보정만
    const { data: existing } = await adminSupabase
      .from("payment_records")
      .select("user_id, period_end")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (existing) {
      await adminSupabase
        .from("profiles")
        .update({
          subscription_tier: "plus",
          subscription_expires_at: existing.period_end,
          subscription_cancelled_at: null,
        })
        .eq("id", existing.user_id);
    }
  }

  if (payload.type === "Transaction.Cancelled") {
    const paymentId = payload.data.paymentId;
    if (!paymentId) return NextResponse.json({ ok: true });

    await adminSupabase
      .from("payment_records")
      .update({ status: "cancelled" })
      .eq("payment_id", paymentId);
  }

  return NextResponse.json({ ok: true });
}
