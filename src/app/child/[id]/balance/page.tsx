import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatWon } from "@/lib/format";

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

  return (
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
          이대로면 이번 달 이자 <strong style={{ color: "#86efac" }}>+{formatWon(estimated)}</strong>
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
          valueColor="#1a0533"
        />
        <BalanceRow
          emoji="🐷"
          label="저금한 돈"
          sub="따로 모아두는 돈"
          value={formatWon(wallet.savingsBalance)}
          valueColor="#1d4ed8"
        />
        {activeBorrow && (
          <BalanceRow
            emoji="🤝"
            label="갚아야 할 돈"
            sub="미리쓰기 남은 금액"
            value={`-${formatWon(wallet.borrowedBalance)}`}
            valueColor="#d97706"
          />
        )}
        <BalanceRow
          emoji="✨"
          label="예상 이자"
          sub={`이자율 ${wallet.currentInterestRate}% 적용`}
          value={`+${formatWon(estimated)}`}
          valueColor="#059669"
          bold
          last
        />
      </div>

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
          className="flex flex-col items-center gap-2.5 rounded-[20px] bg-white py-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 32 }}>📒</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a0533" }}>거래 내역</p>
        </Link>
        <Link
          href={`/child/${id}/interest`}
          className="flex flex-col items-center gap-2.5 rounded-[20px] bg-white py-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 32 }}>📈</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a0533" }}>이자 미리보기</p>
        </Link>
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
