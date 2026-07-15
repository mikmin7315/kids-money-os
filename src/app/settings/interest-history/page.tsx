import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InterestHistoryPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();

  const interestTxs = bundle.moneyTransactions
    .filter((t) => t.type === "interest")
    .sort((a, b) => b.date.localeCompare(a.date));

  const grouped = interestTxs.reduce<Record<string, typeof interestTxs>>((acc, tx) => {
    const key = `${tx.childId}__${tx.date.slice(0, 7)}`;
    (acc[key] ??= []).push(tx);
    return acc;
  }, {});

  const rows = Object.entries(grouped)
    .map(([key, txs]) => {
      const [childId, month] = key.split("__");
      const child = bundle.children.find((c) => c.id === childId);
      const total = txs.reduce((s, t) => s + t.amount, 0);
      const policy = bundle.interestPolicies.find((p) => p.childId === childId);
      return { child, month, total, txs, rate: policy?.baseInterestRate };
    })
    .sort((a, b) => b.month.localeCompare(a.month));

  const totalAllTime = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="detail-shell">
      <Link href="/settings" className="detail-back">
        <ArrowLeft size={16} /> 설정으로
      </Link>

      <p className="detail-eyebrow">이자 기록</p>
      <h1 className="detail-title">이자 지급 내역</h1>

      {/* 요약 히어로 */}
      {rows.length > 0 && (
        <div className="detail-hero">
          <p className="detail-kpi-label">누적 이자 총액</p>
          <p className="detail-kpi">+{formatWon(totalAllTime)}</p>
          <p className="detail-kpi-sub">{rows.length}회 지급 완료</p>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="detail-card" style={{ padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 52, marginBottom: 14 }}>📭</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--monari-ink)" }}>아직 이자 기록이 없어요</p>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--monari-ink-muted)", marginTop: 8 }}>
            매달 1일 정산 후 여기서 확인할 수 있어요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ child, month, total, txs: monthTxs, rate }) => (
            <div key={`${child?.id}-${month}`} className="detail-card" style={{ marginBottom: 0 }}>
              <div className="detail-row border-b-0">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>
                    {child?.name} · {month.replace("-", "년 ")}월
                  </p>
                  <p className="detail-row-value" style={{ fontSize: 24, color: "#059669" }}>
                    +{formatWon(total)}
                  </p>
                </div>
                {rate !== undefined && (
                  <span className="detail-tag" style={{ background: "#f0fdf4", color: "#059669" }}>
                    {formatPercent(rate)}
                  </span>
                )}
              </div>
              {monthTxs.length > 1 && monthTxs.map((tx) => (
                <div key={tx.id} className="detail-row" style={{ paddingTop: 12, paddingBottom: 12 }}>
                  <p className="detail-row-label" style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>
                    {tx.date.slice(5).replace("-", "월 ")}일
                  </p>
                  <p className="detail-row-value" style={{ fontSize: 15, color: "#059669" }}>
                    +{formatWon(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="detail-info-box" style={{ marginTop: 20 }}>
        <p className="detail-info-title">💡 이자 계산 방식</p>
        <p className="detail-info-body">
          매달 1일 — 지난 달 평균 잔액 × 확정 이자율 ÷ 12 로 계산돼요.
          행동 약속을 지킬수록 이자율이 높아져요.
        </p>
      </div>
    </div>
  );
}
