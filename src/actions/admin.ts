"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/data";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

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

  if (isDemoMode()) {
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
        name: String(row.name ?? ""),
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
  const auth = await requireAdminSession();

  if (isDemoMode()) {
    return { ok: true, data: { profileId: input.profileId } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.rpc("change_profile_role", {
      p_profile_id: input.profileId,
      p_role: input.role,
    });

    if (error) throw error;
    if (input.profileId === auth.user?.id && input.role !== "admin") {
      revalidatePath("/admin", "layout");
    }
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

export async function approveWalletChargeAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const chargeId = String(formData.get("chargeId") ?? "").trim();
  if (!chargeId) return { ok: false, message: "충전 ID가 없습니다." };

  const auth = await requireAdminSession();
  if (!auth.user) return { ok: false, message: "관리자 인증이 필요해요." };

  if (isDemoMode()) {
    revalidatePath("/admin/wallet-charges");
    return { ok: true, message: "승인했어요. (데모)" };
  }

  const supabase = await getSupabaseAdminClient();
  const { error } = await supabase.rpc("approve_parent_wallet_charge", { p_charge_id: chargeId });
  if (error) return { ok: false, message: error.message.includes("Admin only") ? "관리자 권한이 필요해요." : "승인에 실패했어요." };

  revalidatePath("/admin/wallet-charges");
  revalidatePath("/");
  return { ok: true, message: "충전을 승인했어요." };
}

export async function rejectWalletChargeAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const chargeId = String(formData.get("chargeId") ?? "").trim();
  if (!chargeId) return { ok: false, message: "충전 ID가 없습니다." };

  const auth = await requireAdminSession();
  if (!auth.user) return { ok: false, message: "관리자 인증이 필요해요." };

  if (isDemoMode()) {
    revalidatePath("/admin/wallet-charges");
    return { ok: true, message: "반려했어요. (데모)" };
  }

  const supabase = await getSupabaseAdminClient();
  const { error } = await supabase.rpc("reject_parent_wallet_charge", { p_charge_id: chargeId });
  if (error) return { ok: false, message: "반려에 실패했어요." };

  revalidatePath("/admin/wallet-charges");
  return { ok: true, message: "충전 요청을 반려했어요." };
}
