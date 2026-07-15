import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

type DisputeRow = {
  id: string;
  merchant_name: string;
  amount: number;
  dispute_status: string;
  dispute_memo: string | null;
  dispute_opened_at: string | null;
  dispute_resolved_at: string | null;
  child_name: string;
};

const DISPUTE_STYLE: Record<string, string> = {
  open: "bg-[#fee2e2] text-[#991b1b]",
  reviewing: "bg-[#fef3c7] text-[#92400e]",
  resolved: "bg-[#d1fae5] text-[#065f46]",
  rejected: "bg-[#f3f4f6] text-[#6b7280]",
};
const DISPUTE_LABEL: Record<string, string> = {
  open: "분쟁 접수", reviewing: "검토 중", resolved: "처리 완료", rejected: "반려",
};

async function loadDisputes(): Promise<{ rows: DisputeRow[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("card_transactions")
      .select("id, merchant_name, amount, dispute_status, dispute_memo, dispute_opened_at, dispute_resolved_at, children(name)")
      .not("dispute_status", "in", '("none")')
      .order("dispute_opened_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const rows: DisputeRow[] = (data ?? []).map((r) => {
      const child = Array.isArray(r.children) ? r.children[0] : r.children;
      return {
        id: r.id,
        merchant_name: String(r.merchant_name || "미상"),
        amount: Number(r.amount),
        dispute_status: String(r.dispute_status ?? "open"),
        dispute_memo: r.dispute_memo ? String(r.dispute_memo) : null,
        dispute_opened_at: r.dispute_opened_at ? String(r.dispute_opened_at) : null,
        dispute_resolved_at: r.dispute_resolved_at ? String(r.dispute_resolved_at) : null,
        child_name: String(child?.name ?? "-"),
      };
    });
    return { rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function AdminCardDisputesPage() {
  await requireAdminSession();
  const { rows, error } = await loadDisputes();
  const open = rows.filter((r) => ["open", "reviewing"].includes(r.dispute_status));

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · A-22" title="카드 분쟁 티켓" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-[12px] bg-[#f9fafb] p-3 text-center">
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">처리 필요</p>
            <p className={`mt-1 text-lg font-black ${open.length > 0 ? "text-[#dc2626]" : "text-[#059669]"}`}>{open.length}</p>
          </div>
          <div className="rounded-[12px] bg-[#f9fafb] p-3 text-center">
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">전체</p>
            <p className="mt-1 text-lg font-black text-[var(--color-text)]">{rows.length}</p>
          </div>
        </div>

        <section className="space-y-2">
          {rows.map((row) => (
            <Link key={row.id} href={`/admin/card-transactions/${row.id}`}
              className="block rounded-[14px] border border-[var(--color-border)] p-4 transition active:scale-[0.98]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text)]">{row.merchant_name}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{row.child_name} · {row.dispute_opened_at?.slice(0, 10) ?? "-"}</p>
                  {row.dispute_memo && <p className="mt-1 text-[11px] text-[var(--color-muted)]">{row.dispute_memo}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="tabular-nums text-sm font-bold text-[var(--color-text)]">{formatWon(row.amount)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DISPUTE_STYLE[row.dispute_status] ?? ""}`}>
                    {DISPUTE_LABEL[row.dispute_status] ?? row.dispute_status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {rows.length === 0 && !error && (
            <div className="rounded-[16px] bg-[#f9fafb] px-5 py-10 text-center">
              <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
              <p className="text-sm font-semibold text-[var(--color-muted)]">접수된 분쟁 티켓이 없어요.</p>
            </div>
          )}
        </section>
      </MobileShell>
    </PageContainer>
  );
}
