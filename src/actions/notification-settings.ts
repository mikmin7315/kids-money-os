"use server";

import { revalidatePath } from "next/cache";
import { getChildModeContext, requireAdminSession, requireAppConsent, requireParentSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type FormState = { ok: boolean; message: string };

export async function getNotificationPreferencesAction(
  ownerType: "parent" | "child",
  ownerId: string,
): Promise<Record<string, boolean>> {
  if (isDemoMode()) return {};
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from("notification_preferences")
      .select("notif_type, enabled")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId);
    const result: Record<string, boolean> = {};
    (data ?? []).forEach((row) => {
      result[String(row.notif_type)] = Boolean(row.enabled);
    });
    return result;
  } catch {
    return {};
  }
}

export async function toggleParentNotificationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, message: "로그인이 필요합니다." };
  if (isDemoMode()) return { ok: true, message: "데모 모드에서는 저장되지 않습니다." };

  const notifType = String(formData.get("notif_type") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!notifType) return { ok: false, message: "잘못된 요청입니다." };

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("notification_preferences").upsert(
      { owner_type: "parent", owner_id: auth.user.id, notif_type: notifType, enabled },
      { onConflict: "owner_type,owner_id,notif_type" },
    );
    if (error) throw error;
    revalidatePath("/settings/notifications");
    return { ok: true, message: "저장됐습니다." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "저장 실패." };
  }
}

export async function toggleChildNotificationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireAppConsent();
  const childMode = await getChildModeContext();
  if (!auth.user || !childMode.childId) return { ok: false, message: "로그인이 필요합니다." };
  if (isDemoMode()) return { ok: true, message: "데모 모드에서는 저장되지 않습니다." };

  const notifType = String(formData.get("notif_type") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!notifType) return { ok: false, message: "잘못된 요청입니다." };

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("notification_preferences").upsert(
      { owner_type: "child", owner_id: childMode.childId, notif_type: notifType, enabled },
      { onConflict: "owner_type,owner_id,notif_type" },
    );
    if (error) throw error;
    revalidatePath(`/child/${childMode.childId}/notification-settings`);
    return { ok: true, message: "저장됐습니다." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "저장 실패." };
  }
}

export async function updateNotificationTemplateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireAdminSession();
  if (isDemoMode()) return { ok: true, message: "데모 모드에서는 저장되지 않습니다." };

  const notifType = String(formData.get("notif_type") ?? "");
  const titleTemplate = String(formData.get("title_template") ?? "").trim();
  const bodyTemplate = String(formData.get("body_template") ?? "").trim();
  const isActive = formData.get("is_active") === "true";
  if (!notifType || !titleTemplate || !bodyTemplate) {
    return { ok: false, message: "제목과 본문을 입력해주세요." };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("notification_templates")
      .update({
        title_template: titleTemplate,
        body_template: bodyTemplate,
        is_active: isActive,
        updated_by: auth.user?.id ?? null,
      })
      .eq("notif_type", notifType);
    if (error) throw error;
    revalidatePath("/admin/notification-templates");
    return { ok: true, message: "템플릿이 저장됐습니다." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "저장 실패." };
  }
}
