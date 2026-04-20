import { notFound, redirect } from "next/navigation";
import { BorrowRequestQuickForm, ChildBehaviorCheckForm, ChildSaveForm } from "@/components/finance/action-forms";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ChildHero } from "@/components/child/child-hero";
import { ChildMonthlySummary } from "@/components/child/child-monthly-summary";
import { ChildQuickStats } from "@/components/child/child-quick-stats";
import { ChildActivityList, type ChildActivityItem } from "@/components/child/child-activity-list";
import { getAuthContext, getChildModeContext } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
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

  const { totalAllowance, totalSave, totalSpend } = summary.monthReport;

  // saving goal progress
  const savingGoalProgress =
    totalAllowance > 0 ? Math.min(Math.round((totalSave / totalAllowance) * 100), 100) : 0;

  // this week spend
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const weekSpend = childTx
    .filter((t) => t.type === "spend" && t.date >= weekAgoStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // top spend category
  const spendTx = childTx.filter((t) => t.type === "spend");
  const categoryCount: Record<string, number> = {};
  spendTx.forEach((t) => {
    const key = t.memo || "기타";
    categoryCount[key] = (categoryCount[key] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "없음";

  // remaining challenges
  const remainingChallenges = Math.max(0, activeRules.length - todayDone);

  // most recent allowance tx for hero subtitle
  const recentAllowanceTx = childTx
    .filter((t) => t.type === "allowance")
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  // activity list
  const activityItems: ChildActivityItem[] = childTx
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map((tx) => ({
      id: tx.id,
      title: txTypeLabel(tx.type, tx.memo),
      dateLabel: relativeDate(tx.date, today),
      rightLabel: txAmountLabel(tx),
      rightAccent: tx.type === "reward" || tx.type === "interest" || tx.type === "allowance",
      type: tx.type,
    }));

  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      <div className="mx-auto max-w-[440px] px-4 pt-5 pb-36">
        {/* Hero */}
        <ChildHero
          childId={id}
          childName={child.name}
          balance={summary.wallet.balance}
          savingsBalance={summary.wallet.savingsBalance}
          pendingCount={pendingLogs.length}
          recentAllowanceDate={recentAllowanceTx?.date}
        />

        {/* Monthly Summary */}
        <ChildMonthlySummary
          monthlyAllowance={totalAllowance}
          monthlySpend={totalSpend}
          monthlySaved={totalSave}
        />

        {/* Quick Stats 2×2 */}
        <ChildQuickStats
          weekSpend={weekSpend}
          topCategory={topCategory}
          savingGoalProgress={savingGoalProgress}
          remainingChallenges={remainingChallenges}
        />

        {/* Recent Activity */}
        <ChildActivityList items={activityItems} />

        {/* Savings Goal card */}
        <section
          className="rounded-[24px] bg-white px-5 py-5 mb-4"
          style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[16px] font-700 text-[#2B2B2B]">나의 저축 목표</p>
            <span className="text-[rgba(43,43,43,0.40)] text-[16px]">›</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[14px] font-600 text-[#2B2B2B]">이번달 저축</p>
            <p className="text-[13px] text-[rgba(43,43,43,0.55)]">
              {formatWon(totalSave)} / {formatWon(totalAllowance)}
            </p>
          </div>
          <div className="h-2.5 rounded-full bg-[rgba(43,43,43,0.08)] overflow-hidden mb-1">
            <div
              className="h-full rounded-full bg-[#10367D]"
              style={{ width: `${savingGoalProgress}%` }}
            />
          </div>
          <p className="text-right text-[12px] font-600 text-[rgba(43,43,43,0.55)]">{savingGoalProgress}%</p>
        </section>

        {/* Save form */}
        <section id="save-form" className="rounded-[24px] bg-white px-5 py-5 mb-4" style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}>
          <p className="text-[16px] font-700 text-[#2B2B2B] mb-4">저축하기</p>
          <ChildSaveForm childId={id} />
        </section>

        {/* Behavior check */}
        <section id="today-promises" className="rounded-[24px] bg-white px-5 py-5 mb-4" style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}>
          <p className="text-[16px] font-700 text-[#2B2B2B] mb-4">오늘 약속 체크</p>
          <ChildBehaviorCheckForm
            childId={id}
            behaviorRules={activeRules}
            doneRuleIds={doneTodayRuleIds}
          />
        </section>

        {/* Borrow request */}
        <section id="borrow-form" className="rounded-[24px] bg-white px-5 py-5 mb-4" style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}>
          <p className="text-[16px] font-700 text-[#2B2B2B] mb-4">용돈 요청하기</p>
          <BorrowRequestQuickForm childId={id} />
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

function relativeDate(date: string, today: string): string {
  const diffMs = new Date(today).getTime() - new Date(date).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays <= 6) return `${diffDays}일 전`;
  return date.slice(5).replace("-", ".");
}
