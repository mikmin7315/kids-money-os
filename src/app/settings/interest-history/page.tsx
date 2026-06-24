import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InterestHistoryPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();

  // 이자 거래 내역 전체 (월별 정렬)
  const interestTxs = bundle.moneyTransactions
    .filter((t) => t.type === "interest")
    .sort((a, b) => b.date.localeCompare(a.date));

  // 아이별·월별 그룹핑
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

  return (
    <div className="mx-auto min-h-screen max-w-[460px] bg-[#faf5ff]" style={{ boxShadow: "0 0 70px rgba(76,29,149,0.16)" }}>
      <div className="px-4 pb-16 pt-12">
        <Link href="/settings" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#7c3aed]">
          <ArrowLeft size={16} /> 설정으로
        </Link>

        <div className="mb-6">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>이자 기록</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.03em" }}>
            📊 이자 지급 내역
          </h1>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[20px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p style={{ fontSize: 48, marginBottom: 12 }}>📭</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#1a0533" }}>아직 이자 기록이 없어요</p>
            <p className="mt-2" style={{ fontSize: 14, color: "#9ca3af" }}>매달 1일 정산 후 여기서 확인할 수 있어요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(({ child, month, total, txs: monthTxs, rate }) => (
              <div key={`${child?.id}-${month}`} className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>
                      {child?.name} · {month.replace("-", "년 ")}월
                    </p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: "#059669", marginTop: 4 }} className="tabular-nums">
                      +{formatWon(total)}
                    </p>
                  </div>
                  {rate !== undefined && (
                    <span className="rounded-[12px] bg-[#f0fdf4] px-3 py-1.5 text-sm font-bold text-[#059669]">
                      {formatPercent(rate)}
                    </span>
                  )}
                </div>
                {monthTxs.length > 1 && (
                  <div className="border-t border-[#f3f4f6] divide-y divide-[#f9fafb]">
                    {monthTxs.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between px-5 py-2.5">
                        <p style={{ fontSize: 12, color: "#9ca3af" }}>{tx.date.slice(5).replace("-", "월 ")}일</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>+{formatWon(tx.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-[20px] bg-[#f5f3ff] p-4">
          <p style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6", marginBottom: 6 }}>💡 이자 계산 방식</p>
          <p style={{ fontSize: 13, color: "#7c3aed", lineHeight: 1.7 }}>
            매달 1일 — 지난 달 평균 잔액 × 확정 이자율 ÷ 12 로 계산돼요.
            행동 약속을 지킬수록 이자율이 높아져요.
          </p>
        </div>
      </div>
    </div>
  );
}
