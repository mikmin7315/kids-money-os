import { redirect } from "next/navigation";
import { SignInForm, SignUpForm } from "@/components/auth/auth-forms";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { getAuthContext } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getAuthContext();

  if (auth.user) {
    redirect("/");
  }

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Authentication" title="Parent sign in" />

        <Section title="Why login exists" description="Parent data, rules, reports, and approvals must belong to a real account.">
          <Surface>
            <ul className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
              <li>Parent account owns children, rules, and financial history.</li>
              <li>Child mode can be layered on top later with PIN entry and device-safe switching.</li>
              <li>Supabase Auth keeps the MVP ready for real user data immediately.</li>
            </ul>
          </Surface>
        </Section>

        <Section title="Sign in flow" description="Use email and password first. Social login can wait until later.">
          <div className="space-y-4">
            <SignInForm />
            <SignUpForm />
          </div>
        </Section>
      </MobileShell>
    </PageContainer>
  );
}
