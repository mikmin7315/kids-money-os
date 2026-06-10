import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Landmark,
  PiggyBank,
  ReceiptText,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { BorrowRequestQuickForm, ChildBehaviorCheckForm, ChildSaveForm } from "@/components/finance/action-forms";
import { ChildBottomNav } from "@/components/child/child-bottom-nav";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatWon } from "@/lib/format";
import type { BehaviorLog } from "@/lib/types";

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle, dashboard] = await Promise.all([
    getChildModeContext(),
    getAppDataBundle(),
    getDashboardView(),
  ]);

  const isParentOrAdmin =
    auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const child = bundle.children.find((item) => item.id === id);
  const summary = dashboard.children.find((item) => item.child.id === id);
  if (!child || !summary) notFound();

  const activeRules = bundle.behaviorRules.filter((rule) => rule.isActive);
  const childLogs = bundle.behaviorLogs.filter((log) => log.childId === id);
  const todayLogs = childLogs.filter((log) => log.date === today);
  const doneTodayRuleIds = todayLogs
    .filter((log) => log.status === "approved" || log.status === "completed")
    .map((log) => log.behaviorRuleId);
  const todayDone = doneTodayRuleIds.length;
  const todayTotal = activeRules.length;
  const todayProgress = todayTotal > 0 ? Math.min(100, Math.round((todayDone / todayTotal) * 100)) : 0;
  const remaining = Math.max(0, todayTotal - todayDone);
  const activeRuleIds = activeRules.map((rule) => rule.id);
  const streak = computeStreak(childLogs, activeRuleIds, today);
  const week = buildWeek(childLogs, activeRuleIds, today);

  const policy = bundle.interestPolicies.find((item) => item.childId === id);
  const todayInterest = policy ? Math.round(estimateInterest(summary.wallet, policy) / 30) : 0;
  const { totalAllowance, totalSave, totalSpend, totalInterest } = summary.monthReport;
  const childTx = bundle.moneyTransactions
    .filter((transaction) => transaction.childId === id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <div className="mx-auto min-h-screen max-w-[440px] overflow-hidden bg-[#f4f5f8] shadow-[0_0_60px_rgba(23,24,28,0.14)]">
      <section className="relative overflow-hidden bg-[#23204f] px-4 pb-8 pt-[calc(18px+env(safe-area-inset-top))] text-white">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#6857ff]/55 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[#f06432]/20 blur-3xl" />

        {isParentOrAdmin && !isChildMode && (
          <div className="relative mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-[12px] backdrop-blur">
            <span className="font-700 text-white/75">부모 보기 중</span>
            <Link href="/approvals" prefetch={false} className="font-800 text-white">
              승인 대기 {summary.pendingApprovals}건 <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
        )}

        <header className="relative flex items-center justify-between">
          {isParentOrAdmin ? (
            <Link
              href="/"
              prefetch={false}
              aria-label="가족 홈으로 이동"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : <span className="h-10 w-10" aria-hidden="true" />}
          <div className="text-center">
            <p className="text-[11px] font-700 tracking-[0.16em] text-white/45">MONARI PASSBOOK</p>
            <h1 className="mt-0.5 text-[15px] font-800">{child.name}의 통장</h1>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f06432] text-[15px] font-900 shadow-[0_6px_16px_rgba(240,100,50,0.35)]"
            aria-label={`${child.name} 프로필`}
            role="img"
          >
            {child.name[0]}
          </div>
        </header>

        <div className="relative mt-7">
          <div className="flex items-center gap-2 text-white/55">
            <WalletCards className="h-4 w-4" />
            <p className="text-[13px] font-700">지금 쓸 수 있는 돈</p>
          </div>
          <p className="mt-2 text-[45px] font-900 leading-none tracking-[-0.06em] tabular-nums">
            {formatWon(summary.wallet.balance)}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#3fd17f]/15 px-3 py-1.5 text-[11px] font-800 text-[#7ce8a9]">
              현재 이자율 {summary.wallet.currentInterestRate}%
            </span>
            {todayInterest > 0 && (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-700 text-white/70">
                오늘 예상 이자 +{formatWon(todayInterest)}
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-[1fr_112px] gap-3 rounded-[24px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ffd166]" />
              <p className="text-[13px] font-800">오늘의 약속</p>
            </div>
            <p className="mt-3 text-[18px] font-900 leading-tight">
              {todayTotal === 0
                ? "오늘 등록된 약속이 없어요"
                : remaining > 0
                  ? `${remaining}개만 더 해볼까요?`
                  : "오늘 약속을 모두 지켰어요!"}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-white/50">
              {todayTotal === 0
                ? "부모님과 함께 새로운 약속을 만들어봐요."
                : streak > 0
                  ? `${streak}일 연속 좋은 습관을 만들고 있어요.`
                  : "작은 약속 하나부터 시작해봐요."}
            </p>
            <div className="mt-4 flex gap-1.5">
              {week.map((day) => (
                <div key={day.date} className="text-center">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-900 ${
                      day.done
                        ? "border-[#7ce8a9] bg-[#3fd17f] text-[#173a2a]"
                        : day.isToday
                          ? "border-[#ffd166] bg-[#ffd166]/15 text-[#ffd166]"
                          : "border-white/15 text-white/25"
                    }`}
                    aria-label={`${day.date} ${day.done ? "약속 완료" : day.isToday ? "오늘, 약속 진행 중" : "약속 미완료"}`}
                  >
                    {day.done ? <Check className="h-3 w-3" strokeWidth={3} /> : day.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="#today-promises"
            aria-label={`오늘 약속 ${todayDone}개 중 ${todayTotal}개 완료, 약속 체크로 이동`}
            className="relative flex aspect-square items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#ffd166 ${todayProgress * 3.6}deg, rgba(255,255,255,0.10) 0deg)`,
            }}
          >
            <span className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full bg-[#302b68]">
              <strong className="text-[25px] font-900 leading-none">{todayDone}/{todayTotal}</strong>
              <span className="mt-1 text-[10px] font-700 text-white/45">약속 완료</span>
            </span>
          </Link>
        </div>

        <div className="relative mt-3 grid grid-cols-2 gap-2.5">
          <Link href="#today-promises" className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-white text-[13px] font-900 text-[#282458]">
            <Check className="h-4 w-4" strokeWidth={3} /> 약속 체크하기
          </Link>
          <Link href="#save-form" className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-[#f06432] text-[13px] font-900 text-white shadow-[0_8px_20px_rgba(240,100,50,0.28)]">
            <PiggyBank className="h-4 w-4" /> 저금하기
          </Link>
        </div>
      </section>

      <main className="relative -mt-1 rounded-t-[30px] bg-[#f4f5f8] px-4 pb-36 pt-6">
        <SectionHeading title="이번 달 흐름" />
        <div className="-mx-4 mb-7 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FlowCard icon={<Landmark />} label="받은 용돈" value={formatWon(totalAllowance)} tone="violet" />
          <FlowCard icon={<TrendingUp />} label="받은 이자" value={formatWon(totalInterest)} tone="green" />
          <FlowCard icon={<PiggyBank />} label="저금한 돈" value={formatWon(totalSave)} tone="blue" />
          <FlowCard icon={<ReceiptText />} label="사용한 돈" value={formatWon(totalSpend)} tone="orange" />
          <span className="w-1 shrink-0" aria-hidden="true" />
        </div>

        <section className="mb-7">
          <SectionHeading title="최근 내역" actionHref="/records" actionLabel="전체 보기" />
          <div className="overflow-hidden rounded-[22px] border border-[var(--monari-line)] bg-white shadow-[var(--monari-shadow-card)]">
            {childTx.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-[var(--monari-ink-muted)]">아직 거래 내역이 없어요.</p>
            ) : (
              <ul>
                {childTx.map((transaction, index) => {
                  const minus = transaction.type === "spend" || transaction.type === "borrow";
                  return (
                    <li key={transaction.id} className={`flex items-center gap-3 px-4 py-3.5 ${index < childTx.length - 1 ? "border-b border-[var(--monari-line)]" : ""}`}>
                      <TransactionIcon type={transaction.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-800 text-[var(--monari-ink)]">{transactionLabel(transaction.type, transaction.memo)}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--monari-ink-muted)]">{relativeDate(transaction.date, today)}</p>
                      </div>
                      <p className={`shrink-0 text-[14px] font-900 tabular-nums ${minus ? "text-[var(--monari-ink)]" : "text-[var(--monari-plus)]"}`}>
                        {minus ? "-" : "+"}{formatWon(transaction.amount)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <FormSection id="today-promises" title="오늘 약속 체크" icon={<Check className="h-4 w-4" />}>
          <ChildBehaviorCheckForm childId={id} behaviorRules={activeRules} doneRuleIds={doneTodayRuleIds} />
        </FormSection>

        <FormSection id="save-form" title="저금하기" icon={<PiggyBank className="h-4 w-4" />}>
          <ChildSaveForm childId={id} />
        </FormSection>

        <FormSection id="borrow-form" title="미리쓰기 요청" icon={<ReceiptText className="h-4 w-4" />}>
          <BorrowRequestQuickForm childId={id} />
        </FormSection>
      </main>

      <ChildBottomNav childId={id} />
    </div>
  );
}

function SectionHeading({ title, actionHref, actionLabel }: { title: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[17px] font-900 tracking-tight text-[var(--monari-ink)]">{title}</h2>
      {actionHref && (
        <Link href={actionHref} prefetch={false} className="text-[12px] font-800 text-[var(--monari-ink-muted)]">
          {actionLabel} <ArrowRight className="inline h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function FlowCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "violet" | "green" | "blue" | "orange" }) {
  const tones = {
    violet: "bg-[#eeeaff] text-[#5547d7]",
    green: "bg-[#e7f8ed] text-[#238b51]",
    blue: "bg-[#e9f2ff] text-[#2d67b2]",
    orange: "bg-[#fff0e9] text-[#d95d2d]",
  };
  return (
    <div className="min-w-[138px] rounded-[20px] border border-[var(--monari-line)] bg-white p-4 shadow-[var(--monari-shadow-card)]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tones[tone]} [&>svg]:h-4 [&>svg]:w-4`}>{icon}</span>
      <p className="mt-3 text-[11px] font-700 text-[var(--monari-ink-muted)]">{label}</p>
      <p className="mt-1 text-[17px] font-900 tracking-tight text-[var(--monari-ink)] tabular-nums">{value}</p>
    </div>
  );
}

function FormSection({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-6 scroll-mt-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eeeaff] text-[#5547d7]">{icon}</span>
        <h2 className="text-[17px] font-900 tracking-tight text-[var(--monari-ink)]">{title}</h2>
      </div>
      <div className="rounded-[22px] border border-[var(--monari-line)] bg-white p-5 shadow-[var(--monari-shadow-card)]">{children}</div>
    </section>
  );
}

function TransactionIcon({ type }: { type: string }) {
  const positive = type === "allowance" || type === "reward" || type === "interest";
  const saved = type === "save";
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${positive ? "bg-[#e7f8ed] text-[#238b51]" : saved ? "bg-[#e9f2ff] text-[#2d67b2]" : "bg-[#fff0e9] text-[#d95d2d]"}`}>
      {saved ? <PiggyBank className="h-4 w-4" /> : positive ? <TrendingUp className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
    </span>
  );
}

function transactionLabel(type: string, memo: string): string {
  const labels: Record<string, string> = {
    allowance: "용돈",
    reward: "약속 보상",
    spend: memo || "사용",
    save: "저금하기",
    unsave: "저금 해제",
    borrow: "미리쓰기",
    repay: "상환",
    interest: "이자 지급",
  };
  return (labels[type] ?? memo) || type;
}

function relativeDate(date: string, today: string): string {
  const diff = Math.round((new Date(today).getTime() - new Date(date).getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff >= 0 && diff <= 6) return `${diff}일 전`;
  return date.slice(5).replace("-", ".");
}

function buildWeek(logs: BehaviorLog[], activeRuleIds: string[], today: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    const value = date.toISOString().slice(0, 10);
    return { date: value, done: completedAllRules(logs, activeRuleIds, value), isToday: value === today, label: date.getDate() };
  });
}

function computeStreak(logs: BehaviorLog[], activeRuleIds: string[], today: string): number {
  let streak = 0;
  const date = new Date(today);
  while (completedAllRules(logs, activeRuleIds, date.toISOString().slice(0, 10))) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function completedAllRules(logs: BehaviorLog[], activeRuleIds: string[], date: string) {
  if (activeRuleIds.length === 0) return false;
  const completedRuleIds = new Set(
    logs
      .filter((log) => log.date === date && (log.status === "approved" || log.status === "completed"))
      .map((log) => log.behaviorRuleId),
  );
  return activeRuleIds.every((ruleId) => completedRuleIds.has(ruleId));
}
