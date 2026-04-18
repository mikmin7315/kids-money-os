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
    return { ok: false, message: "Email and password are required." };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath("/");
    revalidatePath("/settings");
    return { ok: true, message: "Signed in successfully." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Sign-in failed." };
  }
}

export async function signUpWithPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const name = readString(formData, "name");

  if (!email || !password || !name) {
    return { ok: false, message: "Name, email, and password are required." };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath("/");
    revalidatePath("/settings");
    return {
      ok: true,
      message: "Account created. If email confirmation is enabled, confirm your inbox first.",
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Sign-up failed." };
  }
}

export async function signOut() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/login");
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
