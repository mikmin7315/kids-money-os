import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const type = searchParams.get("type");
    const next = searchParams.get("next") ?? "";
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    if (data.user) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/login/reset/confirm`);
      }
        // Determine routing: new OAuth user (no consent_at) → onboarding.
        // New email user (consent_at set by trigger, but no children yet) → onboarding.
        // Returning user (has children) → next or home.
        const [profileResult, childResult] = await Promise.all([
          supabase.from("profiles").select("consent_at").eq("id", data.user.id).maybeSingle(),
          supabase.from("children").select("id", { count: "exact", head: true }).eq("parent_id", data.user.id),
        ]);
        if (!profileResult.data?.consent_at || !childResult.count) {
          return NextResponse.redirect(`${origin}/onboarding/complete`);
        }
        if (next && next.startsWith("/")) {
          return NextResponse.redirect(`${origin}${next}`);
        }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
