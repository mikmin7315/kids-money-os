import { notFound, redirect } from "next/navigation";
import { ChildBehaviorCheckForm, BorrowRequestQuickForm } from "@/components/finance/action-forms";
import { ActivityFeed, PortfolioGrid } from "@/components/finance/dashboard-cards";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge, MobileShell, NavLink, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { getAuthContext, getChildModeContext } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatWon } from "@/lib/format";

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [auth, childMode, bundle, dashboard] = await Promise.all([
    getAuthContext(),
    getChildModeContext(),
    getAppDataBundle(),
    getDashboardView(),
  ]);

  const isParentOrAdmin =
    auth.user &&
    (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;

  if (!isParentOrAdmin && !isChildMode) {
    redirect("/login");
  }

  const today = new Date().toISOString().slice(0, 10);
  const child = bundle.children.find((item) => item.id === id);
  if (!child) notFound();

  const summary = dashboard.children.find((item) => item.child.id === id);
  if (!summary) notFound();

  const childLogs = bundle.behaviorLogs.filter((item) => item.childId === id && item.date === today);
  const allLogs = bundle.behaviorLogs.filter((item) => item.childId === id).slice(0, 5);
  const childBorrows = bundle.borrowRequests.filter((item) => item.childId === id);
  const policy = bundle.interestPolicies.find((item) => item.childId === id);
  const expectedInterest = policy ? estimateInterest(summary.wallet, policy) : 0;
  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="아이 모드" title={`${child.name} 대시보드`} right={isParentOrAdmin ? <HeaderActions /> : undefined} />

        <section className="mt-4">
          <NavLink href="/child-mode" label="아이 선택으로 돌아가기" />
        </section>

        {/* C-08: 내 돈 보기 */}
        <Section title="내 지갑" description="잔액·저축·미리쓰기·이자율을 한눈에.">
          <PortfolioGrid
            balance={summary.wallet.balance}
            savings={summary.wallet.savingsBalance}
            borrowed={summary.wallet.borrowedBalance}
            interestRate={summary.wallet.currentInterestRate}
          />
        </Section>

        {/* C-I-01: 이번달 이자 약속 / C-I-02: 이자 미리보기 */}
        <Section title="이번달 이자 약속" description="행동 약속을 지키면 이자율이 올라가요.">
          <Surface>
            <div className="grid grid-cols-2 gap-3">
              <ChildChip label="예상 이자" value={formatWon(expectedInterest)} />
              <ChildChip label="이번달 지출" value={formatWon(summary.monthReport.totalSpend)} />
              <ChildChip label="이번달 저축" value={formatWon(summary.monthReport.totalSave)} />
              <ChildChip label="약속 달성률" value={`${summary.monthReport.behaviorSuccessRate.toFixed(0)}%`} />
            </div>
            {policy && (
              <p className="mt-4 text-xs text-[var(--color-muted)]">
                현재 이자율 {summary.wallet.currentInterestRate}% → 최대 {policy.maxInterestRate}%까지 올릴 수 있어요.
              </p>
            )}
          </Surface>
        </Section>

        {/* C-I-03: 행동 체크 (아이 자가 체크인) */}
        <Section title="오늘 약속 체크" description="오늘 약속을 완료했으면 여기서 체크해요.">
          <ChildBehaviorCheckForm childId={id} behaviorRules={activeRules} />
          {childLogs.length > 0 && (
            <div className="mt-3 space-y-2">
              {childLogs.map((log) => {
                const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
                return (
                  <div key={log.id} className="flex items-center justify-between rounded-3xl bg-[var(--color-card)] p-4">
                    <div>
                      <p className="font-medium">{rule?.title}</p>
                      <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                        보상 {formatWon(rule?.rewardAmount ?? 0)} | {rule?.requiresParentApproval ? "부모 확인 필요" : "자동 적용"}
                      </p>
                    </div>
                    <Badge tone={log.status === "pending" ? "amber" : "emerald"}>{log.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Recent behavior logs */}
        <Section title="최근 행동 기록" description="지난 기록.">
          <div className="space-y-2">
            {allLogs.map((log) => {
              const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
              return (
                <Surface key={log.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{rule?.title}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{log.date}</p>
                    </div>
                    <Badge tone={toneForStatus(log.status)}>{log.status}</Badge>
                  </div>
                </Surface>
              );
            })}
          </div>
        </Section>

        {/* C-L-01: 미리쓰기 요청 */}
        <Section title="미리쓰기" description="미리쓰기 요청과 상환 현황.">
          <BorrowRequestQuickForm childId={id} />
          <div className="mt-3 space-y-3">
            {childBorrows.map((borrow) => (
              <Surface key={borrow.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{borrow.purpose}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{formatWon(borrow.requestedAmount)}</p>
                  </div>
                  <Badge tone={borrow.status === "pending" ? "amber" : "sky"}>{borrow.status}</Badge>
                </div>
              </Surface>
            ))}
          </div>
        </Section>

        {/* C-09: 돈 기록 */}
        <Section title="최근 활동" description="나의 활동 피드.">
          <ActivityFeed items={dashboard.activityFeed.filter((item) => item.childId === id)} />
        </Section>
      </MobileShell>
      <BottomNav pathname="/" />
    </PageContainer>
  );
}

function ChildChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-[var(--color-card)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function toneForStatus(status: string) {
  if (status === "approved" || status === "completed") return "emerald" as const;
  if (status === "pending") return "amber" as const;
  return "rose" as const;
}
