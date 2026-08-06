import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatWon } from "@/lib/format";
import type { TransactionType } from "@/lib/types";

const BALANCE_PLUS: TransactionType[] = ["allowance", "reward", "interest", "unsave"];
const BALANCE_MINUS: TransactionType[] = ["spend", "borrow", "save", "repay"];

export const dynamic = "force-dynamic";

export default async function ChildBalancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle, dashboard] = await Promise.all([
    getChildModeContext(),
    getAppDataBundle(),
    getDashboardView(),
  ]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  const summary = dashboard.children.find((c) => c.child.id === id);
  if (!child || !summary) notFound();

  const policy = bundle.interestPolicies.find((p) => p.childId === id);
  const estimated = policy ? estimateInterest(summary.wallet, policy) : 0;
  const wallet = summary.wallet;
  // wallet.balance is already the spendable cash (save tx reduces it directly)
  const spendable = wallet.balance;
  const totalAssets = wallet.balance + wallet.savingsBalance;
  const activeBorrow = bundle.borrowRequests.find(
    (r) => r.childId === id && (r.status === "approved" || r.status === "partial"),
  );

  // 월별 잔액 추이 계산 (최근 6개월)
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(`${today}T00:00:00+09:00`);
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  const txsSorted = bundle.moneyTransactions
    .filter((t) => t.childId === id)
    .sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  let txIdx = 0;
  const monthBalances = months.map((month) => {
    while (txIdx < txsSorted.length && txsSorted[txIdx].date <= `${month}-99`) {
      const tx = txsSorted[txIdx];
      if (BALANCE_PLUS.includes(tx.type as TransactionType)) running += tx.amount;
      else if (BALANCE_MINUS.includes(tx.type as TransactionType)) running -= tx.amount;
      txIdx++;
    }
    return { month, balance: Math.max(0, running) };
  });

  return (
    <div data-theme="child-violet" style={{ background: "#F5F0FF", minHeight: "100dvh" }}>
    <div className="detail-shell">
      <Link href={`/child/${id}`} className="detail-back">
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      <p className="detail-eyebrow">{child.name}의 통장</p>
      <h1 className="detail-title">잔액 상세</h1>

      {/* 총 잔액 히어로 */}
      <div className="detail-hero">
        <p className="detail-kpi-label">총 보유 금액</p>
        <p className="detail-kpi">{formatWon(totalAssets)}</p>
        <p className="detail-kpi-sub">
          이대로면 이번 달 이자 <strong style={{ color: "#C4B5FD" }}>+{formatWon(estimated)}</strong>
        </p>
      </div>

      {/* 잔액 구성 */}
      <div className="detail-card">
        <div className="detail-card-head">
          <p className="detail-section-label">잔액 구성</p>
        </div>
        <hr className="detail-card-divider" />

        <BalanceRow
          emoji="💵"
          label="쓸 수 있는 돈"
          sub="지금 바로 쓸 수 있어요"
          value={formatWon(spendable)}
          valueColor="var(--monari-ink)"
        />
        <BalanceRow
          emoji="🐷"
          label="저금한 돈"
          sub="따로 모아두는 돈"
          value={formatWon(wallet.savingsBalance)}
          valueColor="var(--status-info-solid-text)"
        />
        {activeBorrow && (
          <BalanceRow
            emoji="🤝"
            label="갚아야 할 돈"
            sub="미리쓰기 남은 금액"
            value={`-${formatWon(wallet.borrowedBalance)}`}
            valueColor="var(--monari-primary-strong)"
          />
        )}
        <BalanceRow
          emoji="✨"
          label="예상 이자"
          sub={`이자율 ${wallet.currentInterestRate}% 적용`}
          value={`+${formatWon(estimated)}`}
          valueColor="var(--monari-done)"
          bold
          last
        />
      </div>

      {/* 잔액 추이 차트 */}
      <BalanceHistoryChart monthBalances={monthBalances} />

      {/* 설명 */}
      <div className="detail-info-box">
        <p className="detail-info-title">💡 남긴 돈이란?</p>
        <p className="detail-info-body">
          받은 용돈에서 쓴 돈을 빼고 남은 게 <q>남긴 돈</q>이에요.
          이 남긴 돈에 이자가 붙어요. 많이 남길수록 이자도 더 많이 생겨요!
        </p>
      </div>

      {/* 빠른 이동 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/child/${id}/records`}
          className="flex flex-col items-center gap-2.5 rounded-[24px] bg-white py-5 shadow-[var(--monari-shadow-md)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 32 }}>📒</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)" }}>거래 내역</p>
        </Link>
        <Link
          href={`/child/${id}/interest`}
          className="flex flex-col items-center gap-2.5 rounded-[24px] bg-white py-5 shadow-[var(--monari-shadow-md)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 32 }}>📈</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)" }}>이자 미리보기</p>
        </Link>
      </div>
    </div>
    </div>
  );
}

function BalanceHistoryChart({ monthBalances }: {
  monthBalances: { month: string; balance: number }[];
}) {
  const hasData = monthBalances.some((m) => m.balance > 0);
  if (!hasData) return null;

  const W = 300;
  const H = 100;
  const PAD = { top: 12, right: 8, bottom: 28, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxBalance = Math.max(...monthBalances.map((m) => m.balance), 1);
  const n = monthBalances.length;

  const points = monthBalances.map((m, i) => ({
    x: PAD.left + (i / Math.max(n - 1, 1)) * chartW,
    y: PAD.top + chartH - (m.balance / maxBalance) * chartH,
    balance: m.balance,
    label: m.month.slice(5) + "월",
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = [
    `M ${points[0].x},${PAD.top + chartH}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${PAD.top + chartH}`,
    "Z",
  ].join(" ");

  const lastPoint = points[points.length - 1];

  return (
    <div className="detail-card mb-4">
      <div className="detail-card-head">
        <p className="detail-section-label">잔액 추이</p>
        <p style={{ fontSize: 11, color: "var(--monari-ink-muted)", fontWeight: 600 }}>최근 6개월</p>
      </div>
      <hr className="detail-card-divider" />
      <div className="px-4 py-3">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }} aria-label="최근 6개월 잔액 추이">
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C3FE8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6C3FE8" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* 격자선 */}
          {[0.5, 1].map((t) => (
            <line
              key={t}
              x1={PAD.left} y1={PAD.top + chartH * (1 - t)}
              x2={W - PAD.right} y2={PAD.top + chartH * (1 - t)}
              stroke="#EDE9FE" strokeWidth="1"
            />
          ))}
          {/* 면적 */}
          <path d={areaPath} fill="url(#balanceGrad)" />
          {/* 라인 */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#6C3FE8"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* 데이터 포인트 */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#6C3FE8" strokeWidth="2" />
          ))}
          {/* 현재 잔액 강조 */}
          <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill="#6C3FE8" />
          {/* X축 라벨 */}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={H - 2} textAnchor="middle" style={{ fontSize: 9, fill: "#94A3B8", fontWeight: 600 }}>
              {p.label}
            </text>
          ))}
          {/* 최대값 라벨 */}
          <text x={PAD.left + 2} y={PAD.top + 9} style={{ fontSize: 9, fill: "#94A3B8", fontWeight: 600 }}>
            {formatWon(maxBalance)}
          </text>
        </svg>
        <p className="mt-1 text-center" style={{ fontSize: 11, color: "var(--monari-ink-muted)", fontWeight: 600 }}>
          현재 잔액 <strong style={{ color: "#6C3FE8" }}>{formatWon(monthBalances[monthBalances.length - 1].balance)}</strong>
        </p>
      </div>
    </div>
  );
}

function BalanceRow({
  emoji, label, sub, value, valueColor, bold, last,
}: {
  emoji: string; label: string; sub: string; value: string;
  valueColor: string; bold?: boolean; last?: boolean;
}) {
  return (
    <div className={`detail-row${last ? " border-b-0" : ""}`} style={bold ? { borderTop: "1px solid #f3f4f6" } : {}}>
      <span style={{ fontSize: 24, width: 36, textAlign: "center", flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="detail-row-label">{label}</p>
        <p className="detail-row-sub">{sub}</p>
      </div>
      <p className="detail-row-value" style={{ color: valueColor, fontWeight: bold ? 900 : 800 }}>{value}</p>
    </div>
  );
}
