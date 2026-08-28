import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

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

type ChildRow = { id: string; parent_id: string; name: string };
type PushSubRow = { user_id: string; endpoint: string; p256dh: string; auth: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  if (!verifyCronSecret(req)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const supabaseUrl = getSecret("SUPABASE_URL", "supabase_url");
  const serviceRoleKey = getSecret("SUPABASE_SERVICE_ROLE_KEY", "supabase_service_role_key");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "Missing Supabase function secrets." }, 500);
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
    return jsonResponse({ ok: false, error: error.message }, 500);
  }

  // Notify each parent that interest has been settled for their children
  const { data: children } = await supabase
    .from("children")
    .select("id, parent_id, name")
    .is("deleted_at", null);

  const notifications = ((children ?? []) as ChildRow[]).flatMap((child) => [
    {
      parent_id: child.parent_id,
      child_id: child.id,
      target: "parent" as const,
      type: "interest_paid",
      title: "이자 정산 완료",
      body: `${child.name}의 ${month}월 이자가 지급됐어요. 통장을 확인해보세요!`,
    },
    {
      parent_id: child.parent_id,
      child_id: child.id,
      target: "child" as const,
      type: "interest_settled",
      title: "이자가 생겼어요! 📈",
      body: `${month}월 이자가 내 통장에 들어왔어요. 잔액을 확인해볼까요?`,
    },
  ]);

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

  return jsonResponse({ ...(data as object), notificationsCreated: notifications.length, pushesSent });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
