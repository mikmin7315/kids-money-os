import { hasSupabaseEnv } from "@/lib/data";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type InsertParams = {
  parentId: string;
  childId?: string;
  target: "parent" | "child";
  type: string;
  title: string;
  body: string;
};

export async function insertNotification(params: InsertParams): Promise<void> {
  if (!hasSupabaseEnv()) return;
  try {
    const admin = getSupabaseAdminClient();
    await admin.from("notifications").insert({
      parent_id: params.parentId,
      child_id: params.childId ?? null,
      target: params.target,
      type: params.type,
      title: params.title,
      body: params.body,
    });
  } catch {
    // Notification failure must never block the caller
  }
}

export async function getParentIdForChild(childId: string): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("children")
      .select("parent_id")
      .eq("id", childId)
      .maybeSingle();
    return data?.parent_id ?? null;
  } catch {
    return null;
  }
}
