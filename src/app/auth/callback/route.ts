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
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    if (data.user) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/login/reset/confirm`);
      }
        // Check DB state rather than a fragile time window: new OAuth users have no
        // consent_at because the trigger creates the profile but consent is set later.
        const { data: profile } = await supabase
          .from("profiles")
          .select("consent_at")
          .eq("id", data.user.id)
          .maybeSingle();
        if (!profile?.consent_at) {
          return NextResponse.redirect(`${origin}/onboarding/complete`);
        }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
