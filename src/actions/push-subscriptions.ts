"use server";

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import { requireParentSession } from "@/lib/auth";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function subscribePushAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ ok: boolean }> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: auth.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "user_id,endpoint" },
  );
  return { ok: !error };
}

export async function unsubscribePushAction(endpoint: string): Promise<{ ok: boolean }> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false };

  const supabase = await getSupabaseServerClient();
  await supabase.from("push_subscriptions").delete().eq("user_id", auth.user.id).eq("endpoint", endpoint);
  return { ok: true };
}

// 서버 내부에서 호출: 특정 userId에게 푸시 전송
export async function sendPushToUser(userId: string, title: string, body: string): Promise<void> {
  if (!process.env.VAPID_PRIVATE_KEY) return;

  try {
    const admin = getSupabaseAdminClient();
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subs?.length) return;

    await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body }),
        ).catch(() => {}),
      ),
    );
  } catch {
    // 푸시 실패는 메인 플로우를 막지 않음
  }
}
