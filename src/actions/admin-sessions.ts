"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type SessionFormState = { ok: boolean; message: string };

export async function forceLogoutAction(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const auth = await requireAdminSession();
  const targetUserId = String(formData.get("user_id") ?? "");
  if (!targetUserId) return { ok: false, message: "대상 사용자가 없습니다." };
  if (targetUserId === auth.user?.id) return { ok: false, message: "자신은 강제 로그아웃할 수 없습니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.signOut(targetUserId, "global");
  if (error) return { ok: false, message: error.message };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "force_logout",
    resource_type: "user_session",
    resource_id: targetUserId,
  });

  revalidatePath("/admin/sessions");
  return { ok: true, message: "로그아웃 처리 완료" };
}
