import { notFound, redirect } from "next/navigation";
import { ChildSaveForm } from "@/components/finance/action-forms";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ChildSavePage({ params }: { params: Promise<{ id: string }> }) {
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

  const totalSaved = summary.monthReport.totalSave;

  return (
    <main className="px-4 pb-36 pt-8">
      <div className="mb-6">
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>🐷 저금하기</h1>
        <p className="mt-2" style={{ fontSize: 15, fontWeight: 600, color: "var(--monari-ink-muted)" }}>
          지금 쓸 수 있는 돈 <span style={{ color: "var(--monari-hero)", fontWeight: 800 }}>{formatWon(summary.wallet.balance)}</span>
        </p>
      </div>

      {totalSaved > 0 && (
        <div className="mb-4 rounded-[24px] bg-[#bfdbfe] p-4">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1e40af99" }}>이번 달 저금 총액</p>
          <p className="mt-1 tabular-nums" style={{ fontSize: 24, fontWeight: 900, color: "#1e40af", letterSpacing: "-0.03em" }}>
            {formatWon(totalSaved)}
          </p>
        </div>
      )}

      <div className="rounded-[24px] bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <ChildSaveForm childId={id} availableBalance={summary.wallet.balance} />
      </div>
    </main>
  );
}
