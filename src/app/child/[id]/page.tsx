import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChildBehaviorCheckForm, BorrowRequestQuickForm } from "@/components/finance/action-forms";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ChildHero } from "@/components/child/child-hero";
import { ChildGrowthBoard } from "@/components/child/child-growth-board";
import { ChildStampGrid } from "@/components/child/child-stamp-grid";
import { ChildBorrowList } from "@/components/child/child-borrow-list";
import { ChildSectionHeader } from "@/components/child/child-section-header";
import { getAuthContext, getChildModeContext } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";

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

  const todayLogs = bundle.behaviorLogs.filter((l) => l.childId === id && l.date === today);
  const recentLogs = bundle.behaviorLogs.filter((l) => l.childId === id).slice(0, 6);
  const childBorrows = bundle.borrowRequests.filter((l) => l.childId === id);
  const policy = bundle.interestPolicies.find((p) => p.childId === id);
  const expectedInterest = policy ? estimateInterest(summary.wallet, policy) : 0;
  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);

  const todayDone = todayLogs.filter((l) => l.status === "approved" || l.status === "completed").length;

  return (
    <div data-theme="child" className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <ChildHero
        childName={child.name}
        balance={summary.wallet.balance}
        savingsBalance={summary.wallet.savingsBalance}
        borrowedBalance={summary.wallet.borrowedBalance}
        currentInterestRate={summary.wallet.currentInterestRate}
        maxInterestRate={policy?.maxInterestRate ?? 10}
        isParent={!!isParentOrAdmin}
      />

      <div className="mx-auto max-w-md space-y-5 px-4 pb-32 pt-5">
        <ChildGrowthBoard
          totalSave={summary.monthReport.totalSave}
          totalSpend={summary.monthReport.totalSpend}
          behaviorSuccessRate={summary.monthReport.behaviorSuccessRate}
          expectedInterest={expectedInterest}
          currentInterestRate={summary.wallet.currentInterestRate}
        />

        <section>
          <ChildSectionHeader
            title="오늘 약속 체크"
            badge={
              todayDone > 0 ? (
                <span className="rounded-full bg-[var(--color-success)] px-2.5 py-0.5 text-xs font-bold text-white">
                  오늘 {todayDone}개 완료 🎉
                </span>
              ) : undefined
            }
          />
          <div className="rounded-[22px] border border-[var(--color-chip-border)] bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,242,203,0.92))] p-4 shadow-[var(--shadow-soft)]">
            <ChildBehaviorCheckForm childId={id} behaviorRules={activeRules} />
          </div>
        </section>

        <ChildStampGrid logs={recentLogs} rules={bundle.behaviorRules} />

        <Link href="/learn/interest">
          <section className="flex items-center gap-4 rounded-[22px] border border-[var(--color-chip-border)]/70 bg-gradient-to-r from-[var(--color-surface-strong)] to-[var(--color-surface-soft)] px-4 py-4 shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90">
            <span className="text-3xl">🌱</span>
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">이자가 뭔지 알아?</p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">돈이 저절로 자라는 마법 배우기 →</p>
            </div>
          </section>
        </Link>

        <section>
          <ChildSectionHeader title="미리쓰기 💳" />
          <div className="rounded-[22px] border border-[var(--color-chip-border)] bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,242,203,0.92))] p-4 shadow-[var(--shadow-soft)]">
            <BorrowRequestQuickForm childId={id} />
          </div>
          <ChildBorrowList borrows={childBorrows} />
        </section>
      </div>

      <BottomNav pathname="/" />
    </div>
  );
}
