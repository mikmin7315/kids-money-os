import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
    (r) => r.childId === id && (r.status === "approved" || r.status === "partial"),
  );
  const pendingBorrows = bundle.borrowRequests.filter(
    (r) => r.childId === id && r.status === "pending",
  );
  const totalActive = activeBorrows.length + pendingBorrows.length;

  return (
    <div data-theme="child-mint" style={{ background: "#F0FEFA", minHeight: "100dvh" }}>
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
        <ArrowLeft size={16} /> 홈으로
      </Link>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>🛒 미리쓰기</h1>
          <p className="mt-2" style={{ fontSize: 14, fontWeight: 600, color: "var(--monari-ink-muted)" }}>
            부모님이 허락하면 용돈 전에 미리 쓸 수 있어요
          </p>
        </div>
        {totalActive > 0 && (
          <Link
            href={`/child/${id}/borrow-status`}
            className="flex items-center gap-1 rounded-[12px] bg-[var(--status-rose-solid)] px-3 py-2 text-xs font-bold text-[var(--status-rose-solid-text)] transition active:scale-[0.97]"
          >
            현황 보기 <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* 진행 중 요약 배너 */}
      {totalActive > 0 && (
        <Link href={`/child/${id}/borrow-status`} className="mb-5 block">
          <div className="rounded-[24px] overflow-hidden shadow-[var(--monari-shadow-md)]">
            {pendingBorrows.length > 0 && (
              <div className="bg-[var(--status-pending-solid)] px-5 py-4">
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--status-pending-solid-text)" }}>⏳ 부모님 확인 기다리는 중</p>
                {pendingBorrows.map((r) => (
                  <p key={r.id} className="mt-1 tabular-nums" style={{ fontSize: 18, fontWeight: 800, color: "var(--monari-pending)" }}>
                    {formatWon(r.requestedAmount)} — {r.purpose}
                  </p>
                ))}
              </div>
            )}
            {activeBorrows.length > 0 && (
              <div className="bg-[var(--status-rose-solid)] px-5 py-4">
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--status-rose-solid-text)" }}>📋 갚는 중 ({activeBorrows.length}건)</p>
                {activeBorrows.map((r) => (
                  <p key={r.id} className="mt-1 tabular-nums" style={{ fontSize: 18, fontWeight: 800, color: "var(--status-rose-solid-text)" }}>
                    {formatWon(r.requestedAmount)} — {r.purpose}
                  </p>
                ))}
                <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--status-rose-solid-text)]">
                  자세한 현황 보기 <ArrowRight size={12} />
                </p>
              </div>
            )}
          </div>
        </Link>
      )}

      {/* 새 요청 폼 */}
      <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>새 미리쓰기 요청</p>
      <div className="rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-lift)]">
        <BorrowRequestQuickForm childId={id} />
      </div>

      {/* 안내 */}
      <div className="mt-5 rounded-[24px] bg-[var(--monari-hero-lo)] p-4">
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-hero)", marginBottom: 6 }}>💡 미리쓰기란?</p>
        <p style={{ fontSize: 13, color: "var(--monari-hero)", lineHeight: 1.7 }}>
          아직 받지 않은 용돈을 먼저 쓰고 나중에 갚는 거예요.
          부모님이 승인하면 잔액에 추가되고, 다음 용돈에서 조금씩 갚게 돼요.
        </p>
      </div>
    </main>
    </div>
  );
}
