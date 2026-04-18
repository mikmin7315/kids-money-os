import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { getAuthContext } from "@/lib/auth";

export default async function OnboardingPage() {
  const auth = await getAuthContext();

  if (auth.user) redirect("/");

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Monari" title="어린이 금융교육 앱" />

        <section className="mt-8">
          <Surface className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,243,214,0.92))]">
            <p className="text-4xl">🐷</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              행동이 이자를 만들고,
              <br />
              저축이 습관이 됩니다.
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              Monari는 부모와 아이가 함께 돈을 배우는 공간입니다.
              약속을 지키면 이자율이 오르고, 저축이 쌓이고, 미리쓰기도 배울 수 있어요.
            </p>
          </Surface>
        </section>

        <Section title="어떻게 동작하나요?" description="세 가지 핵심 흐름.">
          <div className="space-y-3">
            <OnboardingCard
              step="1"
              title="부모가 약속을 설정"
              body="아침 일찍 일어나기, 숙제 완료 등 행동 약속을 만들고 보상을 연결합니다."
            />
            <OnboardingCard
              step="2"
              title="아이가 체크하면 이자율이 변동"
              body="약속을 지킬수록 저축 이자율이 올라가요. 미리쓰기 이자도 행동 점수에 연동됩니다."
            />
            <OnboardingCard
              step="3"
              title="월말 자동 정산"
              body="이번 달 행동 성과를 바탕으로 이자가 자동 지급되고 다음 달 이자율이 결정됩니다."
            />
          </div>
        </Section>

        <Section title="시작하기">
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-full bg-[var(--color-text)] px-4 py-4 text-center text-sm font-semibold text-[var(--color-bg)]"
            >
              부모 계정으로 시작
            </Link>
            <Link
              href="/"
              className="block w-full rounded-full border border-[var(--color-border)] px-4 py-4 text-center text-sm font-semibold text-[var(--color-text)]"
            >
              데모 모드로 둘러보기
            </Link>
          </div>
        </Section>
      </MobileShell>
    </PageContainer>
  );
}

function OnboardingCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <Surface>
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-text)] text-sm font-bold text-[var(--color-bg)]">
          {step}
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
        </div>
      </div>
    </Surface>
  );
}
