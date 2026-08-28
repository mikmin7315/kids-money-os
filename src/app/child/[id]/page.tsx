import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  PiggyBank,
  Settings,
  Sparkles,
} from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { countUnreadChildNotificationsAction } from "@/lib/supabase/actions/notifications";
import { getPeerComparisonAction, type PeerComparisonData } from "@/actions/management";
import { estimateInterest } from "@/lib/finance";
import { formatWon, formatWonParts } from "@/lib/format";
import type { BehaviorLog } from "@/lib/types";
import { getAmountMasked } from "@/actions/child-prefs";
import { AmountMaskToggle } from "@/components/child/amount-mask-toggle";
import { ChildInterestReportCard } from "@/components/settlement/child-interest-report-card";

export const dynamic = "force-dynamic";

export default async function ChildHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle, dashboard, masked] = await Promise.all([
    getChildModeContext(),
    getAppDataBundle(),
    getDashboardView(),
    getAmountMasked(),
  ]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const unreadNotifCount = isChildMode ? await countUnreadChildNotificationsAction(id) : 0;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const child = bundle.children.find((c) => c.id === id);
  const summary = dashboard.children.find((c) => c.child.id === id);
  if (!child || !summary) notFound();

  const peerData = isParentOrAdmin ? await getPeerComparisonAction(child.birthYear) : null;

  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);
  const childLogs = bundle.behaviorLogs.filter((l) => l.childId === id);
  const todayLogs = childLogs.filter((l) => l.date === today);
  const doneTodayRuleIds = todayLogs
    .filter((l) => l.status === "approved" || l.status === "completed")
    .map((l) => l.behaviorRuleId);
  const todayDone = doneTodayRuleIds.length;
  const todayTotal = activeRules.length;
  const todayProgress = todayTotal > 0 ? Math.min(100, Math.round((todayDone / todayTotal) * 100)) : 0;
  const remaining = Math.max(0, todayTotal - todayDone);

  const activeRuleIds = activeRules.map((r) => r.id);
  const streak = computeStreak(childLogs, activeRuleIds, today);

  // 이번 달 행동 달성률 (이자율 반영 기준)
  const thisMonth = today.slice(0, 7);
  const recurringRules = activeRules.filter((r) => r.ruleCategory === "recurring");
  const daysElapsed = new Date(today).getDate();
  const monthLogsApproved = childLogs.filter(
    (l) => l.date.startsWith(thisMonth) && (l.status === "approved" || l.status === "completed"),
  );
  const monthRecurringAchieved = monthLogsApproved.filter((l) =>
    recurringRules.some((r) => r.id === l.behaviorRuleId),
  ).length;
  const monthRecurringPossible = daysElapsed * recurringRules.length;
  const monthAchievementRate =
    monthRecurringPossible > 0 ? Math.min(100, Math.round((monthRecurringAchieved / monthRecurringPossible) * 100)) : null;
  const targetRate = recurringRules[0]?.monthlyTargetRate ?? 80;

  const policy = bundle.interestPolicies.find((p) => p.childId === id);
  const _todayInterest = policy ? Math.round(estimateInterest(summary.wallet, policy) / 30) : 0;
  const { totalAllowance, totalSave, totalSpend, totalInterest } = summary.monthReport;

  const childTx = bundle.moneyTransactions
    .filter((t) => t.childId === id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const base = `/child/${id}`;
  const isNewChild = summary.wallet.balance === 0 && bundle.moneyTransactions.filter((t) => t.childId === id).length === 0;
  const allDone = todayTotal > 0 && remaining === 0;

  return (
    <div style={{ minHeight: "100dvh" }}>

      {/* ── 히어로 헤더 ── */}
      <section
        className="relative overflow-hidden px-5 pb-6 pt-[calc(18px+env(safe-area-inset-top))]"
        style={{ background: "linear-gradient(145deg, #0C4B78 0%, #0369A1 45%, #0EA5E9 80%, #38BDF8 100%)" }}
      >
        {/* 배경 원 장식 */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-white/06" />

        {/* 상단 바 */}
        <header className="relative flex items-center justify-between mb-6">
          {isParentOrAdmin ? (
            <Link
              href="/"
              prefetch={false}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
          ) : (
            <Link
              href={`/child/${id}/settings`}
              aria-label="설정"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition active:scale-95"
            >
              <Settings className="h-5 w-5 text-white" />
            </Link>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[22px]">🐳</span>
            <p className="text-[15px] font-extrabold text-white">{child.name}의 통장</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              aria-label={unreadNotifCount > 0 ? `알림 ${unreadNotifCount}건 미읽음` : "알림 보기"}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition active:scale-90"
            >
              <Bell className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
              {unreadNotifCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                  {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                </span>
              )}
            </Link>
            <AmountMaskToggle childId={id} masked={masked} />
          </div>
        </header>

        {/* 잔액 */}
        <div className="relative text-center mb-5">
          <p className="text-[12px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            내 돈 💰
          </p>
          <Link
            href={`${base}/balance`}
            className="inline-block transition active:opacity-75"
          >
            {masked ? (
              <span className="text-white tabular-nums" style={{ fontSize: 68, fontWeight: 900, letterSpacing: "-0.04em" }}>
                ••••
              </span>
            ) : (
              <div className="flex items-end justify-center gap-1 leading-none">
                <span className="text-white tabular-nums" style={{ fontSize: 68, fontWeight: 900, letterSpacing: "-0.04em" }}>
                  {formatWonParts(summary.wallet.balance).amount}
                </span>
                <span className="mb-2" style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>원</span>
              </div>
            )}
          </Link>

          {/* 이자율 + 이달 예상 이자 배지 */}
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            {policy ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-[12px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7DD3FC]" />
                이자율 {summary.wallet.currentInterestRate}%
                {estimateInterest(summary.wallet, policy) > 0 && (
                  <span className="text-[#7DD3FC]">
                    · 이달 +{formatWon(estimateInterest(summary.wallet, policy))}
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-[12px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                이자율 설정 전
              </span>
            )}
          </div>
        </div>

        {/* 스트릭 배너 */}
        {streak > 0 && (
          <div className="relative mb-3 flex items-center gap-2.5 rounded-[16px] bg-white/15 px-4 py-2.5">
            <span className="text-[20px]">🔥</span>
            <p className="text-[13px] font-extrabold text-white">{streak}일 연속 약속 달성 중!</p>
            <Sparkles className="ml-auto h-4 w-4 text-yellow-300" />
          </div>
        )}

        {/* 오늘 약속 + 진행 원 */}
        <div className="relative flex items-center gap-4 rounded-[20px] border border-white/20 bg-white/12 p-4 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-white/60 mb-1">오늘 약속</p>
            <p className="text-[20px] font-black text-white leading-tight">
              {todayTotal === 0 ? "약속이 없어요" : allDone ? "모두 완료! 🎉" : `${remaining}개 남았어요`}
            </p>
          </div>
          {/* 도넛 원형 진행률 */}
          <Link href={`${base}/promise`}>
            <div className="relative h-[68px] w-[68px] flex-shrink-0">
              <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90 w-full h-full">
                <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
                <circle
                  cx="34" cy="34" r="28" fill="none"
                  stroke={allDone ? "#7DD3FC" : "#FCD34D"}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - todayProgress / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-[18px] font-black text-white leading-none">{todayDone}</strong>
                <span className="text-[10px] font-bold text-white/60 mt-0.5">/ {todayTotal}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 액션 버튼들 */}
        <div className="relative space-y-2">
          <Link
            href={`${base}/promise`}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-white transition active:scale-[0.97]"
            style={{ fontSize: 17, fontWeight: 900, color: "#0EA5E9" }}
          >
            <Check className="h-5 w-5" strokeWidth={3} />
            약속 체크하기
          </Link>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href={`${base}/save`}
              className="flex h-12 items-center justify-center gap-1 rounded-[16px] bg-white/20 transition active:scale-[0.97]"
              style={{ fontSize: 14, fontWeight: 800, color: "white" }}
            >
              <PiggyBank className="h-4 w-4" /> 저금
            </Link>
            <Link
              href={`${base}/promise-month`}
              className="flex h-12 items-center justify-center rounded-[16px] bg-white/20 transition active:scale-[0.97]"
              style={{ fontSize: 14, fontWeight: 800, color: "white" }}
            >
              이번 달
            </Link>
            <Link
              href={`${base}/cash`}
              className="flex h-12 items-center justify-center rounded-[16px] bg-white/20 transition active:scale-[0.97]"
              style={{ fontSize: 14, fontWeight: 800, color: "white" }}
            >
              현금
            </Link>
          </div>
        </div>
      </section>

      {/* ── 본문 (단일 스크롤) ── */}
      <main className="px-4 pb-36 pt-5">

        {/* 목표 저금통 카드 */}
        <Link
          href={`${base}/goal`}
          className="mb-5 flex items-center gap-3 rounded-[20px] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(14,165,233,0.12)] border border-[#7DD3FC] transition active:scale-[0.97]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#E0F2FE] text-2xl flex-shrink-0">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-[#0EA5E9] mb-0.5">목표 저금통</p>
            <p className="text-[15px] font-black text-[#0C2D4E]">꿈을 위해 모아봐요!</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#7DD3FC] flex-shrink-0" />
        </Link>

        {/* 신규 아이 온보딩 배너 */}
        {isNewChild && (
          <div className="mb-5 overflow-hidden rounded-[22px] border border-[#7DD3FC]" style={{ background: "linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)" }}>
            <div className="px-5 py-5">
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0EA5E9", marginBottom: 6 }}>👋 통장 개설 완료!</p>
              <p style={{ fontSize: 17, fontWeight: 900, color: "#0C2D4E", letterSpacing: "-0.02em", lineHeight: 1.4 }}>
                이제 용돈을 받으면<br />여기서 확인할 수 있어요
              </p>
            </div>
            <div className="border-t border-[#7DD3FC] grid grid-cols-2 divide-x divide-[#7DD3FC]">
              <Link href={`${base}/promise`} className="flex items-center justify-center gap-1.5 py-3 text-[13px] font-extrabold text-[#0EA5E9] transition active:bg-[#7DD3FC]/40">약속 체크하기 ✅</Link>
              <Link href={`${base}/interest`} className="flex items-center justify-center gap-1.5 py-3 text-[13px] font-extrabold text-[#4424B0] transition active:bg-[#7DD3FC]/40">이자율 보기 📈</Link>
            </div>
          </div>
        )}

        {/* 이자율 리포트 */}
        {!isNewChild && <ChildInterestReportCard childId={id} />}

        {/* 이번 달 행동 달성률 */}
        {monthAchievementRate !== null && (
          <MonthAchievementCard rate={monthAchievementRate} targetRate={targetRate} daysElapsed={daysElapsed} base={base} />
        )}

        {/* 이번 달 흐름 */}
        <h2 className="mb-3 mt-2" style={{ fontSize: 17, fontWeight: 900, color: "#0C2D4E", letterSpacing: "-0.02em" }}>이번 달 흐름</h2>
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          <KidFlowCard icon="💰" label="받은 용돈" value={masked ? "••••" : formatWon(totalAllowance)} bg="#BAE6FD" textColor="#4424B0" />
          <KidFlowCard icon="✨" label="이자" value={masked ? "••••" : formatWon(totalInterest)} bg="#DDD6FE" textColor="#0C4B78" />
          <KidFlowCard icon="🐷" label="저금" value={masked ? "••••" : formatWon(totalSave)} bg="#F5F3FF" textColor="#0EA5E9" />
          <KidFlowCard icon="🛍️" label="사용" value={masked ? "••••" : formatWon(totalSpend)} bg="#FFE4E6" textColor="#BE123C" />
        </div>

        {/* 저금 달성률 */}
        {totalAllowance > 0 && !isNewChild && (
          <div className="mb-5">
            <h2 className="mb-3" style={{ fontSize: 17, fontWeight: 900, color: "#0C2D4E", letterSpacing: "-0.02em" }}>저금 달성률 🐷</h2>
            <SavingsRateCard totalSave={totalSave} totalAllowance={totalAllowance} masked={masked} base={base} />
          </div>
        )}

        {/* 또래 비교 */}
        {peerData && !isNewChild && totalAllowance > 0 && (
          <div className="mb-5">
            <PeerComparisonCard
              peer={peerData}
              childSaveRate={Math.round((totalSave / Math.max(totalAllowance, 1)) * 100)}
              childName={child.name}
              masked={masked}
            />
          </div>
        )}

        {/* 오늘의 금융 대화 팁 */}
        <CoachingTipCard today={today} childName={child.name} />

        {/* 이자 미리보기 */}
        {policy && summary.wallet.balance > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 17, fontWeight: 900, color: "#0C2D4E", letterSpacing: "-0.02em" }}>이자 미리보기 📈</h2>
              <Link href={`${base}/interest`} className="text-[13px] font-bold text-[#0EA5E9]">자세히 <ArrowRight className="inline h-3.5 w-3.5" /></Link>
            </div>
            <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(14,165,233,0.12)] border border-[#7DD3FC]">
              <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, #0C4B78 0%, #0EA5E9 100%)" }}>
                <p className="text-[12px] font-semibold text-white/70 mb-1">이대로면 이번 달</p>
                <p className="tabular-nums text-white" style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em" }}>+{formatWon(estimateInterest(summary.wallet, policy))}</p>
                <p className="text-[12px] font-semibold text-white/65 mt-1">이자가 더 생겨요! 🎉</p>
              </div>
              <div className="divide-y divide-[#E0F2FE]">
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-[13px] font-semibold text-[var(--monari-ink-muted)]">지금 남긴 돈</p>
                  <p className="text-[14px] font-extrabold text-[#0C2D4E]">{formatWon(summary.wallet.balance)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-[13px] font-semibold text-[var(--monari-ink-muted)]">현재 이자율</p>
                  <p className="text-[14px] font-extrabold text-[#0EA5E9]">{summary.wallet.currentInterestRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 내역 */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#0C2D4E", letterSpacing: "-0.02em" }}>최근 내역</h2>
            <Link href={`${base}/records`} prefetch={false} className="text-[13px] font-bold text-[#0EA5E9]">전체 보기 →</Link>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_10px_rgba(14,165,233,0.1)] border border-[#7DD3FC]">
            {childTx.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[32px]">🌱</p>
                <p className="mt-2 text-[15px] font-bold text-[#0C2D4E]">아직 거래 내역이 없어요</p>
                <p className="mt-1 text-[12px] text-[var(--monari-ink-muted)]">용돈을 받거나 저금을 해봐요!</p>
              </div>
            ) : (
              <ul>
                {childTx.map((tx, i) => {
                  const minus = tx.type === "spend" || tx.type === "borrow";
                  const saved = tx.type === "save";
                  return (
                    <li key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < childTx.length - 1 ? "border-b border-[#F0EEFF]" : ""}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-lg ${minus ? "bg-[#FFE4E6]" : saved ? "bg-[#DDD6FE]" : "bg-[#BAE6FD]"}`}>
                        {minus ? "🛍️" : saved ? "🐷" : "💰"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-[#052E16]">{txLabel(tx.type, tx.memo)}</p>
                        <p className="mt-0.5 text-[11px] text-[#94a3b8]">{relativeDate(tx.date, today)}</p>
                      </div>
                      <p className={`shrink-0 tabular-nums text-[15px] font-extrabold ${minus ? "text-[#BE123C]" : "text-[#0369A1]"}`}>
                        {minus ? "-" : "+"}{formatWon(tx.amount)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`${base}/save`}
            className="flex items-center gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(14,165,233,0.10)] border border-[#7DD3FC] transition active:scale-[0.97]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#F5F3FF] text-xl flex-shrink-0">🐷</span>
            <div className="flex-1">
              <p className="text-[13px] font-extrabold text-[#0C2D4E]">저금하기</p>
              <p className="text-[11px] font-semibold text-[var(--monari-ink-muted)] mt-0.5">돈 모으기</p>
            </div>
          </Link>
          <Link
            href={`${base}/borrow`}
            className="flex items-center gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(14,165,233,0.10)] border border-[#7DD3FC] transition active:scale-[0.97]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#BAE6FD] text-xl flex-shrink-0">🛒</span>
            <div className="flex-1">
              <p className="text-[13px] font-extrabold text-[#0C2D4E]">미리쓰기</p>
              <p className="text-[11px] font-semibold text-[var(--monari-ink-muted)] mt-0.5">먼저 쓰고 나중에 갚기</p>
            </div>
          </Link>
        </div>

      </main>

    </div>
  );
}

function SavingsRateCard({ totalSave, totalAllowance, masked, base }: {
  totalSave: number; totalAllowance: number; masked: boolean; base: string;
}) {
  const rate = Math.round((totalSave / totalAllowance) * 100);
  const TARGET = 30;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(rate / 100, 1) * circumference;
  const reached = rate >= TARGET;
  const color = reached ? "#0EA5E9" : rate >= 15 ? "#D97706" : "#94A3B8";
  const message = reached ? "저금 목표 달성! 🎉" : rate >= 15 ? `목표까지 ${TARGET - rate}% 남았어요` : "저금을 시작해봐요 💪";

  return (
    <Link href={`${base}/save`} className="block overflow-hidden rounded-[20px] bg-white border border-[#7DD3FC] shadow-[0_2px_12px_rgba(14,165,233,0.10)] transition active:scale-[0.98]">
      <div className="flex items-center gap-4 px-5 py-4">
        {/* 링 차트 */}
        <svg width="88" height="88" viewBox="0 0 88 88" aria-label={`저금 달성률 ${rate}%`}>
          <circle cx="44" cy="44" r={r} fill="none" stroke="#BAE6FD" strokeWidth="9" />
          <circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeDashoffset={circumference * 0.25}
          />
          <text x="44" y="40" textAnchor="middle" style={{ fontSize: 16, fontWeight: 900, fill: color }}>
            {masked ? "••" : `${rate}%`}
          </text>
          <text x="44" y="56" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: "#94A3B8" }}>
            저금률
          </text>
        </svg>
        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold mb-1" style={{ color }}>
            목표 {TARGET}%
            {reached && <span className="ml-1.5 rounded-full bg-[#BAE6FD] px-2 py-0.5 text-[10px] text-[#0369A1]">달성 ✓</span>}
          </p>
          <p className="text-[15px] font-black text-[#0C2D4E] leading-snug">{masked ? "••••원 저금했어요" : `${formatWon(totalSave)} 저금했어요`}</p>
          <p className="mt-1 text-[12px] font-semibold text-[#94A3B8]">{message}</p>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#7DD3FC]" />
      </div>
    </Link>
  );
}

function KidFlowCard({ icon, label, value, bg, textColor }: {
  icon: string; label: string; value: string; bg: string; textColor: string;
}) {
  return (
    <div className="rounded-[18px] p-4" style={{ background: bg }}>
      <span className="text-[22px] mb-2 block">{icon}</span>
      <p className="text-[11px] font-bold mb-1" style={{ color: textColor }}>{label}</p>
      <p className="tabular-nums text-[20px] font-black leading-none" style={{ color: textColor, letterSpacing: "-0.02em" }}>
        {value}
      </p>
    </div>
  );
}

const COACHING_TIPS = [
  { emoji: "🛒", topic: "계획 소비", tip: "오늘 살 것을 미리 정해봤어?", sub: "계획하고 사면 후회가 훨씬 적어요!" },
  { emoji: "🎁", topic: "이자의 비밀", tip: "이자가 뭔지 알아?", sub: "돈을 모아두면 은행이 선물처럼 돈을 더 줘요" },
  { emoji: "🎯", topic: "저축 목표", tip: "저금해서 뭘 살 거야?", sub: "목표가 있으면 저금이 더 즐거워져요" },
  { emoji: "💝", topic: "돈 나누기", tip: "용돈을 3가지로 나눠볼까?", sub: "쓸 돈 · 모을 돈 · 나눌 돈으로 나눠봐요" },
  { emoji: "✅", topic: "약속 연결", tip: "약속을 지키면 이자율이 올라가!", sub: "이자율이 높을수록 돈이 더 빨리 자라요" },
  { emoji: "❓", topic: "필요 vs 원함", tip: "이게 꼭 필요한 건지, 그냥 갖고 싶은 건지?", sub: "필요한 것 먼저, 그다음 원하는 것 순서예요" },
  { emoji: "📈", topic: "복리 마법", tip: "1년 동안 매달 1만원씩 모으면 얼마가 될까?", sub: "이자가 붙으면 12만원보다 조금 더 돼요!" },
  { emoji: "💼", topic: "돈 버는 방법", tip: "돈을 벌려면 어떤 일을 할 수 있을까?", sub: "집안일 돕기, 재활용하기 같은 것도 돼요" },
  { emoji: "🐷", topic: "저금 습관", tip: "용돈을 받으면 가장 먼저 뭘 해?", sub: "저금을 먼저 하고 나서 쓰는 습관이 좋아요" },
  { emoji: "🤝", topic: "빌리기와 갚기", tip: "친구가 돈을 빌려달라고 하면 어떻게 할래?", sub: "빌려줄 땐 언제 갚을지 꼭 정해두는 게 좋아요" },
  { emoji: "🌱", topic: "작은 시작", tip: "100원도 저금이 될까?", sub: "작은 돈도 꾸준히 모으면 크게 자라요" },
  { emoji: "🏆", topic: "목표 달성", tip: "이번 달 가장 잘한 소비는 뭐야?", sub: "잘한 것을 기억하면 다음번에도 잘할 수 있어요" },
  { emoji: "🔒", topic: "안전한 돈", tip: "은행에 돈을 왜 맡길까?", sub: "안전하게 보관하면서 이자도 받을 수 있거든요" },
  { emoji: "📊", topic: "기록의 힘", tip: "이번 달 뭘 샀는지 기억해?", sub: "기록을 보면 다음 달을 더 잘 계획할 수 있어요" },
  { emoji: "🌍", topic: "나눔의 기쁨", tip: "내 용돈으로 다른 사람을 도울 수 있을까?", sub: "조금씩 나누면 기쁨이 두 배가 돼요" },
];

function CoachingTipCard({ today, childName }: { today: string; childName: string }) {
  const dayOfYear = Math.floor((new Date(today).getTime() - new Date(today.slice(0, 4) + "-01-01").getTime()) / 86400000);
  const tip = COACHING_TIPS[dayOfYear % COACHING_TIPS.length];

  return (
    <div className="mb-5 overflow-hidden rounded-[20px]" style={{ background: "linear-gradient(135deg,#E0F2FE 0%,#BAE6FD 100%)", border: "1px solid #7DD3FC" }}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="rounded-full bg-[#0EA5E9]/10 px-2.5 py-0.5 text-[11px] font-extrabold text-[#0EA5E9]">💬 오늘의 대화</span>
          <span className="text-[11px] font-semibold text-[#94a3b8]">{tip.topic}</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-[32px] leading-none">{tip.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-black leading-snug" style={{ color: "#0C2D4E", letterSpacing: "-0.02em" }}>
              {childName}야, {tip.tip}
            </p>
            <p className="mt-1.5 text-[12px] font-semibold leading-5" style={{ color: "#0369A1" }}>{tip.sub}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-[#7DD3FC]/60 px-4 py-2.5">
        <p className="text-[11px] font-semibold text-[#94a3b8]">부모님과 함께 이야기 해봐요 · 내일 또 새로운 팁이 와요</p>
      </div>
    </div>
  );
}

function txLabel(type: string, memo: string): string {
  const labels: Record<string, string> = {
    allowance: "용돈", reward: "약속 보상", spend: memo || "사용",
    save: "저금하기", unsave: "저금 해제", borrow: "미리쓰기",
    repay: "상환", interest: "이자 지급",
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

function MonthAchievementCard({ rate, targetRate, daysElapsed, base }: {
  rate: number; targetRate: number; daysElapsed: number; base: string;
}) {
  const reached = rate >= targetRate;
  const color = reached ? "#059669" : rate >= targetRate * 0.6 ? "#D97706" : "#94A3B8";
  const bg = reached ? "#ECFDF5" : rate >= targetRate * 0.6 ? "#FFFBEB" : "#F8FAFC";
  const borderColor = reached ? "#6EE7B7" : rate >= targetRate * 0.6 ? "#FCD34D" : "#E2E8F0";
  const label = reached ? `목표 달성! 이자율 상승 🎉` : `목표까지 ${targetRate - rate}% 더 필요해요`;

  return (
    <div className="mb-5">
      <h2 className="mb-3" style={{ fontSize: 17, fontWeight: 900, color: "#0C2D4E", letterSpacing: "-0.02em" }}>이번 달 약속 달성률 🎯</h2>
      <a href={`${base}/promise-month`} className="block overflow-hidden rounded-[20px] border transition active:scale-[0.98]" style={{ background: bg, borderColor }}>
        <div className="px-5 py-4 flex items-center gap-4">
          {/* 원형 진행 */}
          <svg width="72" height="72" viewBox="0 0 72 72" aria-label={`이번 달 달성률 ${rate}%`}>
            <circle cx="36" cy="36" r="28" fill="none" stroke={reached ? "#D1FAE5" : rate >= targetRate * 0.6 ? "#FEF3C7" : "#F1F5F9"} strokeWidth="8" />
            <circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(rate, 100) / 100)}`}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
            <text x="36" y="32" textAnchor="middle" style={{ fontSize: 16, fontWeight: 900, fill: color }}>{rate}%</text>
            <text x="36" y="46" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: "#94A3B8" }}>달성률</text>
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-extrabold rounded-full px-2 py-0.5" style={{ background: color + "22", color }}>
                목표 {targetRate}%
              </span>
              {reached && <span className="text-[11px] font-extrabold text-emerald-600">✓ 달성</span>}
            </div>
            <p className="text-[14px] font-black leading-snug" style={{ color: "#0C2D4E" }}>{label}</p>
            <p className="mt-1 text-[11px] font-semibold" style={{ color: "#94A3B8" }}>{daysElapsed}일째 기준 · 목표 달성 시 이자율 올라가요</p>
          </div>
        </div>
        {/* 하단 안내 */}
        <div className="border-t px-5 py-2.5" style={{ borderColor }}>
          <p className="text-[11px] font-semibold" style={{ color }}>
            {reached ? "이번 달 말 이자 정산 때 이자율이 올라가요! 🚀" : "매일 약속을 지키면 다음 달 이자율이 올라가요"}
          </p>
        </div>
      </a>
    </div>
  );
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
  const dayApproved = logs
    .filter((l) => l.date === date && (l.status === "approved" || l.status === "completed"))
    .map((l) => l.behaviorRuleId);
  return activeRuleIds.every((id) => dayApproved.includes(id));
}

function PeerComparisonCard({
  peer, childSaveRate, childName, masked,
}: {
  peer: PeerComparisonData;
  childSaveRate: number;
  childName: string;
  masked: boolean;
}) {
  const diff = childSaveRate - peer.avgSavingsRate;
  const isAhead = diff >= 0;
  const bar = (v: number) => Math.min(100, Math.max(0, v));

  return (
    <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(14,165,233,0.10)] border border-[#BAE6FD]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0F2FE]">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>🗺️</span>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0C2D4E" }}>
            {peer.isRegional ? `${peer.regionLabel} 또래 비교` : "전국 또래 비교"}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>
          {peer.sampleSize}명 참여
        </span>
      </div>

      {/* 비교 바 */}
      <div className="px-5 py-4 space-y-3">
        {/* 또래 평균 */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8" }}>또래 평균</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8" }}>
              {masked ? "••%" : `${peer.avgSavingsRate.toFixed(1)}%`}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${bar(peer.avgSavingsRate)}%`, background: "#CBD5E1" }}
            />
          </div>
        </div>

        {/* 우리 아이 */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0EA5E9" }}>{childName}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#0EA5E9" }}>
              {masked ? "••%" : `${childSaveRate}%`}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#BAE6FD] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${bar(childSaveRate)}%`, background: "linear-gradient(90deg, #0EA5E9, #60A5FA)" }}
            />
          </div>
        </div>
      </div>

      {/* 결과 메시지 */}
      {!masked && (
        <div
          className="flex items-center gap-2 px-5 py-3 border-t border-[#E0F2FE]"
          style={{ background: isAhead ? "#F0FDF4" : "#FFF7ED" }}
        >
          <span style={{ fontSize: 18 }}>{isAhead ? "🌟" : "💪"}</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: isAhead ? "#15803D" : "#C2410C" }}>
            {isAhead
              ? `또래보다 ${diff.toFixed(1)}% 더 저금하고 있어요!`
              : `또래보다 ${Math.abs(diff).toFixed(1)}% 낮아요. 조금 더 도전해봐요!`}
          </p>
        </div>
      )}
    </div>
  );
}
