"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteAccountState = {
  ok: boolean;
  message: string;
};

export async function deleteAccountAction(
  _: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirmation = formData.get("confirmation");
  if (confirmation !== "계정 삭제") {
    return { ok: false, message: "확인 문구를 정확히 입력해주세요." };
  }

  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, message: "로그인 정보를 확인할 수 없습니다." };
  if (auth.profile?.role === "admin") {
    return { ok: false, message: "관리자 계정은 앱에서 삭제할 수 없습니다." };
  }

  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(auth.user.id);
    if (error) return { ok: false, message: "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요." };
  } catch {
    return { ok: false, message: "계정 삭제 서비스를 사용할 수 없습니다." };
  }

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // The deleted account session is already invalid; explicit cookie cleanup follows.
  }

  const cookieStore = await cookies();
  cookieStore.delete("child_mode");
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) cookieStore.delete(cookie.name);
  }

  revalidatePath("/", "layout");
  redirect("/login?accountDeleted=1");
}
