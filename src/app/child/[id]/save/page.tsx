import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
  const currentInterestRate = summary.wallet.currentInterestRate;
  const savingsBalance = summary.wallet.savingsBalance;

  return (
    <div style={{ background: "#F5F0FF", minHeight: "100dvh" }}>
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#6C3FE8]">
        <ArrowLeft size={16} /> 홈으로
      </Link>
      <div className="mb-6">
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1C1033", letterSpacing: "-0.03em" }}>🐷 저금하기</h1>
        <p className="mt-2" style={{ fontSize: 15, fontWeight: 600, color: "#6B7280" }}>
          지금 쓸 수 있는 돈 <span style={{ color: "#6C3FE8", fontWeight: 800 }}>{formatWon(summary.wallet.balance)}</span>
        </p>
      </div>

      {totalSaved > 0 && (
        <div className="mb-4 rounded-[24px] bg-[#DDD6FE] p-4">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#6C3FE899" }}>이번 달 저금 총액</p>
          <p className="mt-1 tabular-nums" style={{ fontSize: 24, fontWeight: 900, color: "var(--status-info-solid-text)", letterSpacing: "-0.03em" }}>
            {formatWon(totalSaved)}
          </p>
        </div>
      )}

      <div className="rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-lift)]">
        <ChildSaveForm
          childId={id}
          availableBalance={summary.wallet.balance}
          currentInterestRate={currentInterestRate}
          savingsBalance={savingsBalance}
        />
      </div>
    </main>
    </div>
  );
}
