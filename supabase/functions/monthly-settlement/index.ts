import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function getSecret(primaryName: string, fallbackName: string): string {
  return Deno.env.get(primaryName) ?? Deno.env.get(fallbackName) ?? "";
}

function verifyCronSecret(req: Request): boolean {
  const cronSecret = getSecret("CRON_SECRET", "cron_secret");
  if (!cronSecret) return true;
  const incoming = req.headers.get("x-cron-secret") ?? "";
  if (incoming.length !== cronSecret.length) return false;
  const enc = new TextEncoder();
  const a = enc.encode(incoming.padEnd(64));
  const b = enc.encode(cronSecret.padEnd(64));
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  if (!verifyCronSecret(req)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const supabaseUrl = getSecret("SUPABASE_URL", "supabase_url");
  const serviceRoleKey = getSecret("SUPABASE_SERVICE_ROLE_KEY", "supabase_service_role_key");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: "Missing Supabase function secrets." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Target = previous month in KST.
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = nowKst.getUTCMonth() === 0 ? nowKst.getUTCFullYear() - 1 : nowKst.getUTCFullYear();
  const month = nowKst.getUTCMonth() === 0 ? 12 : nowKst.getUTCMonth();

  const { data, error } = await supabase.rpc("run_monthly_settlement", {
    p_year: year,
    p_month: month,
  });

  if (error) {
    console.error("monthly-settlement RPC failed:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
