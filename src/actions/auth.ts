"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CURRENT_CONSENT_VERSION } from "@/lib/consent";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState = {
  ok: boolean;
  message: string;
};

export async function signInWithPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const next = readString(formData, "next");

  if (!email || !password) {
    return { ok: false, message: "이메일과 비밀번호를 입력해주세요." };
  }

  let failed = false;
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) failed = true;
  } catch {
    return { ok: false, message: "로그인에 실패했습니다." };
  }

  if (failed) return { ok: false, message: "이메일 또는 비밀번호가 틀렸습니다." };

  // Redirect outside try/catch so Next.js NEXT_REDIRECT propagates correctly.
  // Validate next is a relative path to prevent open redirect.
  redirect(next && next.startsWith("/") ? next : "/");
}

export async function signUpWithPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const name = readString(formData, "name");
  const consentAccepted =
    formData.get("termsAccepted") === "on" &&
    formData.get("privacyAccepted") === "on" &&
    formData.get("childDataAccepted") === "on";

  if (!email || !password || !name || !consentAccepted) {
    return { ok: false, message: "모든 항목을 입력해주세요." };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: {
          name,
          consent_version: CURRENT_CONSENT_VERSION,
          consent_at: new Date().toISOString(),
        },
      },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "인증 메일을 보냈습니다. 메일함에서 링크를 누르면 바로 시작돼요." };
  } catch {
    return { ok: false, message: "계정 생성에 실패했습니다." };
  }
}

export async function signInWithGoogle(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = readString(formData, "next");
  const supabase = await getSupabaseServerClient();
  const siteUrl = getSiteUrl();
  const callbackUrl =
    next && next.startsWith("/")
      ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
      : `${siteUrl}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl },
  });
  if (error || !data.url) return { ok: false, message: "구글 로그인에 실패했습니다." };
  redirect(data.url);
}

export async function sendPhoneOtp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const phone = readString(formData, "phone").replace(/\D/g, "");
  if (!phone) return { ok: false, message: "전화번호를 입력해주세요." };

  const e164 = phone.startsWith("0") ? `+82${phone.slice(1)}` : `+${phone}`;

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: e164 };
  } catch {
    return { ok: false, message: "인증번호 전송에 실패했습니다." };
  }
}

export async function verifyPhoneOtp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const phone = readString(formData, "phone");
  const token = readString(formData, "token");
  const next = readString(formData, "next");

  if (!phone || !token) return { ok: false, message: "인증번호를 입력해주세요." };

  let failed = false;
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) failed = true;
  } catch {
    return { ok: false, message: "인증에 실패했습니다." };
  }

  if (failed) return { ok: false, message: "인증번호가 틀렸습니다." };

  redirect(next && next.startsWith("/") ? next : "/");
}

export async function signOut() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error("NEXT_PUBLIC_SITE_URL is required for Google OAuth.");
}
