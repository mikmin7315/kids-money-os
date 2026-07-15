import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { OpenDisputeForm, ResolveDisputeForm } from "@/components/admin/dispute-form";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const DISPUTE_STYLE: Record<string, string> = {
  none: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]",
  open: "bg-[var(--status-danger-solid)] text-[var(--status-danger-solid-text)]",
  reviewing: "bg-[var(--status-pending-solid)] text-[var(--status-pending-solid-text)]",
  resolved: "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]",
  rejected: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]",
};
const DISPUTE_LABEL: Record<string, string> = {
  none: "분쟁 없음", open: "분쟁 접수", reviewing: "검토 중", resolved: "처리 완료", rejected: "반려",
};

export default async function AdminCardTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  const { data: tx } = await admin
    .from("card_transactions")
    .select("*, child_cards(last4, parent_id), children(name)")
    .eq("id", id)
    .maybeSingle();

  if (!tx) notFound();

  const card = Array.isArray(tx.child_cards) ? tx.child_cards[0] : tx.child_cards;
  const child = Array.isArray(tx.children) ? tx.children[0] : tx.children;
  const disputeStatus = String(tx.dispute_status ?? "none");
  const hasOpenDispute = ["open", "reviewing"].includes(disputeStatus);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · A-21" title="카드 거래 상세" />

        <section className="mb-5 rounded-[16px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-base font-extrabold text-[var(--color-text)]">{tx.merchant_name || "가맹점 미상"}</p>
            <p className="tabular-nums text-base font-extrabold text-[var(--color-text)]">{formatWon(Number(tx.amount))}</p>
          </div>
          <dl className="space-y-2 text-sm">
            {[
              { label: "카테고리", value: tx.merchant_category },
              { label: "상태", value: tx.status },
              { label: "아이", value: String(child?.name ?? "-") },
              { label: "카드 번호", value: card?.last4 ? `**** ${card.last4}` : "-" },
              { label: "승인 시각", value: String(tx.approved_at ?? "").slice(0, 16).replace("T", " ") },
              { label: "원장 연결", value: tx.money_transaction_id ? "연결됨" : "미연결" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <dt className="text-[var(--color-muted)]">{label}</dt>
                <dd className="font-semibold text-[var(--color-text)]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-5 rounded-[16px] border border-[var(--color-border)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold text-[var(--color-text)]">분쟁 (A-22)</p>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${DISPUTE_STYLE[disputeStatus]}`}>
              {DISPUTE_LABEL[disputeStatus]}
            </span>
          </div>
          {tx.dispute_memo && <p className="mb-2 text-xs text-[var(--color-muted)]">사유: {tx.dispute_memo}</p>}
          {tx.dispute_opened_at && <p className="mb-2 text-[10px] text-[var(--color-muted)]">접수: {String(tx.dispute_opened_at).slice(0, 10)}</p>}
          {tx.dispute_resolved_at && <p className="mb-2 text-[10px] text-[var(--color-muted)]">처리: {String(tx.dispute_resolved_at).slice(0, 10)}</p>}

          {disputeStatus === "none" && <OpenDisputeForm txId={id} />}
          {hasOpenDispute && <ResolveDisputeForm txId={id} />}
        </section>

        {tx.raw_payload && (
          <section className="mb-5 rounded-[14px] border border-[var(--color-border)] p-4">
            <p className="mb-2 text-xs font-bold text-[var(--color-text)]">원본 페이로드</p>
            <pre className="overflow-x-auto text-[10px] text-[var(--color-muted)]">
              {JSON.stringify(tx.raw_payload, null, 2)}
            </pre>
          </section>
        )}

        <Link href="/admin/card-disputes" className="text-sm font-bold text-[var(--color-accent)]">← 분쟁 목록으로</Link>
      </MobileShell>
    </PageContainer>
  );
}
