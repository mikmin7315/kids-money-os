import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/auth-forms";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { getAuthContext } from "@/lib/auth";

export default async function AdminLoginPage() {
  const auth = await getAuthContext();

  if (auth.user && auth.profile?.role === "admin") {
    redirect("/admin");
  }

  if (auth.user && auth.profile?.role !== "admin") {
    // Logged in but not admin
    return (
      <PageContainer>
        <MobileShell>
          <AppHeader eyebrow="Admin" title="접근 권한 없음" />
          <Section title="관리자 전용">
            <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))]">
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                관리자 계정으로만 접근할 수 있습니다.
                현재 계정({auth.user.email})은 관리자 권한이 없습니다.
              </p>
            </Surface>
          </Section>
        </MobileShell>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin" title="관리자 로그인" />

        <Section title="관리자 계정" description="관리자 역할이 부여된 계정으로 로그인하세요.">
          <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))]">
            <ul className="space-y-2 text-sm leading-6 text-[var(--color-muted)]">
              <li>일반 부모 계정과 같은 Supabase Auth를 사용합니다.</li>
              <li>로그인 후 역할이 admin인 경우에만 접근이 허용됩니다.</li>
              <li>역할 변경은 Supabase SQL 에디터 또는 다른 관리자가 처리합니다.</li>
            </ul>
          </Surface>
        </Section>

        <Section title="로그인">
          <SignInForm />
        </Section>
      </MobileShell>
    </PageContainer>
  );
}
