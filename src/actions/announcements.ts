"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type AnnFormState = { ok: boolean; message: string };

export async function createAnnouncementAction(
  _prev: AnnFormState,
  formData: FormData,
): Promise<AnnFormState> {
  await requireAdminSession();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const type = String(formData.get("type") ?? "notice");
  const target = String(formData.get("target") ?? "all");
  const status = String(formData.get("status") ?? "draft");
  const startsAt = String(formData.get("starts_at") ?? "").trim() || null;
  const endsAt = String(formData.get("ends_at") ?? "").trim() || null;

  if (!title || !body) return { ok: false, message: "제목과 내용은 필수입니다." };
  if (!["notice", "maintenance", "update"].includes(type)) return { ok: false, message: "유형이 올바르지 않습니다." };
  if (!["all", "parent", "child"].includes(target)) return { ok: false, message: "대상이 올바르지 않습니다." };
  if (!["draft", "active"].includes(status)) return { ok: false, message: "상태가 올바르지 않습니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("announcements").insert({
    title,
    body,
    type,
    target,
    status,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  return { ok: true, message: "공지가 등록됐어요." };
}

export async function updateAnnouncementStatusAction(
  _prev: AnnFormState,
  formData: FormData,
): Promise<AnnFormState> {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !["draft", "active", "ended"].includes(status)) return { ok: false, message: "입력이 올바르지 않습니다." };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("announcements").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  return { ok: true, message: "상태를 변경했어요." };
}
