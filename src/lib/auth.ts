import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const getAuthContext = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { session: null, user: null, profile: null, isConfigured: false };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
      return { session: null, user: null, profile: null, isConfigured: true };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return { session, user, profile, isConfigured: true };
  } catch {
    return { session: null, user: null, profile: null, isConfigured: true };
  }
});

export const getChildModeContext = cache(async () => {
  const cookieStore = await cookies();
  const childId = cookieStore.get("child_mode")?.value ?? null;
  return { childId };
});

export async function requireParentSession() {
  const auth = await getAuthContext();

  if (auth.isConfigured && !auth.user) redirect("/login");

  if (
    auth.isConfigured &&
    (!auth.profile || (auth.profile.role !== "parent" && auth.profile.role !== "admin"))
  ) {
    redirect("/login");
  }

  return auth;
}

export async function requireAdminSession() {
  const auth = await getAuthContext();

  if (auth.isConfigured && !auth.user) redirect("/admin/login");

  if (auth.isConfigured && (!auth.profile || auth.profile.role !== "admin")) {
    redirect("/admin/login");
  }

  return auth;
}

export async function requireChildOrParentAccess(childId: string): Promise<{ isParent: boolean; isChild: boolean }> {
  const [auth, childMode] = await Promise.all([getAuthContext(), getChildModeContext()]);
  const isChild = childMode.childId === childId;
  const isParent =
    auth.user != null &&
    auth.profile != null &&
    (auth.profile.role === "parent" || auth.profile.role === "admin");
  return { isParent, isChild };
}
