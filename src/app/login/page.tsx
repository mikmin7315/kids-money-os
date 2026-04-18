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
        <AppHeader eyebrow="인증" title="부모 로그인" />

        <Section title="로그인이 필요한 이유" description="아이의 금융 기록, 규칙, 승인 내역은 실제 계정에 연결되어야 합니다.">
          <Surface>
            <ul className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
              <li>부모 계정이 아이, 규칙, 금융 내역을 모두 관리합니다.</li>
              <li>아이 모드는 PIN 입력으로 안전하게 전환할 수 있습니다.</li>
              <li>Supabase Auth로 실제 사용자 데이터를 즉시 안전하게 보관합니다.</li>
            </ul>
          </Surface>
        </Section>

        <Section title="로그인" description="이메일과 비밀번호로 시작하세요.">
          <div className="space-y-4">
            <SignInForm />
            <SignUpForm />
          </div>
        </Section>
      </MobileShell>
    </PageContainer>
  );
}
