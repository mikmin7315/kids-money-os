"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/data";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminFormState = {
  ok: boolean;
  message: string;
};

type ActionResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export async function listProfilesAction(): Promise<
  ActionResult<{ id: string; email: string; name: string; role: string; createdAt: string }[]>
> {
  await requireAdminSession();

  if (!hasSupabaseEnv()) {
    return {
      ok: true,
      data: [{ id: "mock-1", email: "admin@example.com", name: "Admin", role: "admin", createdAt: new Date().toISOString() }],
    };
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, email, name, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      ok: true,
      data: (data ?? []).map((row) => ({
        id: String(row.id),
        email: String(row.email ?? ""),
        name: String(row.name),
        role: String(row.role),
        createdAt: String(row.created_at),
      })),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "프로필 목록 조회 실패." };
  }
}

export async function updateProfileRoleAction(input: {
  profileId: string;
  role: "parent" | "admin";
}): Promise<ActionResult<{ profileId: string }>> {
  await requireAdminSession();

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { profileId: input.profileId } };
  }

  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ role: input.role })
      .eq("id", input.profileId);

    if (error) throw error;
    revalidatePath("/admin/roles");
    return { ok: true, data: { profileId: input.profileId } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "역할 변경 실패." };
  }
}

export async function updateRoleForm(
  _: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const profileId = formData.get("profileId");
  const role = formData.get("role");

  if (typeof profileId !== "string" || typeof role !== "string") {
    return { ok: false, message: "필수 항목이 누락되었습니다." };
  }

  if (role !== "parent" && role !== "admin") {
    return { ok: false, message: "올바른 역할을 선택해주세요." };
  }

  const result = await updateProfileRoleAction({ profileId, role });
  return result.ok
    ? { ok: true, message: "역할이 변경되었습니다." }
    : { ok: false, message: result.error ?? "역할 변경 실패." };
}
