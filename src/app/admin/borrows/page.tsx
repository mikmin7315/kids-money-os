import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기", approved: "승인", rejected: "거절", repaid: "완납", cancelled: "취소",
};
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[var(--status-pending-solid)] text-[var(--status-pending-solid-text)]",
  approved: "bg-[var(--status-info-solid)] text-[var(--status-info-solid-text)]",
  rejected: "bg-[var(--status-danger-solid)] text-[var(--monari-minus)]",
  repaid: "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]",
  cancelled: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]",
};

type BorrowRow = {
  id: string;
  child_name: string;
  amount: number;
  purpose: string;
  installments: number;
  status: string;
  created_at: string;
};

async function loadBorrows(status?: string): Promise<{ rows: BorrowRow[]; counts: Record<string, number>; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data: allData } = await admin.from("borrow_requests").select("status");
    const counts: Record<string, number> = {};
    (allData ?? []).forEach((r) => { counts[String(r.status)] = (counts[String(r.status)] ?? 0) + 1; });

    let q = admin.from("borrow_requests")
      .select("id, child_id, amount, purpose, installments, status, created_at")
      .order("created_at", { ascending: false }).limit(50);
    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) throw error;

    const childIds = [...new Set((data ?? []).map((r) => r.child_id))];
    const { data: children } = await admin.from("children").select("id, name").in("id", childIds);
    const nameMap = (children ?? []).reduce<Record<string, string>>((acc, c) => { acc[c.id] = String(c.name); return acc; }, {});

    const rows: BorrowRow[] = (data ?? []).map((r) => ({
      id: r.id,
      child_name: nameMap[r.child_id] ?? "알 수 없음",
      amount: Number(r.amount),
      purpose: String(r.purpose ?? ""),
      installments: Number(r.installments),
      status: String(r.status),
      created_at: String(r.created_at ?? ""),
    }));
    return { rows, counts };
  } catch (e) {
    return { rows: [], counts: {}, error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function AdminBorrowsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminSession();
  const { status } = await searchParams;
  const { rows, counts, error } = await loadBorrows(status);

  const statuses = ["pending", "approved", "repaid", "rejected", "cancelled"];

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 미리쓰기" title="미리쓰기 관리" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* 상태별 집계 */}
        <div className="mb-4 grid grid-cols-5 gap-2">
          {statuses.map((s) => (
            <Link
              key={s}
              href={status === s ? "/admin/borrows" : `/admin/borrows?status=${s}`}
              className={`rounded-[10px] p-2 text-center transition ${status === s ? "bg-[var(--color-accent)] text-white" : "bg-white shadow-[var(--monari-shadow-sm)]"}`}
            >
              <p className={`text-[10px] font-semibold ${status === s ? "text-white/80" : "text-[var(--color-muted)]"}`}>
                {STATUS_LABEL[s]}
              </p>
              <p className={`text-sm font-black ${status === s ? "text-white" : "text-[var(--color-text)]"}`}>
                {counts[s] ?? 0}
              </p>
            </Link>
          ))}
        </div>

        <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden">
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">해당하는 미리쓰기 없음</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {rows.map((r) => (
                <div key={r.id} className="flex items-start justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[r.status] ?? STATUS_STYLE.pending}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                      <span className="text-[11px] text-[var(--color-muted)]">{r.child_name}</span>
                    </div>
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{r.purpose || "-"}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">{r.installments}회 · {r.created_at.slice(0, 10)}</p>
                  </div>
                  <span className="ml-3 shrink-0 tabular-nums text-sm font-bold">{formatWon(r.amount)}</span>
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
