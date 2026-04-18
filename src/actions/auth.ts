"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState = {
  ok: boolean;
  message: string;
};

export async function signInWithPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");

  if (!email || !password) {
    return { ok: false, message: "이메일과 비밀번호를 입력해주세요." };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: "이메일 또는 비밀번호가 틀렸습니다." };
    revalidatePath("/");
    return { ok: true, message: "로그인 성공!" };
  } catch {
    return { ok: false, message: "로그인에 실패했습니다." };
  }
}

export async function signUpWithPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const name = readString(formData, "name");

  if (!email || !password || !name) {
    return { ok: false, message: "모든 항목을 입력해주세요." };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/");
    return { ok: true, message: "계정이 생성됐습니다. 이메일 인증 후 로그인해주세요." };
  } catch {
    return { ok: false, message: "계정 생성에 실패했습니다." };
  }
}

export async function signInWithGoogle() {
  const supabase = await getSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });
  if (error || !data.url) return;
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

  if (!phone || !token) return { ok: false, message: "인증번호를 입력해주세요." };

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) return { ok: false, message: "인증번호가 틀렸습니다." };
    revalidatePath("/");
    return { ok: true, message: "로그인 성공!" };
  } catch {
    return { ok: false, message: "인증에 실패했습니다." };
  }
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
