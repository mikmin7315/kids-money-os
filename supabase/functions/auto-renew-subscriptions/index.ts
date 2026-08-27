import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function getSecret(primary: string, fallback: string): string {
  return Deno.env.get(primary) ?? Deno.env.get(fallback) ?? "";
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

type ProfileRow = {
  id: string;
  billing_key: string;
  subscription_expires_at: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const cronSecret = getSecret("CRON_SECRET", "SUPABASE_CRON_SECRET");
  if (cronSecret) {
    const incoming = req.headers.get("x-cron-secret") ?? "";
    if (!timingSafeEqual(incoming, cronSecret)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = getSecret("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getSecret("SUPABASE_SERVICE_ROLE_KEY", "");
  const portoneApiSecret = getSecret("PORTONE_API_SECRET", "");
  const storeId = getSecret("PORTONE_STORE_ID", "NEXT_PUBLIC_PORTONE_STORE_ID");

  if (!portoneApiSecret || !storeId) {
    return new Response(JSON.stringify({ error: "PORTONE_API_SECRET or PORTONE_STORE_ID not set" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // 만료 25시간 내 + 취소 안 된 + billing_key 보유 구독자
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(cutoff.getHours() + 25);

  const { data: users, error: fetchError } = await supabase
    .from("profiles")
    .select("id, billing_key, subscription_expires_at")
    .eq("subscription_tier", "plus")
    .not("billing_key", "is", null)
    .is("subscription_cancelled_at", null)
    .lte("subscription_expires_at", cutoff.toISOString())
    .gte("subscription_expires_at", now.toISOString());

  if (fetchError) {
    console.error("fetch error:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ userId: string; status: string; error?: string }> = [];

  for (const user of (users as ProfileRow[] | null) ?? []) {
    const paymentId = `ar-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
    const periodStart = new Date(user.subscription_expires_at);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 31);

    try {
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
            billingKey: user.billing_key,
            orderName: "모나리 플러스 구독 (1개월) — 자동 갱신",
            amount: { total: 3900 },
            currency: "KRW",
            customer: { id: user.id },
          }),
        }
      );

      if (chargeRes.ok) {
        const data = await chargeRes.json() as { status?: string; amount?: { total?: number } };
        if (data.status === "PAID" && data.amount?.total === 3900) {
          await supabase
            .from("profiles")
            .update({ subscription_expires_at: periodEnd.toISOString() })
            .eq("id", user.id);

          await supabase.from("payment_records").insert({
            user_id: user.id,
            payment_id: paymentId,
            amount: 3900,
            status: "paid",
            plan: "plus",
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
          });

          results.push({ userId: user.id, status: "renewed" });
          continue;
        }
      }

      // 결제 실패 → 부모 알림
      await supabase.from("notifications").insert({
        parent_id: user.id,
        child_id: null,
        target: "parent",
        type: "subscription_renewal_failed",
        title: "구독 자동 갱신 실패",
        body: "이번 달 플러스 구독 자동 결제에 실패했어요. 결제 수단을 확인해 주세요.",
        is_read: false,
      });

      results.push({ userId: user.id, status: "failed" });
    } catch (e) {
      console.error("renewal error for", user.id, e);
      results.push({ userId: user.id, status: "error", error: String(e) });
    }
  }

  console.log(`auto-renew-subscriptions: processed ${results.length} subscriptions`);
  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
