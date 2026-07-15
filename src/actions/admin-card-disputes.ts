"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type DisputeFormState = { ok: boolean; message: string };

export async function openDisputeAction(
  _prev: DisputeFormState,
  formData: FormData,
): Promise<DisputeFormState> {
  const auth = await requireAdminSession();
  const txId = String(formData.get("tx_id") ?? "");
  const memo = String(formData.get("memo") ?? "").trim();
  if (!txId) return { ok: false, message: "거래 ID가 필요합니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("card_transactions").update({
    dispute_status: "open",
    dispute_memo: memo || null,
    dispute_opened_at: new Date().toISOString(),
  }).eq("id", txId);
  if (error) return { ok: false, message: "분쟁 개설에 실패했어요." };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "open_dispute",
    resource_type: "card_transaction",
    resource_id: txId,
    after_value: { dispute_status: "open", memo },
  });

  revalidatePath("/admin/card-disputes");
  revalidatePath(`/admin/card-transactions/${txId}`);
  return { ok: true, message: "분쟁을 개설했어요." };
}

export async function resolveDisputeAction(
  _prev: DisputeFormState,
  formData: FormData,
): Promise<DisputeFormState> {
  const auth = await requireAdminSession();
  const txId = String(formData.get("tx_id") ?? "");
  const outcome = String(formData.get("outcome") ?? "resolved");
  if (!["resolved", "rejected"].includes(outcome)) return { ok: false, message: "잘못된 처리 결과입니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("card_transactions").update({
    dispute_status: outcome,
    dispute_resolved_at: new Date().toISOString(),
  }).eq("id", txId);
  if (error) return { ok: false, message: "처리에 실패했어요." };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "resolve_dispute",
    resource_type: "card_transaction",
    resource_id: txId,
    after_value: { dispute_status: outcome },
  });

  revalidatePath("/admin/card-disputes");
  revalidatePath(`/admin/card-transactions/${txId}`);
  return { ok: true, message: outcome === "resolved" ? "분쟁을 완료 처리했어요." : "분쟁을 반려했어요." };
}
