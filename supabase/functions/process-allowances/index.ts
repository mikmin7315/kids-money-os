import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function getSecret(primaryName: string, fallbackName: string): string {
  return Deno.env.get(primaryName) ?? Deno.env.get(fallbackName) ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const cronSecret = getSecret("CRON_SECRET", "cron_secret");
  if (cronSecret) {
    const incoming = req.headers.get("x-cron-secret") ?? "";
    const enc = new TextEncoder();
    const a = enc.encode(incoming.padEnd(64));
    const b = enc.encode(cronSecret.padEnd(64));
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    if (diff !== 0 || incoming.length !== cronSecret.length) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
  }

  const supabaseUrl = getSecret("SUPABASE_URL", "supabase_url");
  const serviceRoleKey = getSecret("SUPABASE_SERVICE_ROLE_KEY", "supabase_service_role_key");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: "Missing Supabase function secrets." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Today's date in KST.
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const targetDate = nowKst.toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc("process_scheduled_allowances", {
    p_target_date: targetDate,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Notify parents when scheduled allowance processing has failures.
  const result = data as { success: number; skipped: number; failed: number; errors: unknown[] };
  if (result.failed > 0) {
    const { data: failedExecs } = await supabase
      .from("allowance_executions")
      .select("allowance_rule_id, failure_reason, allowance_rules(child_id, title, children(parent_id))")
      .eq("scheduled_date", targetDate)
      .eq("status", "failed");

    for (const exec of failedExecs ?? []) {
      const rule = exec.allowance_rules as { child_id: string; title: string; children: { parent_id: string } };
      if (!rule?.children?.parent_id) continue;
      await supabase.from("notifications").insert({
        parent_id: rule.children.parent_id,
        child_id: rule.child_id,
        target: "parent",
        type: "allowance_failed",
        title: "정기 용돈 지급 실패",
        body: `'${rule.title}' 용돈 지급에 실패했어요. 사유: ${exec.failure_reason ?? "잔액 부족"}. 지갑을 충전해주세요.`,
      });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, date: targetDate, ...result }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
