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

  redirect(isSafeInternalPath(next) ? next : "/");
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
    if (error) return { ok: false, message: translateSignUpError(error.message) };
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

  redirect(isSafeInternalPath(next) ? next : "/");
}

export async function signOut() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}

function translateSignUpError(msg: string): string {
  if (msg.includes("User already registered")) return "이미 가입된 이메일이에요.";
  if (msg.includes("Password should be at least")) return "비밀번호는 6자 이상이어야 해요.";
  if (msg.includes("Unable to validate email address")) return "이메일 형식이 올바르지 않아요.";
  if (msg.includes("Email rate limit exceeded")) return "너무 많은 요청이 있어요. 잠시 후 다시 시도해주세요.";
  if (msg.includes("Signup requires a valid password")) return "비밀번호를 입력해주세요.";
  return "계정 생성에 실패했습니다.";
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

// Prevents open redirect via protocol-relative URLs like //evil.com
function isSafeInternalPath(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//");
}

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error("NEXT_PUBLIC_SITE_URL is required for Google OAuth.");
}
