import { ActivityFeed, ChildSummaryList, PortfolioGrid, TodaysBehaviorPanel } from "@/components/finance/dashboard-cards";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileShell, NavLink, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { getAuthContext } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatCompact, formatWon } from "@/lib/format";

export default async function HomePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [dashboard, bundle, auth] = await Promise.all([getDashboardView(), getAppDataBundle(), getAuthContext()]);
  const primaryChild = dashboard.children[0];
  const todayItems = bundle.behaviorLogs
    .filter((item) => item.childId === primaryChild?.child.id && item.date === today)
    .map((log) => {
      const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
      return {
        title: rule?.title ?? "행동",
        reward: rule?.rewardAmount ?? 0,
        status: log.status,
        needsApproval: rule?.requiresParentApproval ?? false,
      };
    });

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="부모 대시보드" title={`${dashboard.parent.name}의 머니 컨트롤룸`} right={<HeaderActions />} />

        <section className="mt-6">
          <Surface className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,243,214,0.92))]">
            <p className="text-sm font-medium text-[var(--color-soft)]">Monari</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              행동이 이자를 만들고,
              <br />
              돈이 보이게 됩니다.
            </h2>
            <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[var(--color-muted)]">
              부모가 약속을 설정하면, 아이는 잔액·저축·이자·미리쓰기를 하나의 흐름으로 봅니다.
            </p>
            <p className="mt-3 text-xs text-[var(--color-soft)]">
              세션: {auth.user ? auth.user.email : "데모 모드 (목 데이터)"}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MetricChip label="아이" value={`${dashboard.children.length}`} />
              <MetricChip label="대기 중" value={`${dashboard.pendingApprovals.length}`} />
              <MetricChip label="활동" value={formatCompact(dashboard.activityFeed.length)} />
            </div>
          </Surface>
        </section>

        {primaryChild ? (
          <>
            <Section title="핵심 지표" description="모바일 첫 화면에서 바로 보이는 4가지 숫자.">
              <PortfolioGrid
                balance={primaryChild.wallet.balance}
                savings={primaryChild.wallet.savingsBalance}
                borrowed={primaryChild.wallet.borrowedBalance}
                interestRate={primaryChild.wallet.currentInterestRate}
              />
            </Section>

            <Section title="오늘 약속" description="아이의 행동 약속이 바로 금융 결과와 연결됩니다.">
              <TodaysBehaviorPanel items={todayItems} />
            </Section>
          </>
        ) : (
          <Section title="시작하기" description="아이를 등록하면 대시보드가 활성화됩니다.">
            <Surface>
              <p className="text-sm text-[var(--color-muted)]">아직 등록된 아이가 없어요.</p>
              <a href="/settings" className="mt-3 inline-flex h-11 items-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-bold text-white">
                아이 등록하러 가기 →
              </a>
            </Surface>
          </Section>
        )}

        <Section title="아이 현황" description="연결된 모든 아이의 요약.">
          <div className="mb-3">
            <NavLink href="/child-mode" label="아이 모드 전환" />
          </div>
          <ChildSummaryList summaries={dashboard.children} />
        </Section>

        {primaryChild && (
          <Section title="이번달 요약" description="리포트 화면으로 가기 전 상위 요약.">
            <Surface>
              <div className="grid grid-cols-2 gap-3">
                <SummaryBox label="용돈" value={formatWon(primaryChild.monthReport.totalAllowance)} />
                <SummaryBox label="지출" value={formatWon(primaryChild.monthReport.totalSpend)} />
                <SummaryBox label="저축" value={formatWon(primaryChild.monthReport.totalSave)} />
                <SummaryBox label="약속 달성률" value={`${primaryChild.monthReport.behaviorSuccessRate.toFixed(0)}%`} />
              </div>
            </Surface>
          </Section>
        )}

        <Section title="최근 활동" description="행동과 금전 이벤트를 한 타임라인으로.">
          <ActivityFeed items={dashboard.activityFeed} />
        </Section>
      </MobileShell>
      <BottomNav pathname="/" />
    </PageContainer>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/70 p-3">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-[var(--color-card)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
