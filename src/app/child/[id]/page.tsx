import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BorrowRequestQuickForm, ChildBehaviorCheckForm, ChildSaveForm } from "@/components/finance/action-forms";
import { ChildBottomNav } from "@/components/child/child-bottom-nav";
import { getAuthContext, getChildModeContext } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatWon } from "@/lib/format";
import type { BehaviorLog } from "@/lib/types";

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
  const doneTodayRuleIds = todayLogs
    .filter((l) => l.status === "approved" || l.status === "completed")
    .map((l) => l.behaviorRuleId);
  const todayDone = doneTodayRuleIds.length;
  const todayTotal = activeRules.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const remaining = todayTotal - todayDone;

  // Interest policy & rate
  const policy = bundle.interestPolicies.find((p) => p.childId === id);
  const interestRate = summary.wallet.currentInterestRate;
  const todayInterest = policy ? Math.round(estimateInterest(summary.wallet, policy) / 30) : 0;

  // Streak: consecutive days with at least one approved behavior log
  const streak = computeStreak(childLogs, today);

  // Monthly numbers
  const { totalAllowance, totalSave, totalSpend, totalInterest } = summary.monthReport;

  // Recent transactions (top 4 spend/allowance/reward)
  const childTx = bundle.moneyTransactions
    .filter((t) => t.childId === id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #3b2fd4 0%, #4f3ff0 40%, #7c3aed 100%)" }}>
      {/* ── HERO ── */}
      <div className="px-4 pt-14 pb-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[26px] font-extrabold text-white leading-tight tracking-tight">
              안녕, {child.name}! 👋
            </h1>
            <p className="text-[13px] text-white/60 mt-0.5">
              🔥 {streak > 0 ? `${streak}일 연속으로 약속을 지키고 있어요` : "오늘도 약속을 지켜봐요!"}
            </p>
          </div>
          <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #ff6b35 0%, #ff4b12 100%)", boxShadow: "0 4px 12px rgba(255,107,53,0.40)" }}>
            <span className="text-[16px] font-extrabold text-white">{child.name[0]}</span>
          </div>
        </div>

        {/* Promise card */}
        <div className="rounded-[22px] bg-white/[0.10] border border-white/[0.15] p-4 mb-3 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold text-white/60">오늘의 약속</p>
            <Link href="#today-promises" className="text-[12px] font-bold text-white/80 hover:text-white">
              약속 보기 →
            </Link>
          </div>
          <p className="text-[38px] font-extrabold text-white leading-none mb-0.5 tracking-tight">
            {todayDone}
            <span className="text-[22px] font-bold text-white/40">/{todayTotal}</span>
          </p>
          <p className="text-[13px] text-white/60 mb-3">
            {remaining > 0 ? `아직 ${remaining}개 기회가 남았어요` : "오늘 약속을 모두 지켰어요! 🎉"}
          </p>
          <div className="h-2 rounded-full bg-white/[0.15] overflow-hidden mb-1.5">
            <div className="h-full rounded-full transition-all" style={{ width: `${todayProgress}%`, background: "linear-gradient(90deg, #ff6b35 0%, #ff9a00 100%)" }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/45">{todayProgress}% 완료</p>
            {todayInterest > 0 && (
              <p className="text-[11px] font-bold text-[#ffd166]">오늘 이자 +{formatWon(todayInterest)}</p>
            )}
          </div>
        </div>

        {/* Balance card */}
        <div className="rounded-[22px] bg-white/[0.10] border border-white/[0.15] p-4 mb-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-white/60 mb-1">내 남긴 돈 💰</p>
              <p className="text-[36px] font-extrabold text-white leading-none tracking-tight tabular-nums">
                {formatWon(summary.wallet.balance)}
              </p>
            </div>
            <div className="shrink-0 rounded-[16px] px-3.5 py-3 text-center min-w-[72px]" style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", boxShadow: "0 4px 12px rgba(34,197,94,0.35)" }}>
              <p className="text-[20px] font-extrabold text-white leading-none">{interestRate}%</p>
              <p className="text-[10px] text-white/80 mt-1 leading-tight">이번 주<br />이자율</p>
              <Link href="/records" className="mt-1.5 block text-[10px] font-semibold text-white/70 underline">
                정산 보기 →
              </Link>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <ActionBtn emoji="🐷" label="저금통" href="#save-form" />
          <ActionBtn emoji="✅" label="약속 체크" href="#today-promises" />
          <ActionBtn emoji="📊" label="미리쓰기" href="#borrow-form" orange />
        </div>
      </div>

      {/* ── BOTTOM SECTION ── */}
      <div className="rounded-t-[32px] bg-[#f5f4ff] px-4 pt-6 pb-40">
        {/* 이번 달 흐름 */}
        <section className="mb-5">
          <p className="text-[17px] font-extrabold text-[var(--monari-ink)] mb-3 tracking-tight">이번 달 흐름</p>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard emoji="💰" value={formatWon(totalAllowance)} label="받은 용돈" />
            <SummaryCard emoji="⭐" value={formatWon(totalInterest)} label="약속 이자" sub="약속 덕분에" yellowAccent />
            <SummaryCard emoji="🐷" value={formatWon(totalSave)} label="저금통" />
            <SummaryCard emoji="🛍️" value={formatWon(totalSpend)} label="사용한 돈" orangeAccent />
          </div>
        </section>

        {/* 최근 내역 */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[17px] font-extrabold text-[var(--monari-ink)] tracking-tight">최근 내역</p>
            <Link href="/records" className="text-[13px] font-semibold text-[var(--monari-ink-muted)]">전체 →</Link>
          </div>
          <div className="rounded-[20px] bg-white overflow-hidden" style={{ boxShadow: "var(--monari-shadow-card)" }}>
            {childTx.length === 0 ? (
              <p className="px-5 py-5 text-[14px] text-[rgba(43,43,43,0.45)] text-center">거래 내역이 없어요</p>
            ) : (
              <ul>
                {childTx.map((tx, i) => (
                  <li key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < childTx.length - 1 ? "border-b border-[rgba(43,43,43,0.06)]" : ""}`}>
                    <TxIcon type={tx.type} title={tx.memo} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1A1A2E] truncate">{txLabel(tx.type, tx.memo)}</p>
                      <p className="text-[12px] text-[rgba(43,43,43,0.50)]">{relativeDate(tx.date, today)}</p>
                    </div>
                    <p className={`text-[14px] font-bold tabular-nums shrink-0 ${
                      tx.type === "spend" || tx.type === "borrow" ? "text-[#1A1A2E]" : "text-[#10367D]"
                    }`}>
                      {tx.type === "spend" || tx.type === "borrow" ? "-" : "+"}{formatWon(tx.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 저금통 */}
        <section id="save-form" className="mb-4">
          <p className="text-[17px] font-extrabold text-[var(--monari-ink)] mb-3 tracking-tight">🐷 저금통</p>
          <div className="rounded-[20px] bg-white p-5" style={{ boxShadow: "var(--monari-shadow-card)" }}>
            <ChildSaveForm childId={id} />
          </div>
        </section>

        {/* 오늘 약속 체크 */}
        <section id="today-promises" className="mb-4">
          <p className="text-[17px] font-extrabold text-[var(--monari-ink)] mb-3 tracking-tight">✅ 오늘 약속 체크</p>
          <div className="rounded-[20px] bg-white p-5" style={{ boxShadow: "var(--monari-shadow-card)" }}>
            <ChildBehaviorCheckForm
              childId={id}
              behaviorRules={activeRules}
              doneRuleIds={doneTodayRuleIds}
            />
          </div>
        </section>

        {/* 미리쓰기 */}
        <section id="borrow-form" className="mb-4">
          <p className="text-[17px] font-extrabold text-[var(--monari-ink)] mb-3 tracking-tight">📊 미리쓰기 요청</p>
          <div className="rounded-[20px] bg-white p-5" style={{ boxShadow: "var(--monari-shadow-card)" }}>
            <BorrowRequestQuickForm childId={id} />
          </div>
        </section>
      </div>

      <ChildBottomNav childId={id} />
    </div>
  );
}

// ── Sub-components ──

function ActionBtn({ emoji, label, href, orange }: { emoji: string; label: string; href: string; orange?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-[20px] py-3.5 text-[12px] font-bold transition active:scale-[0.96] ${
        orange
          ? "text-white"
          : "bg-white/[0.12] border border-white/[0.18] text-white"
      }`}
      style={orange ? { background: "linear-gradient(135deg, #ff6b35 0%, #ff4b12 100%)", boxShadow: "0 4px 12px rgba(255,107,53,0.40)" } : undefined}
    >
      <span className="text-[22px]">{emoji}</span>
      {label}
    </Link>
  );
}

function SummaryCard({ emoji, value, label, sub, yellowAccent, orangeAccent }: {
  emoji: string;
  value: string;
  label: string;
  sub?: string;
  yellowAccent?: boolean;
  orangeAccent?: boolean;
}) {
  return (
    <div className="rounded-[20px] bg-white p-4" style={{ boxShadow: "var(--monari-shadow-card)" }}>
      <span className="text-[24px]">{emoji}</span>
      <p className={`text-[19px] font-extrabold mt-2 leading-tight tabular-nums tracking-tight ${
        yellowAccent ? "text-[#d97706]" : orangeAccent ? "text-[var(--monari-primary)]" : "text-[var(--monari-ink)]"
      }`}>
        {value}
      </p>
      <p className="text-[12px] text-[var(--monari-ink-muted)] mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-[var(--monari-ink-muted)] opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

function TxIcon({ type, title }: { type: string; title: string }) {
  const styles: Record<string, { bg: string; text: string; symbol: string }> = {
    allowance: { bg: "bg-[#ede9fe]", text: "text-[#4f3ff0]", symbol: "용" },
    reward:    { bg: "bg-[#dcfce7]", text: "text-[#16a34a]", symbol: "★" },
    spend:     { bg: "bg-[#fff1ee]", text: "text-[#ff6b35]", symbol: "사" },
    save:      { bg: "bg-[#ede9fe]", text: "text-[#4f3ff0]", symbol: "저" },
    interest:  { bg: "bg-[#dcfce7]", text: "text-[#16a34a]", symbol: "이" },
    borrow:    { bg: "bg-[#fff1ee]", text: "text-[#ff6b35]", symbol: "미" },
  };
  const s = styles[type] ?? { bg: "bg-[#F2F4F8]", text: "text-[#6B7280]", symbol: title?.[0] ?? "·" };
  return (
    <div className={`h-10 w-10 rounded-full ${s.bg} flex items-center justify-center shrink-0 text-[13px] font-bold ${s.text}`}>
      {s.symbol}
    </div>
  );
}

// ── Helpers ──

function txLabel(type: string, memo: string): string {
  const m: Record<string, string> = {
    allowance: "용돈", reward: "약속 보상", spend: memo || "사용",
    save: "저축하기", unsave: "저축 해제", borrow: "미리쓰기",
    repay: "상환", interest: "이자 지급",
  };
  return (m[type] ?? memo) || type;
}

function relativeDate(date: string, today: string): string {
  const diff = Math.round((new Date(today).getTime() - new Date(date).getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff <= 6) return `${diff}일 전`;
  return date.slice(5).replace("-", ".");
}

function computeStreak(logs: BehaviorLog[], today: string): number {
  const approvedDates = new Set(
    logs
      .filter((l) => l.status === "approved" || l.status === "completed")
      .map((l) => l.date)
  );
  let streak = 0;
  const d = new Date(today);
  while (approvedDates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
