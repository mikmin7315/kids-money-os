"use server";

import { revalidatePath } from "next/cache";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type GuardianFormState = { ok: boolean; message: string };

export async function inviteGuardianAction(
  _prev: GuardianFormState,
  formData: FormData,
): Promise<GuardianFormState> {
  await requireParentSession();
  const auth = await requireParentSession();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, message: "이메일을 올바르게 입력해주세요." };

  const supabase = await getSupabaseServerClient();

  // 본인 이메일 방지
  const { data: me } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", auth.user!.id)
    .maybeSingle();
  if (me?.email === email) return { ok: false, message: "본인 이메일로는 초대할 수 없어요." };

  // 기존 대기 초대 확인
  const { data: existing } = await supabase
    .from("guardian_invites")
    .select("id")
    .eq("parent_id", auth.user!.id)
    .eq("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (existing) return { ok: false, message: "이미 초대가 전송된 이메일이에요." };

  const { error } = await supabase.from("guardian_invites").insert({
    parent_id: auth.user!.id,
    email,
    status: "pending",
  });
  if (error) return { ok: false, message: "초대 전송에 실패했어요." };

  revalidatePath("/settings/guardians");
  return { ok: true, message: `${email}에 초대를 전송했어요. (7일 유효)` };
}

export async function cancelInviteAction(
  _prev: GuardianFormState,
  formData: FormData,
): Promise<GuardianFormState> {
  const auth = await requireParentSession();
  const inviteId = String(formData.get("invite_id") ?? "");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("guardian_invites")
    .update({ status: "cancelled" })
    .eq("id", inviteId)
    .eq("parent_id", auth.user!.id);
  if (error) return { ok: false, message: "취소에 실패했어요." };
  revalidatePath("/settings/guardians");
  return { ok: true, message: "초대를 취소했어요." };
}

export async function updateGuardianPermissionsAction(
  _prev: GuardianFormState,
  formData: FormData,
): Promise<GuardianFormState> {
  const auth = await requireParentSession();
  const guardianId = String(formData.get("guardian_id") ?? "");
  const childId = String(formData.get("child_id") ?? "");

  const bool = (key: string) => formData.get(key) === "true";

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("child_guardians")
    .update({
      can_give_allowance: bool("can_give_allowance"),
      can_approve_behavior: bool("can_approve_behavior"),
      can_approve_borrow: bool("can_approve_borrow"),
      can_change_settings: bool("can_change_settings"),
      can_invite_guardian: bool("can_invite_guardian"),
    })
    .eq("guardian_id", guardianId)
    .eq("child_id", childId)
    .eq("invited_by", auth.user!.id);
  if (error) return { ok: false, message: "권한 변경에 실패했어요." };
  revalidatePath("/settings/guardians");
  return { ok: true, message: "권한을 저장했어요." };
}

export async function removeGuardianAction(
  _prev: GuardianFormState,
  formData: FormData,
): Promise<GuardianFormState> {
  const auth = await requireParentSession();
  const guardianId = String(formData.get("guardian_id") ?? "");
  const childId = String(formData.get("child_id") ?? "");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("child_guardians")
    .delete()
    .eq("guardian_id", guardianId)
    .eq("child_id", childId)
    .eq("invited_by", auth.user!.id);
  if (error) return { ok: false, message: "삭제에 실패했어요." };
  revalidatePath("/settings/guardians");
  return { ok: true, message: "보호자를 제거했어요." };
}
