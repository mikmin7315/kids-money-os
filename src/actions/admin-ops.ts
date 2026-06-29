"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type OpsFormState = { ok: boolean; message: string };

export async function addMerchantMappingAction(
  _prev: OpsFormState,
  formData: FormData,
): Promise<OpsFormState> {
  const auth = await requireAdminSession();
  const merchantPattern = String(formData.get("merchant_pattern") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!merchantPattern || !category) return { ok: false, message: "가맹점 패턴과 카테고리를 입력해주세요." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("merchant_category_mappings").insert({
    merchant_pattern: merchantPattern,
    category,
    created_by: auth.user!.id,
  });
  if (error) return { ok: false, message: "추가에 실패했어요." };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "add_merchant_mapping",
    resource_type: "merchant_category_mapping",
    resource_id: merchantPattern,
    after_value: { merchant_pattern: merchantPattern, category },
  });

  revalidatePath("/admin/merchant-categories");
  return { ok: true, message: "매핑을 추가했어요." };
}

export async function deleteMerchantMappingAction(
  _prev: OpsFormState,
  formData: FormData,
): Promise<OpsFormState> {
  const auth = await requireAdminSession();
  const id = String(formData.get("mapping_id") ?? "");
  if (!id) return { ok: false, message: "잘못된 요청입니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("merchant_category_mappings").delete().eq("id", id);
  if (error) return { ok: false, message: "삭제에 실패했어요." };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "delete_merchant_mapping",
    resource_type: "merchant_category_mapping",
    resource_id: id,
  });

  revalidatePath("/admin/merchant-categories");
  return { ok: true, message: "매핑을 삭제했어요." };
}

export async function retryAllowanceBatchAction(
  _prev: OpsFormState,
  formData: FormData,
): Promise<OpsFormState> {
  const auth = await requireAdminSession();
  const scheduledDate = String(formData.get("scheduled_date") ?? "");
  if (!scheduledDate) return { ok: false, message: "날짜가 필요합니다." };

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("process_scheduled_allowances", {
    p_target_date: scheduledDate,
  });
  if (error) return { ok: false, message: error.message };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "retry_allowance_batch",
    resource_type: "allowance_executions",
    resource_id: scheduledDate,
    after_value: data ?? null,
  });

  revalidatePath("/admin/allowance-log");
  const result = data as { success?: number; failed?: number; skipped?: number } | null;
  return {
    ok: true,
    message: `재처리 완료 (성공 ${result?.success ?? 0} / 실패 ${result?.failed ?? 0} / 건너뜀 ${result?.skipped ?? 0})`,
  };
}

export async function createCashCorrectionAction(
  _prev: OpsFormState,
  formData: FormData,
): Promise<OpsFormState> {
  const auth = await requireAdminSession();
  const childId = String(formData.get("child_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  if (!childId || !amount || !reason) return { ok: false, message: "아이, 금액, 사유를 모두 입력해주세요." };
  if (!Number.isInteger(amount) || amount === 0) return { ok: false, message: "금액이 올바르지 않습니다." };

  const admin = getSupabaseAdminClient();

  const { data: limitRow } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "cash_correction_max_amount")
    .maybeSingle();
  const maxAmount = Number(limitRow?.value ?? 500000);
  if (Math.abs(amount) > maxAmount) {
    return { ok: false, message: `정정 금액은 최대 ${maxAmount.toLocaleString()}원까지 가능해요.` };
  }

  const { data: tx, error } = await admin
    .from("money_transactions")
    .insert({
      child_id: childId,
      tx_date: new Date().toISOString().slice(0, 10),
      type: amount > 0 ? "reward" : "spend",
      amount: Math.abs(amount),
      memo: `[현금 정정] ${reason}`,
      created_by: auth.user!.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: "정정 처리에 실패했어요." };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "cash_correction",
    resource_type: "money_transaction",
    resource_id: tx?.id ?? "",
    after_value: { child_id: childId, amount, reason },
  });

  revalidatePath("/admin/cash-corrections");
  return { ok: true, message: "현금 정정을 처리했어요." };
}
