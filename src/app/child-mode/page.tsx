import { ChildModeCard } from "@/components/finance/child-mode-card";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getDashboardView } from "@/lib/data";

export default async function ChildModePage() {
  await requireParentSession();
  const dashboard = await getDashboardView();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="아이 모드" title="아이 프로필 선택" right={<HeaderActions />} />

        <section className="mt-6">
          <Surface className="relative overflow-hidden border-[rgba(87,70,49,0.1)] bg-[linear-gradient(135deg,rgba(255,248,236,0.98),rgba(232,244,240,0.92))] px-6 py-6">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[rgba(15,139,124,0.08)] blur-2xl" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Child Mode</p>
              <h2 className="mt-4 font-display text-[2rem] font-semibold leading-[1.06] tracking-tight">
                부모 세션을 유지한 채
                <br />
                아이 화면으로 전환합니다.
              </h2>
              <p className="mt-4 max-w-[31ch] text-sm leading-6 text-[var(--color-muted)]">
                프로필을 선택하고 PIN을 입력하면 아이가 보는 전용 통장 화면으로 바로 들어갑니다.
              </p>
            </div>
          </Surface>
        </section>

        <Section title="모드 전환" description="부모 세션은 유지되고 화면만 아이 전용 뷰로 바뀝니다.">
          <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))]">
            <ul className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
              <li>핸드폰을 아이에게 건넬 때 사용합니다.</li>
              <li>아이 카드를 탭하면 PIN 입력 화면으로 이동합니다.</li>
              <li>PIN은 설정 화면에서 아이별로 설정할 수 있습니다.</li>
            </ul>
          </Surface>
        </Section>

        <Section title="아이 프로필" description="각 카드를 탭하면 아이 전용 화면으로 진입합니다.">
          <div className="space-y-3">
            {dashboard.children.map((summary) => (
              <ChildModeCard key={summary.child.id} summary={summary} />
            ))}
          </div>
        </Section>
      </MobileShell>
      <BottomNav pathname="/" />
    </PageContainer>
  );
}
