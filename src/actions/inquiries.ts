"use server";

import { revalidatePath } from "next/cache";
import { requireParentSession, requireAdminSession } from "@/lib/auth";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";

export type InquiryFormState = { ok: boolean; message: string };

export async function submitInquiryAction(
  _prev: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const auth = await requireParentSession();

  const category = String(formData.get("category") ?? "general");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) return { ok: false, message: "제목과 내용은 필수입니다." };
  if (title.length > 100) return { ok: false, message: "제목은 100자 이내로 입력해주세요." };
  if (body.length > 2000) return { ok: false, message: "내용은 2000자 이내로 입력해주세요." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("inquiries").insert({
    user_id: auth.user!.id,
    category,
    title,
    body,
  });
  if (error) return { ok: false, message: "접수에 실패했어요. 다시 시도해주세요." };

  revalidatePath("/inquiries");
  return { ok: true, message: "문의가 접수됐어요. 답변이 오면 알려드릴게요 🙏" };
}

export async function replyInquiryAction(
  _prev: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const auth = await requireAdminSession();

  const id = String(formData.get("id") ?? "").trim();
  const reply = String(formData.get("reply") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const status = String(formData.get("status") ?? "resolved");

  if (!id || !reply) return { ok: false, message: "문의 ID와 답변 내용이 필요합니다." };
  if (!["in_progress", "resolved", "closed"].includes(status)) return { ok: false, message: "상태가 올바르지 않습니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("inquiries").update({
    admin_reply: reply,
    admin_note: note || null,
    status,
    replied_by: auth.user!.id,
    replied_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { ok: false, message: "답변 등록에 실패했어요." };

  revalidatePath("/admin/inquiries");
  return { ok: true, message: "답변을 등록했어요." };
}
