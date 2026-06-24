import { notFound, redirect } from "next/navigation";
import { BorrowRequestQuickForm } from "@/components/finance/action-forms";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ChildBorrowPage({ params }: { params: Promise<{ id: string }> }) {
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

  const activeBorrows = bundle.borrowRequests.filter(
    (r) => r.childId === id && (r.status === "approved" || r.status === "partial")
  );
  const pendingBorrows = bundle.borrowRequests.filter(
    (r) => r.childId === id && r.status === "pending"
  );

  return (
    <main className="px-4 pb-36 pt-8">
      <div className="mb-6">
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.03em" }}>🛒 미리쓰기</h1>
        <p className="mt-2" style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af" }}>
          부모님이 허락하면 용돈 전에 미리 쓸 수 있어요
        </p>
      </div>

      {/* 대기 중인 요청 */}
      {pendingBorrows.length > 0 && (
        <div className="mb-4 rounded-[20px] bg-[#fef3c7] p-4">
          <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>⏳ 부모님 확인 기다리는 중 ({pendingBorrows.length}건)</p>
          {pendingBorrows.map((r) => (
            <p key={r.id} className="mt-1 tabular-nums" style={{ fontSize: 18, fontWeight: 800, color: "#b45309" }}>
              {formatWon(r.requestedAmount)} — {r.purpose}
            </p>
          ))}
        </div>
      )}

      {/* 상환 중인 건 */}
      {activeBorrows.length > 0 && (
        <div className="mb-4 rounded-[20px] bg-[#fecdd3] p-4">
          <p style={{ fontSize: 13, fontWeight: 700, color: "#9f1239" }}>📋 갚는 중 ({activeBorrows.length}건)</p>
          {activeBorrows.map((r) => (
            <p key={r.id} className="mt-1 tabular-nums" style={{ fontSize: 18, fontWeight: 800, color: "#be123c" }}>
              {formatWon(r.requestedAmount)} — {r.purpose}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-[24px] bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <BorrowRequestQuickForm childId={id} />
      </div>
    </main>
  );
}
