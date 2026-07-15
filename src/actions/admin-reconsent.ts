"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type ReconsentFormState = { ok: boolean; message: string };

export async function createConsentCampaignAction(
  _prev: ReconsentFormState,
  formData: FormData,
): Promise<ReconsentFormState> {
  const auth = await requireAdminSession();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const termsType = String(formData.get("terms_type") ?? "").trim();
  const gracePeriodDays = Number(formData.get("grace_period_days") ?? 30);
  const blockOnExpire = formData.get("block_on_expire") === "true";

  if (!title || !termsType) return { ok: false, message: "제목과 약관 유형을 입력해주세요." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("consent_campaigns").insert({
    title,
    description: description || null,
    terms_type: termsType,
    grace_period_days: gracePeriodDays,
    block_on_expire: blockOnExpire,
    status: "draft",
    created_by: auth.user!.id,
  });
  if (error) return { ok: false, message: "캠페인 생성에 실패했어요." };

  await admin.from("admin_audit_logs").insert({
    admin_id: auth.user!.id,
    action: "create_consent_campaign",
    resource_type: "consent_campaign",
    after_value: { title, terms_type: termsType },
  });

  revalidatePath("/admin/reconsent-campaigns");
  return { ok: true, message: "캠페인을 생성했어요." };
}

export async function updateCampaignStatusAction(
  _prev: ReconsentFormState,
  formData: FormData,
): Promise<ReconsentFormState> {
  await requireAdminSession();
  const id = String(formData.get("campaign_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["draft", "active", "ended"].includes(status)) return { ok: false, message: "잘못된 상태입니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("consent_campaigns").update({
    status,
    started_at: status === "active" ? new Date().toISOString() : undefined,
    ended_at: status === "ended" ? new Date().toISOString() : undefined,
  }).eq("id", id);
  if (error) return { ok: false, message: "상태 변경에 실패했어요." };

  revalidatePath("/admin/reconsent-campaigns");
  return { ok: true, message: "상태를 변경했어요." };
}
