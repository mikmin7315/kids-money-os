import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Landmark,
  PiggyBank,
  ReceiptText,
  TrendingUp,
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

  const isParentOrAdmin =
    auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
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

  return (
    <>
      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden px-5 pb-8 pt-[calc(20px+env(safe-area-inset-top))] text-white"
        style={{ background: "linear-gradient(145deg, #5b21b6 0%, #7c3aed 55%, #9333ea 100%)" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />

        <header className="relative flex items-center justify-between mb-8">
          {isParentOrAdmin ? (
            <Link href="/" prefetch={false} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : <span className="h-11 w-11" />}
          <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{child.name}의 통장 💰</p>
          <AmountMaskToggle childId={id} masked={masked} />
        </header>

        {/* 잔액 */}
        <div className="relative text-center mb-6">
          <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>내 돈</p>
          <Link href={`${base}/balance`} className="flex items-end justify-center gap-1 leading-none transition active:opacity-80">
            {masked ? (
              <span className="tabular-nums text-white" style={{ fontSize: 72, fontWeight: 900, letterSpacing: "-0.04em" }}>
                ••••
              </span>
            ) : (
              <>
                <span className="tabular-nums text-white" style={{ fontSize: 72, fontWeight: 900, letterSpacing: "-0.04em" }}>
                  {formatWonParts(summary.wallet.balance).amount}
                </span>
                <span className="mb-3" style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>원</span>
              </>
            )}
          </Link>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {summary.wallet.currentInterestRate > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#86efac]" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                  이자율 {summary.wallet.currentInterestRate}%
                </span>
              </div>
            )}
            {todayInterest > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5">
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
                  오늘 이자 +{formatWon(todayInterest)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 약속 진행 + 버튼 */}
        <div className="relative rounded-[24px] bg-white/12 border border-white/15 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>오늘 약속</p>
              <p className="mt-1" style={{ fontSize: 22, fontWeight: 900, color: "white" }}>
                {todayTotal === 0 ? "약속이 없어요" : remaining === 0 ? "모두 완료! 🎉" : `${remaining}개 남았어요`}
              </p>
              {streak > 0 && (
                <p className="mt-1" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                  🔥 {streak}일 연속 달성 중!
                </p>
              )}
            </div>
            <Link href={`${base}/promise`}
              className="relative flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#fbbf24 ${todayProgress * 3.6}deg, rgba(255,255,255,0.12) 0deg)` }}>
              <span className="absolute inset-[7px] flex flex-col items-center justify-center rounded-full bg-[#4c1d95]">
                <strong style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{todayDone}/{todayTotal}</strong>
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>완료</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          <Link href={`${base}/promise`} className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-white"
            style={{ fontSize: 16, fontWeight: 800, color: "#5b21b6" }}>
            <Check className="h-5 w-5" strokeWidth={3} /> 약속 체크
          </Link>
          <Link href={`${base}/save`} className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-[#f59e0b]"
            style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
            <PiggyBank className="h-5 w-5" /> 저금하기
          </Link>
          <Link href={`${base}/promise-month`} className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-white/80"
            style={{ fontSize: 15, fontWeight: 800, color: "#5b21b6" }}>
            🤝 이번 달 약속
          </Link>
          <Link href={`${base}/cash`} className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-white/80"
            style={{ fontSize: 15, fontWeight: 800, color: "#b45309" }}>
            💸 현금 기록
          </Link>
        </div>
      </section>

      {/* ── 본문 ── */}
      <main className="px-4 pb-36 pt-6">
        {/* 이번 달 흐름 */}
        <KidSectionTitle>이번 달 흐름</KidSectionTitle>
        <div className="mb-8 mt-3 grid grid-cols-2 gap-3">
          <FlowCard icon={<Landmark />} label="받은 용돈" value={masked ? "••••" : formatWon(totalAllowance)} tone="violet" />
          <FlowCard icon={<TrendingUp />} label="이자" value={masked ? "••••" : formatWon(totalInterest)} tone="green" />
          <FlowCard icon={<PiggyBank />} label="저금" value={masked ? "••••" : formatWon(totalSave)} tone="blue" />
          <FlowCard icon={<ReceiptText />} label="사용" value={masked ? "••••" : formatWon(totalSpend)} tone="orange" />
        </div>

        {/* C-I-02: 이자 미리보기 */}
        {policy && summary.wallet.balance > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <KidSectionTitle>이자 미리보기 📈</KidSectionTitle>
              <Link href={`${base}/interest`} style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>
                자세히 <ArrowRight className="inline h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mb-8 mt-0 overflow-hidden rounded-[24px] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <div
                className="px-5 py-4"
                style={{ background: "linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)" }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  이대로면 이번 달
                </p>
                <p className="mt-1 tabular-nums" style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                  +{formatWon(estimateInterest(summary.wallet, policy))}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                  이자가 더 생겨요!
                </p>
              </div>
              <div className="divide-y divide-[#f3f4f6]">
                <div className="flex items-center justify-between px-5 py-3">
                  <p style={{ fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>지금 남긴 돈</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#1a0533" }}>{formatWon(summary.wallet.balance)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <p style={{ fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>현재 이자율</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#7c3aed" }}>{summary.wallet.currentInterestRate}%</p>
                </div>
                <div className="px-5 py-3">
                  <p style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 600 }}>
                    💡 약속을 더 지키면 이자율이 올라가요!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 최근 내역 */}
        <div className="mb-3 flex items-center justify-between">
          <KidSectionTitle>최근 내역</KidSectionTitle>
          <Link href={`${base}/records`} prefetch={false} style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>
            전체 보기 <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          {childTx.length === 0 ? (
            <p className="px-5 py-10 text-center" style={{ fontSize: 16, color: "#9ca3af" }}>아직 거래 내역이 없어요.</p>
          ) : (
            <ul>
              {childTx.map((tx, i) => {
                const minus = tx.type === "spend" || tx.type === "borrow";
                return (
                  <li key={tx.id} className={`flex items-center gap-3 px-4 py-4 ${i < childTx.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
                    <TxIcon type={tx.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate" style={{ fontSize: 16, fontWeight: 700, color: "#1a0533" }}>{txLabel(tx.type, tx.memo)}</p>
                      <p className="mt-0.5" style={{ fontSize: 13, color: "#9ca3af" }}>{relativeDate(tx.date, today)}</p>
                    </div>
                    <p className="shrink-0 tabular-nums" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: minus ? "#1a0533" : "#15803d" }}>
                      {minus ? "-" : "+"}{formatWon(tx.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

function KidSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a0533", letterSpacing: "-0.02em" }}>{children}</h2>
  );
}

function FlowCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "violet" | "green" | "blue" | "orange" }) {
  const tones = {
    violet: { bg: "#ede9fe", icon: "#6d28d9", text: "#4c1d95" },
    green:  { bg: "#a7f3d0", icon: "#065f46", text: "#065f46" },
    blue:   { bg: "#bfdbfe", icon: "#1d4ed8", text: "#1e40af" },
    orange: { bg: "#fecdd3", icon: "#9f1239", text: "#9f1239" },
  };
  const t = tones[tone];
  return (
    <div className="min-w-0 rounded-[20px] p-4" style={{ background: t.bg }}>
      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/60 [&>svg]:h-5 [&>svg]:w-5" style={{ color: t.icon }}>{icon}</span>
      <p className="mt-3" style={{ fontSize: 12, fontWeight: 600, color: t.text + "99" }}>{label}</p>
      <p className="mt-1 tabular-nums" style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", color: t.text }}>{value}</p>
    </div>
  );
}

function TxIcon({ type }: { type: string }) {
  const positive = type === "allowance" || type === "reward" || type === "interest";
  const saved = type === "save";
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${positive ? "bg-[#e7f8ed] text-[#238b51]" : saved ? "bg-[#e9f2ff] text-[#2d67b2]" : "bg-[#fff0e9] text-[#d95d2d]"}`}>
      {saved ? <PiggyBank className="h-4 w-4" /> : positive ? <TrendingUp className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
    </span>
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
