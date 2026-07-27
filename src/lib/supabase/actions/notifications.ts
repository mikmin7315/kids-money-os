"use server";

import { getChildModeContext, requireAppConsent, requireParentSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { type AppNotification, mapNotificationRow } from "@/lib/supabase/notification-types";

type ActionResult<T> = { ok: boolean; data?: T; error?: string };

export async function fetchParentNotificationsAction(): Promise<ActionResult<AppNotification[]>> {
  if (isDemoMode()) return { ok: true, data: [] };

  try {
    const auth = await requireParentSession();
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("parent_id", auth.user!.id)
      .eq("target", "parent")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { ok: true, data: (data ?? []).map(mapNotificationRow) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "알림 조회 실패." };
  }
}

export async function fetchChildNotificationsAction(childId: string): Promise<ActionResult<AppNotification[]>> {
  if (isDemoMode()) return { ok: true, data: [] };

  try {
    const [auth, childMode] = await Promise.all([requireAppConsent(), getChildModeContext()]);
    if (!auth.user) return { ok: false, error: "권한 없음" };
    if (!childMode.childId || childMode.childId !== childId) return { ok: false, error: "권한 없음" };

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("target", "child")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { ok: true, data: (data ?? []).map(mapNotificationRow) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "알림 조회 실패." };
  }
}

export async function countUnreadParentNotificationsAction(): Promise<number> {
  if (isDemoMode()) return 0;

  try {
    const auth = await requireParentSession();
    const supabase = await getSupabaseServerClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", auth.user!.id)
      .eq("target", "parent")
      .eq("is_read", false);

    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function countUnreadChildNotificationsAction(childId: string): Promise<number> {
  if (isDemoMode()) return 0;

  try {
    const [auth, childMode] = await Promise.all([requireAppConsent(), getChildModeContext()]);
    if (!auth.user) return 0;
    if (!childMode.childId || childMode.childId !== childId) return 0;

    const supabase = await getSupabaseServerClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("target", "child")
      .eq("child_id", childId)
      .eq("is_read", false);

    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationsReadAction(ids: string[]): Promise<ActionResult<void>> {
  const uniqueIds = [...new Set(ids)].slice(0, 50);
  if (isDemoMode() || uniqueIds.length === 0) return { ok: true };

  try {
    const [auth, childMode] = await Promise.all([requireAppConsent(), getChildModeContext()]);
    if (!auth.user) return { ok: false, error: "권한 없음" };

    const supabase = await getSupabaseServerClient();
    if (childMode.childId) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", uniqueIds)
        .eq("target", "child")
        .eq("child_id", childMode.childId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", uniqueIds)
        .eq("target", "parent")
        .eq("parent_id", auth.user.id);
      if (error) throw error;
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "읽음 처리 실패." };
  }
}
