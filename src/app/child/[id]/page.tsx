import { notFound, redirect } from "next/navigation";
import { BorrowRequestQuickForm, ChildBehaviorCheckForm } from "@/components/finance/action-forms";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ChildHero } from "@/components/child/child-hero";
import { ChildMonthlySummary } from "@/components/child/child-monthly-summary";
import { ChildQuickStats } from "@/components/child/child-quick-stats";
import { ChildProgressSection } from "@/components/child/child-progress-section";
import { ChildActivityList, type ChildActivityItem } from "@/components/child/child-activity-list";
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
    auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();
  const summary = dashboard.children.find((c) => c.child.id === id);
  if (!summary) notFound();

  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);
  const childLogs = bundle.behaviorLogs.filter((l) => l.childId === id);
  const todayLogs = childLogs.filter((l) => l.date === today);
  const pendingLogs = childLogs.filter((l) => l.status === "pending");
  const doneTodayRuleIds = todayLogs
    .filter((l) => l.status === "approved" || l.status === "completed")
    .map((l) => l.behaviorRuleId);
  const todayDone = doneTodayRuleIds.length;

  const childTx = bundle.moneyTransactions.filter((t) => t.childId === id);

  // saving goal progress: saved this month vs allowance received
  const { totalAllowance, totalSave, totalSpend } = summary.monthReport;
  const savingGoalProgress =
    totalAllowance > 0 ? Math.min(Math.round((totalSave / totalAllowance) * 100), 100) : 0;

  // most recent spend transaction amount
  const recentSpendTx = childTx
    .filter((t) => t.type === "spend")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const recentSpend = recentSpendTx?.amount ?? 0;

  // activity list: combine transactions + behavior logs, most recent 4
  const txItems: ChildActivityItem[] = childTx
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map((tx) => ({
      id: tx.id,
      title: txTypeLabel(tx.type, tx.memo),
      dateLabel: relativeDate(tx.date, today),
      rightLabel: txAmountLabel(tx),
      rightAccent: tx.type === "reward" || tx.type === "interest" || tx.type === "allowance",
    }));

  const logItems: ChildActivityItem[] = childLogs
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map((log) => {
      const rule = bundle.behaviorRules.find((r) => r.id === log.behaviorRuleId);
      return {
        id: log.id,
        title: rule?.title ?? "약속 체크",
        dateLabel: relativeDate(log.date, today),
        rightLabel: behaviorStatusLabel(log.status),
        rightAccent: log.status === "approved" || log.status === "completed",
      };
    });

  // merge and take top 4 by date
  const allActivity = [...txItems, ...logItems]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 4);

  return (
    <div data-theme="child" className="min-h-screen bg-[#EBEBEB] text-[#2B2B2B]">
      {/* ── Block 1: Hero ── */}
      <ChildHero
        childId={id}
        childName={child.name}
        balance={summary.wallet.balance}
        savingsBalance={summary.wallet.savingsBalance}
        pendingCount={pendingLogs.length}
        todayPromiseCount={todayLogs.length}
      />

      <div className="mx-auto max-w-[420px] space-y-4 px-4 pb-36 pt-4">
        {/* ── Block 2: Monthly Summary ── */}
        <ChildMonthlySummary
          monthlyAllowance={totalAllowance}
          monthlySaved={totalSave}
          balance={summary.wallet.balance}
        />

        {/* ── Block 3: Quick Stats 2×2 ── */}
        <ChildQuickStats
          todayPromises={todayLogs.length}
          pendingCount={pendingLogs.length}
          savingGoalProgress={savingGoalProgress}
          recentSpend={recentSpend}
        />

        {/* ── Block 4: Progress ── */}
        <ChildProgressSection
          promiseTotal={activeRules.length}
          promiseDone={todayDone}
          savingGoalProgress={savingGoalProgress}
        />

        {/* ── Block 5: Recent Activity ── */}
        <ChildActivityList items={allActivity.length > 0 ? allActivity : txItems} />

        {/* ── Functional section: behavior check form ── */}
        <section id="today-promises" className="pt-2">
          <h2 className="mb-3 text-[18px] font-bold text-[#2B2B2B]">오늘 약속 체크</h2>
          <div className="rounded-[22px] border border-[rgba(43,43,43,0.08)] bg-white px-4 py-4">
            <ChildBehaviorCheckForm
              childId={id}
              behaviorRules={activeRules}
              doneRuleIds={doneTodayRuleIds}
            />
          </div>
        </section>

        {/* ── Functional section: borrow request ── */}
        <section className="pt-2">
          <h2 className="mb-3 text-[18px] font-bold text-[#2B2B2B]">미리쓰기 요청</h2>
          <div className="rounded-[22px] border border-[rgba(43,43,43,0.08)] bg-white px-4 py-4">
            <BorrowRequestQuickForm childId={id} />
          </div>
        </section>
      </div>

      <BottomNav pathname="/" />
    </div>
  );
}

function txTypeLabel(type: string, memo: string): string {
  const labels: Record<string, string> = {
    allowance: "용돈",
    reward: "약속 보상",
    spend: (memo || "사용"),
    save: "저축하기",
    unsave: "저축 해제",
    borrow: "미리쓰기",
    repay: "상환",
    interest: "이자 지급",
  };
  return (labels[type] ?? memo) || type;
}

function txAmountLabel(tx: { type: string; amount: number }): string {
  const sign = tx.type === "spend" || tx.type === "borrow" ? "-" : "+";
  return `${sign}${formatWon(tx.amount)}`;
}

function behaviorStatusLabel(status: string): string {
  if (status === "approved" || status === "completed") return "완료";
  if (status === "pending") return "확인 대기";
  if (status === "rejected") return "다시 도전";
  return status;
}

function relativeDate(date: string, today: string): string {
  const diffMs =
    new Date(today).getTime() - new Date(date).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays <= 6) return `${diffDays}일 전`;
  return date.slice(5).replace("-", ".");
}
