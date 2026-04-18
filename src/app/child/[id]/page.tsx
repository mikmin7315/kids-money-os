import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChildBehaviorCheckForm, BorrowRequestQuickForm } from "@/components/finance/action-forms";
import { ActivityFeed } from "@/components/finance/dashboard-cards";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge, MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
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
        <AppHeader
          eyebrow="내 공간 🏠"
          title={`${child.name}의 통장`}
          right={isParentOrAdmin ? <HeaderActions /> : undefined}
        />

        {/* 이자 배우기 배너 */}
        <Link href="/learn/interest">
          <section className="mt-4 rounded-[24px] bg-gradient-to-r from-amber-100 to-yellow-50 px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-amber-800">이자가 뭔지 알아? 🌱</p>
              <p className="mt-0.5 text-xs text-amber-700">돈이 저절로 자라는 마법을 배워봐!</p>
            </div>
            <span className="text-2xl">👉</span>
          </section>
        </Link>

        {/* 내 돈 요약 */}
        <section className="mt-4">
          <Surface className="bg-gradient-to-br from-white to-amber-50/50">
            <p className="text-xs font-semibold text-[var(--color-soft)]">지금 내 돈 💰</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{formatWon(summary.wallet.balance)}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniChip emoji="🐷" label="저축" value={formatWon(summary.wallet.savingsBalance)} />
              <MiniChip emoji="✨" label="이자율" value={`${summary.wallet.currentInterestRate}%`} />
              <MiniChip emoji="📈" label="예상 이자" value={formatWon(expectedInterest)} />
            </div>
            {policy && (
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                약속을 잘 지키면 이자율이 최대 {policy.maxInterestRate}%까지 올라가!
              </p>
            )}
          </Surface>
        </section>

        {/* 오늘 약속 체크 */}
        <Section title="오늘 약속 체크 ✅" description="오늘 한 약속을 체크해봐!">
          <ChildBehaviorCheckForm childId={id} behaviorRules={activeRules} />
          {childLogs.length > 0 && (
            <div className="mt-3 space-y-2">
              {childLogs.map((log) => {
                const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
                return (
                  <div key={log.id} className="flex items-center justify-between rounded-[20px] bg-[var(--color-card)] p-4">
                    <div>
                      <p className="font-semibold">{rule?.title}</p>
                      <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                        보상 {formatWon(rule?.rewardAmount ?? 0)}
                        {rule?.requiresParentApproval ? " · 엄마아빠 확인 필요" : " · 자동 완료"}
                      </p>
                    </div>
                    <Badge tone={log.status === "pending" ? "amber" : "emerald"}>{statusLabel(log.status)}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* 이번달 성과 */}
        <Section title="이번달 성과 🏆" description="이번달 얼마나 잘했는지 보자!">
          <Surface>
            <div className="grid grid-cols-2 gap-3">
              <BigChip emoji="💸" label="이번달 쓴 돈" value={formatWon(summary.monthReport.totalSpend)} />
              <BigChip emoji="🐷" label="이번달 저축" value={formatWon(summary.monthReport.totalSave)} />
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-muted)]">약속 달성률</span>
                <span className="font-bold">{summary.monthReport.behaviorSuccessRate.toFixed(0)}%</span>
              </div>
              <div className="mt-2 h-4 overflow-hidden rounded-full bg-[var(--color-card)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                  style={{ width: `${summary.monthReport.behaviorSuccessRate}%` }}
                />
              </div>
            </div>
          </Surface>
        </Section>

        {/* 최근 행동 기록 */}
        {allLogs.length > 0 && (
          <Section title="최근 약속 기록 📋" description="지난 약속들이야.">
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
                      <Badge tone={toneForStatus(log.status)}>{statusLabel(log.status)}</Badge>
                    </div>
                  </Surface>
                );
              })}
            </div>
          </Section>
        )}

        {/* 미리쓰기 */}
        <Section title="미리쓰기 💳" description="용돈 미리 빌리기. 나중에 꼭 갚아야 해!">
          <BorrowRequestQuickForm childId={id} />
          {childBorrows.length > 0 && (
            <div className="mt-3 space-y-3">
              {childBorrows.map((borrow) => (
                <Surface key={borrow.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{borrow.purpose}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{formatWon(borrow.requestedAmount)}</p>
                    </div>
                    <Badge tone={borrow.status === "pending" ? "amber" : "sky"}>{statusLabel(borrow.status)}</Badge>
                  </div>
                </Surface>
              ))}
            </div>
          )}
        </Section>

        {/* 최근 활동 */}
        <Section title="최근 활동 📜" description="내 돈 움직임 기록이야.">
          <ActivityFeed items={dashboard.activityFeed.filter((item) => item.childId === id)} />
        </Section>
      </MobileShell>
      <BottomNav pathname="/" />
    </PageContainer>
  );
}

function MiniChip({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3 text-center">
      <p className="text-lg">{emoji}</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function BigChip({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[var(--color-card)] p-4">
      <p className="text-2xl">{emoji}</p>
      <p className="mt-2 text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function toneForStatus(status: string) {
  if (status === "approved" || status === "completed") return "emerald" as const;
  if (status === "pending") return "amber" as const;
  return "rose" as const;
}

function statusLabel(status: string) {
  if (status === "pending") return "대기 중";
  if (status === "approved") return "승인됨 🎉";
  if (status === "completed") return "완료 ✅";
  if (status === "rejected") return "반려됨";
  if (status === "partial") return "부분상환";
  if (status === "repaid") return "다 갚았어 🎊";
  return status;
}
