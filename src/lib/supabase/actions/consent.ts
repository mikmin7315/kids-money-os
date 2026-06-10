"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { CURRENT_CONSENT_VERSION } from "@/lib/consent";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ConsentFormState = {
  ok: boolean;
  message: string;
};

export async function acceptParentConsentAction(
  _: ConsentFormState,
  formData: FormData,
): Promise<ConsentFormState> {
  if (
    formData.get("termsAccepted") !== "on" ||
    formData.get("privacyAccepted") !== "on" ||
    formData.get("childDataAccepted") !== "on"
  ) {
    return { ok: false, message: "필수 동의 항목을 모두 확인해주세요." };
  }

  const auth = await getAuthContext();
  if (!auth.user || !auth.profile || auth.profile.role !== "parent") {
    return { ok: false, message: "부모 계정으로 다시 로그인해주세요." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      consent_version: CURRENT_CONSENT_VERSION,
      consent_at: new Date().toISOString(),
    })
    .eq("id", auth.user.id);

  if (error) return { ok: false, message: "동의 내용을 저장하지 못했습니다. 다시 시도해주세요." };

  revalidatePath("/", "layout");
  redirect("/");
}
