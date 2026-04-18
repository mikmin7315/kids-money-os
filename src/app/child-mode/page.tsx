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

        <Section title="모드 전환" description="부모 세션은 유지되고 화면이 아이 전용 뷰로 바뀝니다.">
          <Surface>
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
