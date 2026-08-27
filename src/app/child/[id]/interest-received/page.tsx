import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InterestReceivedPage({ params }: { params: Promise<{ id: string }> }) {
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

  const interestTx = bundle.moneyTransactions
    .filter((t) => t.childId === id && t.type === "interest")
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalReceived = interestTx.reduce((s, t) => s + t.amount, 0);

  // 월별로 그루핑
  const byMonth = interestTx.reduce<Record<string, { month: string; items: typeof interestTx; total: number }>>((acc, tx) => {
    const m = tx.date.slice(0, 7);
    if (!acc[m]) acc[m] = { month: m, items: [], total: 0 };
    acc[m].items.push(tx);
    acc[m].total += tx.amount;
    return acc;
  }, {});
  const months = Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div data-theme="child-violet" style={{ background: "#E0F2FE", minHeight: "100dvh" }}>
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}/interest`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#0EA5E9]">
        <ArrowLeft size={16} /> 이자 미리보기로
      </Link>

      <div className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>{child.name}의 이자</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          🎁 받은 이자 내역
        </h1>
      </div>

      {/* 총계 히어로 */}
      <div
        className="mb-6 overflow-hidden rounded-[24px] p-5 text-white"
        style={{ background: "linear-gradient(145deg, #0C4B78 0%, #0369A1 45%, #0EA5E9 80%, #38BDF8 100%)" }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>지금까지 받은 이자</p>
        <p className="tabular-nums mt-1" style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" }}>
          +{formatWon(totalReceived)}
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
          총 {interestTx.length}번 이자를 받았어요 🎉
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] bg-white/15 px-3 py-2.5 text-center">
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>현재 이자율</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 2 }}>
              {summary.wallet.currentInterestRate}%
            </p>
          </div>
          <div className="rounded-[14px] bg-white/15 px-3 py-2.5 text-center">
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>지금 잔액</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 2 }}>
              {formatWon(summary.wallet.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* 월별 이자 내역 */}
      {months.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-[var(--monari-shadow-md)]">
          <p style={{ fontSize: 48, marginBottom: 12 }}>🌱</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--monari-ink)" }}>아직 받은 이자가 없어요</p>
          <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>
            매달 1일에 남긴 돈에 이자가 붙어요. 돈을 잘 모아봐요!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {months.map(({ month, items, total }) => {
            const [y, m] = month.split("-");
            return (
              <div key={month} className="overflow-hidden rounded-[24px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)]">
                <div className="flex items-center justify-between border-b border-[var(--monari-line)] px-5 py-3">
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)" }}>
                    {y}년 {m}월
                  </p>
                  <p className="tabular-nums" style={{ fontSize: 16, fontWeight: 900, color: "var(--monari-done)" }}>
                    +{formatWon(total)}
                  </p>
                </div>
                {items.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3 border-b border-[#f9fafb] last:border-0">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-soft)" }}>
                        {tx.date.slice(5).replace("-", "월 ")}일 이자
                      </p>
                      {tx.memo && (
                        <p style={{ fontSize: 11, color: "var(--monari-ink-muted)", marginTop: 2 }}>{tx.memo}</p>
                      )}
                    </div>
                    <p className="tabular-nums" style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-done)" }}>
                      +{formatWon(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </main>
    </div>
  );
}
