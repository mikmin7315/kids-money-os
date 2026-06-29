"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type PolicyFormState = { ok: boolean; message: string };

export async function addRestrictionAction(
  _prev: PolicyFormState,
  formData: FormData,
): Promise<PolicyFormState> {
  const auth = await requireAdminSession();
  const userId = formData.get("user_id") ? String(formData.get("user_id")) : null;
  const childId = formData.get("child_id") ? String(formData.get("child_id")) : null;
  const type = String(formData.get("type") ?? "suspend");
  const reason = String(formData.get("reason") ?? "").trim();
  const endsAt = formData.get("ends_at") ? String(formData.get("ends_at")) : null;

  if (!reason) return { ok: false, message: "사유를 입력해주세요." };
  if (!userId && !childId) return { ok: false, message: "대상을 선택해주세요." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("account_restrictions").insert({
    user_id: userId || null,
    child_id: childId || null,
    type,
    reason,
    ends_at: endsAt || null,
    is_active: true,
    created_by: auth.user!.id,
  });
  if (error) return { ok: false, message: "제한 적용에 실패했어요." };

  // 감사 로그
  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "add_restriction",
    resource_type: userId ? "user" : "child",
    resource_id: userId ?? childId ?? "",
    after_value: { type, reason, ends_at: endsAt },
  });

  revalidatePath("/admin/restrictions");
  return { ok: true, message: "이용 제한을 적용했어요." };
}

export async function liftRestrictionAction(
  _prev: PolicyFormState,
  formData: FormData,
): Promise<PolicyFormState> {
  const auth = await requireAdminSession();
  const id = String(formData.get("restriction_id") ?? "");
  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("account_restrictions")
    .update({ is_active: false, lifted_by: auth.user!.id, lifted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: "해제에 실패했어요." };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "lift_restriction",
    resource_type: "account_restriction",
    resource_id: id,
  });

  revalidatePath("/admin/restrictions");
  return { ok: true, message: "이용 제한을 해제했어요." };
}

export async function updateAppConfigAction(
  _prev: PolicyFormState,
  formData: FormData,
): Promise<PolicyFormState> {
  const auth = await requireAdminSession();
  const key = String(formData.get("key") ?? "");
  const rawValue = String(formData.get("value") ?? "").trim();

  if (!key || rawValue === "") return { ok: false, message: "키와 값을 입력해주세요." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    parsed = rawValue;
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("app_config")
    .upsert({ key, value: parsed, updated_by: auth.user!.id, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: "설정 저장에 실패했어요." };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "update_app_config",
    resource_type: "app_config",
    resource_id: key,
    after_value: { value: parsed },
  });

  revalidatePath("/admin/release-controls");
  return { ok: true, message: "설정을 저장했어요." };
}

export async function processDeletionAction(
  _prev: PolicyFormState,
  formData: FormData,
): Promise<PolicyFormState> {
  const auth = await requireAdminSession();
  const id = String(formData.get("request_id") ?? "");
  const action = String(formData.get("action") ?? "");

  if (!["complete", "reject"].includes(action)) return { ok: false, message: "잘못된 액션입니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("account_deletion_requests").update({
    status: action === "complete" ? "completed" : "rejected",
    completed_at: new Date().toISOString(),
    processed_by: auth.user!.id,
  }).eq("id", id);
  if (error) return { ok: false, message: "처리에 실패했어요." };

  revalidatePath("/admin/deletion-requests");
  return { ok: true, message: action === "complete" ? "삭제를 완료했어요." : "요청을 반려했어요." };
}
