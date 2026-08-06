import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function getSecret(primaryName: string, fallbackName: string): string {
  return Deno.env.get(primaryName) ?? Deno.env.get(fallbackName) ?? "";
}

type ExecRow = {
  status: string;
  failure_reason: string | null;
  allowance_rules: { child_id: string; title: string; children: { parent_id: string; name: string } } | null;
};

type PushSubRow = { user_id: string; endpoint: string; p256dh: string; auth: string };

type NotifRow = {
  parent_id: string;
  child_id: string;
  target: "parent";
  type: string;
  title: string;
  body: string;
};

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
    return jsonResponse({ ok: false, error: "Missing Supabase function secrets." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const targetDate = nowKst.toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc("process_scheduled_allowances", {
    p_target_date: targetDate,
  });

  if (error) {
    return jsonResponse({ ok: false, error: error.message }, 500);
  }

  const result = data as { success: number; skipped: number; failed: number; errors: unknown[] };

  // Query today's executions (success + failed) for notifications
  const { data: todayExecs } = await supabase
    .from("allowance_executions")
    .select("status, failure_reason, allowance_rules(child_id, title, children(parent_id, name))")
    .eq("scheduled_date", targetDate)
    .in("status", ["success", "failed"]);

  const notifications: NotifRow[] = [];

  for (const exec of (todayExecs ?? []) as ExecRow[]) {
    const rule = exec.allowance_rules;
    if (!rule?.children?.parent_id) continue;

    if (exec.status === "failed") {
      notifications.push({
        parent_id: rule.children.parent_id,
        child_id: rule.child_id,
        target: "parent",
        type: "allowance_failed",
        title: "정기 용돈 지급 실패",
        body: `'${rule.title}' 용돈 지급에 실패했어요. 사유: ${exec.failure_reason ?? "잔액 부족"}. 지갑을 충전해주세요.`,
      });
    } else if (exec.status === "success") {
      notifications.push({
        parent_id: rule.children.parent_id,
        child_id: rule.child_id,
        target: "parent",
        type: "allowance_paid",
        title: "용돈 지급 완료",
        body: `${rule.children.name}에게 '${rule.title}' 용돈이 지급됐어요!`,
      });
    }
  }

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }

  // Send push notifications
  let pushesSent = 0;
  const vapidSubject = getSecret("VAPID_SUBJECT", "vapid_subject");
  const vapidPublicKey = getSecret("VAPID_PUBLIC_KEY", "vapid_public_key");
  const vapidPrivateKey = getSecret("VAPID_PRIVATE_KEY", "vapid_private_key");

  if (vapidSubject && vapidPublicKey && vapidPrivateKey && notifications.length > 0) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("user_id,endpoint,p256dh,auth");

    const subsByParent = new Map<string, PushSubRow[]>();
    for (const sub of (subs ?? []) as PushSubRow[]) {
      const list = subsByParent.get(sub.user_id) ?? [];
      list.push(sub);
      subsByParent.set(sub.user_id, list);
    }

    const pushResults = await Promise.allSettled(
      notifications.flatMap((notif) =>
        (subsByParent.get(notif.parent_id) ?? []).map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: notif.title, body: notif.body, target: "parent", childId: notif.child_id }),
          )
        )
      ),
    );
    pushesSent = pushResults.filter((r) => r.status === "fulfilled").length;
  }

  return jsonResponse({ ok: true, date: targetDate, ...result, notificationsCreated: notifications.length, pushesSent });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
