"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type TermsFormState = { ok: boolean; message: string };

export async function createTermsAction(
  _prev: TermsFormState,
  formData: FormData,
): Promise<TermsFormState> {
  const auth = await requireAdminSession();
  const type = String(formData.get("type") ?? "");
  const version = String(formData.get("version") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const is_active = formData.get("is_active") === "true";

  if (!["service", "privacy", "marketing"].includes(type)) return { ok: false, message: "약관 유형이 올바르지 않습니다." };
  if (!version || !title || !body) return { ok: false, message: "버전, 제목, 내용은 필수입니다." };

  const admin = getSupabaseAdminClient();

  if (is_active) {
    await admin.from("terms").update({ is_active: false }).eq("type", type);
  }

  const { error } = await admin.from("terms").insert({
    type,
    version,
    title,
    body,
    is_active,
    published_at: is_active ? new Date().toISOString() : null,
    created_by: auth.user!.id,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "같은 유형·버전이 이미 존재합니다." };
    return { ok: false, message: "저장에 실패했어요." };
  }

  revalidatePath("/admin/terms");
  revalidatePath("/legal/terms");
  revalidatePath("/legal/privacy");
  return { ok: true, message: "약관이 등록됐어요." };
}

export async function activateTermsAction(
  _prev: TermsFormState,
  formData: FormData,
): Promise<TermsFormState> {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "");
  if (!id || !type) return { ok: false, message: "잘못된 요청입니다." };

  const admin = getSupabaseAdminClient();
  await admin.from("terms").update({ is_active: false }).eq("type", type);
  const { error } = await admin.from("terms")
    .update({ is_active: true, published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: "활성화에 실패했어요." };

  revalidatePath("/admin/terms");
  revalidatePath("/legal/terms");
  revalidatePath("/legal/privacy");
  return { ok: true, message: "약관을 활성화했어요." };
}
