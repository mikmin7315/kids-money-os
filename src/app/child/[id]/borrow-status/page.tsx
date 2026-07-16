import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";
import { CancelBorrowButton } from "@/components/child/cancel-borrow-button";

export const dynamic = "force-dynamic";

export default async function BorrowStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([
    getChildModeContext(),
    getAppDataBundle(),
  ]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  const activeBorrows = bundle.borrowRequests.filter(
    (r) => r.childId === id && (r.status === "approved" || r.status === "partial"),
  );
  const pendingBorrows = bundle.borrowRequests.filter(
    (r) => r.childId === id && r.status === "pending",
  );
  const repaidBorrows = bundle.borrowRequests.filter(
    (r) => r.childId === id && r.status === "repaid",
  ).slice(-3);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div data-theme="child-mint" style={{ background: "#F0FEFA", minHeight: "100dvh" }}>
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}/borrow`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
        <ArrowLeft size={16} /> 미리쓰기로
      </Link>

      <div className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>{child.name}의 미리쓰기</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          🛒 미리쓰기 현황
        </h1>
      </div>

      {/* 진행 중인 미리쓰기 */}
      {activeBorrows.length === 0 && pendingBorrows.length === 0 ? (
        <div className="mb-5 rounded-[24px] bg-white p-8 text-center shadow-[var(--monari-shadow-md)]">
          <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--monari-ink)" }}>갚아야 할 돈이 없어요!</p>
          <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>미리쓰기를 모두 갚았어요. 잘 했어요!</p>
          <Link
            href={`/child/${id}/borrow`}
            className="mt-5 block rounded-[14px] bg-[var(--monari-hero)] py-3 text-sm font-extrabold text-white transition active:scale-[0.97]"
          >
            새로 미리쓰기 요청하기
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mb-5">
          {pendingBorrows.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-[24px] bg-[var(--status-pending-solid)] shadow-[var(--monari-shadow-md)]">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-block rounded-full bg-[var(--monari-primary-strong)] px-2.5 py-1 text-xs font-bold text-white mb-2">
                      ⏳ 부모님 확인 중
                    </span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--status-pending-solid-text)" }} className="tabular-nums">
                      {formatWon(r.requestedAmount)}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--monari-pending)", fontWeight: 600 }}>목적: {r.purpose}</p>
                <p style={{ fontSize: 12, color: "var(--monari-primary-strong)", marginTop: 4 }}>
                  요청일 {r.createdAt.slice(0, 10).replace(/-/g, ".")}
                </p>
                <CancelBorrowButton borrowRequestId={r.id} />
              </div>
            </div>
          ))}

          {activeBorrows.map((r) => {
            const repayments = bundle.borrowRepayments?.filter(
              (p) => p.borrowRequestId === r.id,
            ) ?? [];
            const totalPaid = repayments.reduce((s, p) => s + p.paidAmount, 0);
            const remaining = r.requestedAmount - totalPaid;
            const paidRatio = Math.min(100, Math.round((totalPaid / r.requestedAmount) * 100));
            const nextDue = repayments.find(
              (p) => p.status === "scheduled" || p.status === "partial",
            );
            const dDayMs = nextDue
              ? new Date(nextDue.dueDate).getTime() - new Date(today).getTime()
              : null;
            const dDay = dDayMs !== null ? Math.ceil(dDayMs / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={r.id} className="overflow-hidden rounded-[24px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-lift)]">
                {/* 헤더 */}
                <div
                  className="px-5 pt-5 pb-4"
                  style={{ background: "linear-gradient(135deg,#fecdd3 0%,#fde68a 100%)" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <span className="inline-block rounded-full bg-[var(--monari-minus)] px-2.5 py-1 text-xs font-bold text-white mb-2">
                        📋 갚는 중
                      </span>
                      <p style={{ fontSize: 26, fontWeight: 900, color: "var(--status-danger-solid-text)" }} className="tabular-nums">
                        남은 돈 {formatWon(remaining)}
                      </p>
                    </div>
                    {dDay !== null && (
                      <div className="text-center rounded-[14px] bg-white/70 px-3 py-2">
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--status-rose-solid-text)" }}>다음 상환</p>
                        <p style={{ fontSize: 22, fontWeight: 900, color: dDay <= 3 ? "var(--monari-minus)" : "var(--monari-ink)" }}>
                          {dDay === 0 ? "오늘" : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
                        </p>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--status-pending-solid-text)", fontWeight: 600 }}>목적: {r.purpose}</p>
                </div>

                {/* 진행률 */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)" }}>상환 진행률</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--monari-hero)" }}>{paidRatio}%</p>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--monari-surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ background: "linear-gradient(145deg, #065F46 0%, #059669 45%, #10B981 80%, #34D399 100%)", width: `${paidRatio}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between">
                    <p style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>갚은 돈 {formatWon(totalPaid)}</p>
                    <p style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>총 {formatWon(r.requestedAmount)}</p>
                  </div>
                </div>

                {/* 상환 내역 */}
                {repayments.length > 0 && (
                  <div className="border-t border-[var(--monari-line)]">
                    {repayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-[#f9fafb] last:border-0">
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-soft)" }}>
                            {p.dueDate.slice(5).replace("-", "월 ")}일
                          </p>
                          <p style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>
                            {p.status === "paid" ? "완납" : p.status === "partial" ? "일부 납부" : p.status === "overdue" ? "연체" : "예정"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p style={{ fontSize: 14, fontWeight: 800, color: p.status === "paid" ? "var(--monari-done)" : p.status === "overdue" ? "var(--monari-minus)" : "var(--monari-ink)" }} className="tabular-nums">
                            {formatWon(p.amount)}
                          </p>
                          {p.paidAmount > 0 && p.paidAmount < p.amount && (
                            <p style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>납부 {formatWon(p.paidAmount)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 완료된 미리쓰기 이력 */}
      {repaidBorrows.length > 0 && (
        <>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>
            다 갚은 미리쓰기 🎉
          </p>
          <div className="space-y-2">
            {repaidBorrows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-[16px] bg-white px-4 py-3.5 shadow-[var(--monari-shadow-card)]">
                <span style={{ fontSize: 24 }}>✅</span>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)" }}>{r.purpose}</p>
                  <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", marginTop: 2 }}>
                    {r.createdAt.slice(0, 7).replace("-", "년 ")}월
                  </p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink-muted)" }} className="tabular-nums">
                  {formatWon(r.requestedAmount)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
    </div>
  );
}
