import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasCurrentConsent } from "@/lib/consent";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const getAuthContext = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { user: null, profile: null, isConfigured: false };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, profile: null, isConfigured: true };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return { user, profile, isConfigured: true };
  } catch {
    return { user: null, profile: null, isConfigured: true };
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
  if (auth.profile?.role === "parent" && !hasCurrentConsent(auth.profile)) redirect("/consent");

  return auth;
}

export async function requireAppConsent() {
  const auth = await getAuthContext();
  if (auth.isConfigured && (!auth.user || !auth.profile)) redirect("/login");
  if (auth.profile?.role === "parent" && !hasCurrentConsent(auth.profile)) redirect("/consent");
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
  if (!auth.isConfigured) {
    return { isParent: false, isChild: childMode.childId === childId };
  }

  if (!auth.user || !auth.profile) return { isParent: false, isChild: false };

  if (auth.profile.role === "admin") return { isParent: true, isChild: false };
  if (auth.profile.role !== "parent" || !hasCurrentConsent(auth.profile)) {
    return { isParent: false, isChild: false };
  }

  const supabase = await getSupabaseServerClient();
  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("id", childId)
    .eq("parent_id", auth.user.id)
    .maybeSingle();
  const ownsChild = child != null;

  const isChild = ownsChild && childMode.childId === childId;
  const isParent = ownsChild;
  return { isParent, isChild };
}
