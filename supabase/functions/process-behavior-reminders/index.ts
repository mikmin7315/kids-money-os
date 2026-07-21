import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type ChildRow = { id: string; parent_id: string; name: string };
type PendingLogRow = { child_id: string };
type PreferenceRow = {
  owner_type: "parent" | "child";
  owner_id: string;
  notif_type: string;
  enabled: boolean;
};
type PushSubscriptionRow = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function getSecret(primaryName: string, fallbackName: string): string {
  return Deno.env.get(primaryName) ?? Deno.env.get(fallbackName) ?? "";
}

function isAuthorized(req: Request): boolean {
  const cronSecret = getSecret("CRON_SECRET", "cron_secret");
  if (!cronSecret) return true;

  const incoming = req.headers.get("x-cron-secret") ?? "";
  const encoder = new TextEncoder();
  const incomingBytes = encoder.encode(incoming.padEnd(64));
  const secretBytes = encoder.encode(cronSecret.padEnd(64));
  let difference = 0;
  for (let index = 0; index < incomingBytes.length; index += 1) {
    difference |= incomingBytes[index] ^ secretBytes[index];
  }
  return difference === 0 && incoming.length === cronSecret.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  if (!isAuthorized(req)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const supabaseUrl = getSecret("SUPABASE_URL", "supabase_url");
  const serviceRoleKey = getSecret("SUPABASE_SERVICE_ROLE_KEY", "supabase_service_role_key");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "Missing Supabase function secrets." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();
  const nowKst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayKst = nowKst.toISOString().slice(0, 10);
  const kstStartUtc = new Date(`${todayKst}T00:00:00+09:00`).toISOString();
  const staleCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const [childrenResult, rulesResult, pendingResult, preferencesResult, existingResult, subscriptionsResult] = await Promise.all([
    supabase.from("children").select("id,parent_id,name"),
    supabase.from("behavior_rules").select("parent_id").eq("is_active", true),
    supabase
      .from("behavior_logs")
      .select("child_id")
      .eq("status", "pending")
      .lte("created_at", staleCutoff),
    supabase
      .from("notification_preferences")
      .select("owner_type,owner_id,notif_type,enabled")
      .in("notif_type", ["daily_behavior_reminder", "stale_behavior_approval"]),
    supabase
      .from("notifications")
      .select("child_id,target,type")
      .in("type", ["daily_behavior_reminder", "stale_behavior_approval"])
      .gte("created_at", kstStartUtc),
    supabase.from("push_subscriptions").select("user_id,endpoint,p256dh,auth"),
  ]);

  for (const result of [childrenResult, rulesResult, pendingResult, preferencesResult, existingResult, subscriptionsResult]) {
    if (result.error) return jsonResponse({ ok: false, error: result.error.message }, 500);
  }

  const children = (childrenResult.data ?? []) as ChildRow[];
  const pendingLogs = (pendingResult.data ?? []) as PendingLogRow[];
  const preferences = (preferencesResult.data ?? []) as PreferenceRow[];
  const subscriptions = (subscriptionsResult.data ?? []) as PushSubscriptionRow[];
  const parentsWithActiveRules = new Set(
    (rulesResult.data ?? []).map((rule) => String(rule.parent_id)),
  );
  const existingKeys = new Set(
    (existingResult.data ?? []).map((row) => `${row.type}:${row.target}:${row.child_id ?? ""}`),
  );
  const pendingCounts = new Map<string, number>();
  for (const log of pendingLogs) {
    pendingCounts.set(log.child_id, (pendingCounts.get(log.child_id) ?? 0) + 1);
  }

  const notifications: Array<{
    parent_id: string;
    child_id: string;
    target: "parent" | "child";
    type: string;
    title: string;
    body: string;
  }> = [];

  for (const child of children) {
    if (
      parentsWithActiveRules.has(child.parent_id) &&
      isEnabled(preferences, "child", child.id, "daily_behavior_reminder") &&
      !existingKeys.has(`daily_behavior_reminder:child:${child.id}`)
    ) {
      notifications.push({
        parent_id: child.parent_id,
        child_id: child.id,
        target: "child",
        type: "daily_behavior_reminder",
        title: "오늘 약속 체크했나요?",
        body: `${child.name}님, 오늘 실천한 약속을 기록해 보세요!`,
      });
    }

    const pendingCount = pendingCounts.get(child.id) ?? 0;
    if (
      pendingCount > 0 &&
      isEnabled(preferences, "parent", child.parent_id, "stale_behavior_approval") &&
      !existingKeys.has(`stale_behavior_approval:parent:${child.id}`)
    ) {
      notifications.push({
        parent_id: child.parent_id,
        child_id: child.id,
        target: "parent",
        type: "stale_behavior_approval",
        title: "확인할 약속 기록이 있어요",
        body: `${child.name}님의 3일 이상 기다린 약속 기록 ${pendingCount}건을 확인해 주세요.`,
      });
    }
  }

  if (notifications.length > 0) {
    const { error } = await supabase.from("notifications").insert(notifications);
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
  }

  const vapidSubject = getSecret("VAPID_SUBJECT", "vapid_subject");
  const vapidPublicKey = getSecret("VAPID_PUBLIC_KEY", "vapid_public_key");
  const vapidPrivateKey = getSecret("VAPID_PRIVATE_KEY", "vapid_private_key");
  let pushesSent = 0;

  if (vapidSubject && vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const subscriptionsByParent = new Map<string, PushSubscriptionRow[]>();
    for (const subscription of subscriptions) {
      const parentSubscriptions = subscriptionsByParent.get(subscription.user_id) ?? [];
      parentSubscriptions.push(subscription);
      subscriptionsByParent.set(subscription.user_id, parentSubscriptions);
    }

    const pushResults = await Promise.allSettled(
      notifications.flatMap((notification) =>
        (subscriptionsByParent.get(notification.parent_id) ?? []).map((subscription) =>
          webpush.sendNotification(
            { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
            JSON.stringify({
              title: notification.title,
              body: notification.body,
              target: notification.target,
              childId: notification.child_id,
            }),
          ),
        ),
      ),
    );
    pushesSent = pushResults.filter((result) => result.status === "fulfilled").length;
  }

  return jsonResponse({ ok: true, date: todayKst, notificationsCreated: notifications.length, pushesSent });
});

function isEnabled(
  preferences: PreferenceRow[],
  ownerType: PreferenceRow["owner_type"],
  ownerId: string,
  notificationType: string,
): boolean {
  return preferences.find(
    (preference) =>
      preference.owner_type === ownerType &&
      preference.owner_id === ownerId &&
      preference.notif_type === notificationType,
  )?.enabled !== false;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
