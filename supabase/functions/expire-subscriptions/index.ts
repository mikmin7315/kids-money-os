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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("expire_subscriptions");

  if (error) {
    console.error("expire_subscriptions error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  console.log(`Expired ${data} subscriptions`);
  return new Response(JSON.stringify({ ok: true, expired: data }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
