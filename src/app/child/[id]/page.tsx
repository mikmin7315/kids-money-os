import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatWon, formatWonParts } from "@/lib/format";
import type { BehaviorLog } from "@/lib/types";
import { getAmountMasked } from "@/actions/child-prefs";
import { AmountMaskToggle } from "@/components/child/amount-mask-toggle";

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

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const child = bundle.children.find((c) => c.id === id);
  const summary = dashboard.children.find((c) => c.child.id === id);
  if (!child || !summary) notFound();

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

  const policy = bundle.interestPolicies.find((p) => p.childId === id);
  const todayInterest = policy ? Math.round(estimateInterest(summary.wallet, policy) / 30) : 0;
  const { totalAllowance, totalSave, totalSpend, totalInterest } = summary.monthReport;

  const childTx = bundle.moneyTransactions
    .filter((t) => t.childId === id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const base = `/child/${id}`;
  const allDone = todayTotal > 0 && remaining === 0;

  return (
    <div style={{ background: "#F0FEFA", minHeight: "100vh" }}>

      {/* ── 히어로 헤더 ── */}
      <section
        className="relative overflow-hidden px-5 pb-6 pt-[calc(18px+env(safe-area-inset-top))]"
        style={{ background: "linear-gradient(145deg, #065F46 0%, #059669 45%, #10B981 80%, #34D399 100%)" }}
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
          ) : <span className="h-10 w-10" />}

          <div className="flex items-center gap-2">
            <span className="text-[22px]">🐳</span>
            <p className="text-[15px] font-800 text-white">{child.name}의 통장</p>
          </div>

          <AmountMaskToggle childId={id} masked={masked} />
        </header>

        {/* 잔액 */}
        <div className="relative text-center mb-5">
          <p className="text-[12px] font-700 tracking-[0.1em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
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

          {/* 이자율 + 오늘 이자 배지 */}
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            {summary.wallet.currentInterestRate > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-[12px] font-700 text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6EE7B7]" />
                이자율 {summary.wallet.currentInterestRate}%
              </span>
            )}
            {todayInterest > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-600 text-white/80">
                ✨ 오늘 이자 +{formatWon(todayInterest)}
              </span>
            )}
          </div>
        </div>

        {/* 스트릭 배너 */}
        {streak > 0 && (
          <div className="relative mb-3 flex items-center gap-2.5 rounded-[16px] bg-white/15 px-4 py-2.5">
            <span className="text-[20px]">🔥</span>
            <p className="text-[13px] font-800 text-white">{streak}일 연속 약속 달성 중!</p>
            <Sparkles className="ml-auto h-4 w-4 text-yellow-300" />
          </div>
        )}

        {/* 오늘 약속 + 진행 원 */}
        <div className="relative flex items-center gap-4 rounded-[20px] border border-white/20 bg-white/12 p-4 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-700 text-white/60 mb-1">오늘 약속</p>
            <p className="text-[20px] font-900 text-white leading-tight">
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
                  stroke={allDone ? "#6EE7B7" : "#FCD34D"}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - todayProgress / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-[18px] font-900 text-white leading-none">{todayDone}</strong>
                <span className="text-[9px] font-700 text-white/60 mt-0.5">/ {todayTotal}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 액션 버튼들 */}
        <div className="relative space-y-2">
          <Link
            href={`${base}/promise`}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-white transition active:scale-[0.97]"
            style={{ fontSize: 17, fontWeight: 900, color: "#059669" }}
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

      {/* ── 본문 ── */}
      <main className="px-4 pb-36 pt-5">

        {/* 이번 달 흐름 */}
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#052E16", letterSpacing: "-0.02em" }}>
            이번 달 흐름
          </h2>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-2.5">
          <KidFlowCard icon="💰" label="받은 용돈" value={masked ? "••••" : formatWon(totalAllowance)} bg="#D1FAE5" textColor="#065F46" />
          <KidFlowCard icon="✨" label="이자" value={masked ? "••••" : formatWon(totalInterest)} bg="#A7F3D0" textColor="#064E3B" />
          <KidFlowCard icon="🐷" label="저금" value={masked ? "••••" : formatWon(totalSave)} bg="#ECFDF5" textColor="#059669" />
          <KidFlowCard icon="🛍️" label="사용" value={masked ? "••••" : formatWon(totalSpend)} bg="#FFE4E6" textColor="#BE123C" />
        </div>

        {/* 이자 미리보기 */}
        {policy && summary.wallet.balance > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#052E16", letterSpacing: "-0.02em" }}>
                이자 미리보기 📈
              </h2>
              <Link href={`${base}/interest`} className="text-[13px] font-700 text-[#059669]">
                자세히 <ArrowRight className="inline h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(5,150,105,0.12)] border border-[#A7F3D0]">
              <div
                className="px-5 py-4"
                style={{ background: "linear-gradient(135deg, #065F46 0%, #059669 100%)" }}
              >
                <p className="text-[12px] font-600 text-white/70 mb-1">이대로면 이번 달</p>
                <p className="tabular-nums text-white" style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em" }}>
                  +{formatWon(estimateInterest(summary.wallet, policy))}
                </p>
                <p className="text-[12px] font-600 text-white/65 mt-1">이자가 더 생겨요! 🎉</p>
              </div>
              <div className="divide-y divide-[#F0FEFA]">
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-[13px] font-600 text-[#6B7280]">지금 남긴 돈</p>
                  <p className="text-[14px] font-800 text-[#052E16]">{formatWon(summary.wallet.balance)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-[13px] font-600 text-[#6B7280]">현재 이자율</p>
                  <p className="text-[14px] font-800 text-[#059669]">{summary.wallet.currentInterestRate}%</p>
                </div>
                <div className="px-5 py-3 bg-[#ECFDF5]">
                  <p className="text-[12px] font-700 text-[#059669]">
                    💡 약속을 더 지키면 이자율이 올라가요!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 미리쓰기 / 기타 링크 */}
        <div className="mb-6 grid grid-cols-2 gap-2.5">
          <Link
            href={`${base}/borrow`}
            className="flex items-center gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.07)] border border-[#A7F3D0] transition active:scale-[0.97]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#ECFDF5] text-xl flex-shrink-0">🛒</span>
            <div>
              <p className="text-[13px] font-800 text-[#052E16]">미리쓰기</p>
              <p className="text-[11px] font-600 text-[#6B7280] mt-0.5">요청하기 →</p>
            </div>
          </Link>
          <Link
            href={`${base}/records`}
            className="flex items-center gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.07)] border border-[#A7F3D0] transition active:scale-[0.97]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#ECFDF5] text-xl flex-shrink-0">📒</span>
            <div>
              <p className="text-[13px] font-800 text-[#052E16]">내 기록</p>
              <p className="text-[11px] font-600 text-[#6B7280] mt-0.5">전체 보기 →</p>
            </div>
          </Link>
        </div>

        {/* 최근 내역 */}
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#052E16", letterSpacing: "-0.02em" }}>
            최근 내역
          </h2>
          <Link href={`${base}/records`} prefetch={false} className="text-[13px] font-700 text-[#059669]">
            전체 보기 →
          </Link>
        </div>
        <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.07)] border border-[#A7F3D0]">
          {childTx.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[32px]">🌱</p>
              <p className="mt-2 text-[15px] font-700 text-[#052E16]">아직 거래 내역이 없어요</p>
              <p className="mt-1 text-[12px] text-[#6B7280]">용돈을 받거나 저금을 해봐요!</p>
            </div>
          ) : (
            <ul>
              {childTx.map((tx, i) => {
                const minus = tx.type === "spend" || tx.type === "borrow";
                const saved = tx.type === "save";
                return (
                  <li
                    key={tx.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < childTx.length - 1 ? "border-b border-[#F0FEFA]" : ""}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-lg ${
                      minus ? "bg-[#FFE4E6]" : saved ? "bg-[#A7F3D0]" : "bg-[#D1FAE5]"
                    }`}>
                      {minus ? "🛍️" : saved ? "🐷" : "💰"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-700 text-[#052E16]">{txLabel(tx.type, tx.memo)}</p>
                      <p className="mt-0.5 text-[11px] text-[#94a3b8]">{relativeDate(tx.date, today)}</p>
                    </div>
                    <p className={`shrink-0 tabular-nums text-[15px] font-800 ${minus ? "text-[#BE123C]" : "text-[#065F46]"}`}>
                      {minus ? "-" : "+"}{formatWon(tx.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 설정 링크 */}
        <Link
          href={`${base}/settings`}
          className="mt-4 flex items-center justify-between rounded-[18px] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#A7F3D0] transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="text-[20px]">⚙️</span>
            <p className="text-[13px] font-700 text-[#052E16]">설정 · 도움말</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#94a3b8]" />
        </Link>

      </main>

      {/* ── 하단 탭바 ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2 border-t border-[#A7F3D0]"
        style={{ background: "rgba(240,254,250,0.95)", backdropFilter: "blur(12px)" }}
      >
        <ChildNavItem href={base} icon="🏠" label="홈" active />
        <ChildNavItem href={`${base}/promise`} icon="✅" label="약속" />
        <ChildNavItem href={`${base}/records`} icon="📒" label="기록" />
        <ChildNavItem href={`${base}/settings`} icon="⚙️" label="설정" />
      </nav>
    </div>
  );
}

function ChildNavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-[12px] transition ${active ? "bg-[#D1FAE5]" : ""}`}
    >
      <span className={`text-[22px] ${active ? "" : "opacity-35"}`}>{icon}</span>
      <span className={`text-[9px] font-800 ${active ? "text-[#059669]" : "text-[#94a3b8]"}`}>{label}</span>
    </Link>
  );
}

function KidFlowCard({ icon, label, value, bg, textColor }: {
  icon: string; label: string; value: string; bg: string; textColor: string;
}) {
  return (
    <div className="rounded-[18px] p-4" style={{ background: bg }}>
      <span className="text-[22px] mb-2 block">{icon}</span>
      <p className="text-[11px] font-700 mb-1" style={{ color: textColor + "99" }}>{label}</p>
      <p className="tabular-nums text-[20px] font-900 leading-none" style={{ color: textColor, letterSpacing: "-0.02em" }}>
        {value}
      </p>
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
