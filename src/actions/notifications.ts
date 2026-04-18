"use server";

import { requireParentSession, getChildModeContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/data";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export type AppNotification = {
  id: string;
  childId: string | null;
  target: "parent" | "child";
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

type ActionResult<T> = { ok: boolean; data?: T; error?: string };

function mapRow(n: Record<string, unknown>): AppNotification {
  return {
    id: String(n.id),
    childId: n.child_id ? String(n.child_id) : null,
    target: n.target as "parent" | "child",
    type: String(n.type),
    title: String(n.title),
    body: String(n.body),
    isRead: Boolean(n.is_read),
    createdAt: String(n.created_at),
  };
}

export async function fetchParentNotificationsAction(): Promise<ActionResult<AppNotification[]>> {
  if (!hasSupabaseEnv()) return { ok: true, data: [] };

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("target", "parent")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { ok: true, data: (data ?? []).map(mapRow) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "알림 조회 실패." };
  }
}

export async function fetchChildNotificationsAction(childId: string): Promise<ActionResult<AppNotification[]>> {
  if (!hasSupabaseEnv()) return { ok: true, data: [] };

  // Verify caller is this child (child_mode cookie) or parent
  const [auth, childMode] = await Promise.all([
    requireParentSession().catch(() => null),
    getChildModeContext(),
  ]);
  const isParent = auth?.user != null;
  const isChild = childMode.childId === childId;
  if (!isParent && !isChild) return { ok: false, error: "권한 없음" };

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .select("*")
      .eq("target", "child")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { ok: true, data: (data ?? []).map(mapRow) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "알림 조회 실패." };
  }
}

export async function countUnreadParentNotificationsAction(): Promise<number> {
  if (!hasSupabaseEnv()) return 0;
  try {
    const supabase = await getSupabaseServerClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("target", "parent")
      .eq("is_read", false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationsReadAction(ids: string[]): Promise<ActionResult<void>> {
  if (!hasSupabaseEnv() || ids.length === 0) return { ok: true };
  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "읽음 처리 실패." };
  }
}
