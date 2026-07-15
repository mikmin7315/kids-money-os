import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const TX_LABEL: Record<string, string> = {
  allowance: "용돈", bonus: "보너스", interest: "이자", penalty: "차감",
  borrow: "미리쓰기", borrow_repay: "미리쓰기 상환", cash_in: "현금 입금",
  cash_out: "현금 출금", save_in: "저금", save_out: "저금 인출", spend: "지출",
};

const TX_TYPES = Object.keys(TX_LABEL);

type TxRow = {
  id: string;
  child_name: string;
  type: string;
  amount: number;
  memo: string;
  created_at: string;
};

async function loadTransactions(type?: string): Promise<{ rows: TxRow[]; total: number; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    let q = admin
      .from("transactions")
      .select("id, child_id, type, amount, memo, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50);
    if (type) q = q.eq("type", type);

    const { data, count, error } = await q;
    if (error) throw error;

    const childIds = [...new Set((data ?? []).map((r) => r.child_id))];
    const { data: children } = await admin.from("children").select("id, name").in("id", childIds);
    const nameMap = (children ?? []).reduce<Record<string, string>>((acc, c) => { acc[c.id] = String(c.name); return acc; }, {});

    const rows: TxRow[] = (data ?? []).map((r) => ({
      id: r.id,
      child_name: nameMap[r.child_id] ?? "알 수 없음",
      type: String(r.type),
      amount: Number(r.amount),
      memo: String(r.memo ?? ""),
      created_at: String(r.created_at ?? ""),
    }));
    return { rows, total: count ?? 0 };
  } catch (e) {
    return { rows: [], total: 0, error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdminSession();
  const { type } = await searchParams;
  const { rows, total, error } = await loadTransactions(type);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 거래" title="전체 거래내역" />

        {error && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted)]">총 {total.toLocaleString()}건 · 최근 50건 표시</p>
        </div>

        {/* 유형 필터 */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/admin/transactions"
            className={`rounded-full px-3 py-1 text-xs font-bold ${!type ? "bg-[var(--color-accent)] text-white" : "bg-[var(--monari-surface-soft)] text-[var(--color-muted)]"}`}
          >
            전체
          </Link>
          {TX_TYPES.map((t) => (
            <Link
              key={t}
              href={`/admin/transactions?type=${t}`}
              className={`rounded-full px-3 py-1 text-xs font-bold ${type === t ? "bg-[var(--color-accent)] text-white" : "bg-[var(--monari-surface-soft)] text-[var(--color-muted)]"}`}
            >
              {TX_LABEL[t]}
            </Link>
          ))}
        </div>

        <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">거래 내역이 없어요.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {rows.map((r) => (
                <div key={r.id} className="flex items-start justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[var(--monari-surface-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)]">
                        {TX_LABEL[r.type] ?? r.type}
                      </span>
                      <span className="text-[11px] text-[var(--color-muted)]">{r.child_name}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-[var(--color-text)]">{r.memo || "-"}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">{r.created_at.slice(0, 16).replace("T", " ")}</p>
                  </div>
                  <span className="ml-3 shrink-0 tabular-nums text-sm font-bold text-[var(--color-text)]">
                    {formatWon(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
