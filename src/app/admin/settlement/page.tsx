import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

type RunRow = {
  id: string;
  year: number;
  month: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  success_count: number;
  failure_count: number;
};

type ChildRunRow = {
  id: string;
  child_name: string;
  status: string;
  interest_amount: number | null;
  rate_adjustment: number | null;
  failure_reason: string | null;
  processed_at: string | null;
};

async function loadSettlement(runId?: string): Promise<{
  runs: RunRow[];
  childRuns: ChildRunRow[];
  selectedRun: RunRow | null;
  error?: string;
}> {
  try {
    const admin = getSupabaseAdminClient();

    const { data: runs, error: rErr } = await admin
      .from("settlement_runs")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(24);
    if (rErr) throw rErr;

    const typedRuns: RunRow[] = (runs ?? []).map((r) => ({
      id: r.id,
      year: Number(r.year),
      month: Number(r.month),
      status: String(r.status),
      started_at: String(r.started_at ?? ""),
      completed_at: r.completed_at ? String(r.completed_at) : null,
      success_count: Number(r.success_count),
      failure_count: Number(r.failure_count),
    }));

    const targetRun = runId
      ? (typedRuns.find((r) => r.id === runId) ?? null)
      : (typedRuns[0] ?? null);

    let childRuns: ChildRunRow[] = [];
    if (targetRun) {
      const { data: cr } = await admin
        .from("settlement_child_runs")
        .select("id, child_id, status, interest_amount, rate_adjustment, failure_reason, processed_at")
        .eq("run_id", targetRun.id)
        .order("status");

      const childIds = (cr ?? []).map((r) => r.child_id);
      const { data: childProfiles } = await admin
        .from("children")
        .select("id, name")
        .in("id", childIds);
      const nameMap = (childProfiles ?? []).reduce<Record<string, string>>((acc, c) => {
        acc[c.id] = String(c.name);
        return acc;
      }, {});

      childRuns = (cr ?? []).map((r) => ({
        id: r.id,
        child_name: nameMap[r.child_id] ?? "알 수 없음",
        status: String(r.status),
        interest_amount: r.interest_amount !== null ? Number(r.interest_amount) : null,
        rate_adjustment: r.rate_adjustment !== null ? Number(r.rate_adjustment) : null,
        failure_reason: r.failure_reason ? String(r.failure_reason) : null,
        processed_at: r.processed_at ? String(r.processed_at) : null,
      }));
    }

    return { runs: typedRuns, childRuns, selectedRun: targetRun };
  } catch (e) {
    return { runs: [], childRuns: [], selectedRun: null, error: e instanceof Error ? e.message : "로드 실패" };
  }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  success: { label: "성공", color: "bg-[#d1fae5] text-[#065f46]" },
  partial: { label: "일부 실패", color: "bg-[#fef3c7] text-[#92400e]" },
  failed: { label: "실패", color: "bg-[#fee2e2] text-[#991b1b]" },
  running: { label: "실행 중", color: "bg-[#dbeafe] text-[#1d4ed8]" },
  pending: { label: "대기", color: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]" },
  skipped: { label: "건너뜀", color: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]" },
};

export default async function AdminSettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  await requireAdminSession();
  const { run: runId } = await searchParams;
  const { runs, childRuns, selectedRun, error } = await loadSettlement(runId);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 이자" title="정산 결과" />

        {error && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* 정산 Run 목록 */}
        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">정산 이력</p>
          {runs.length === 0 ? (
            <div className="rounded-[16px] bg-[var(--monari-surface-soft)] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
              정산 이력이 없어요. Edge Function이 실행되면 여기에 표시돼요.
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map((r) => {
                const st = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending;
                const isSelected = selectedRun?.id === r.id;
                return (
                  <Link
                    key={r.id}
                    href={`/admin/settlement?run=${r.id}`}
                    className={`flex items-center justify-between rounded-[14px] border px-4 py-3 transition ${isSelected ? "border-[var(--color-accent)] bg-[var(--monari-hero-lo)]" : "border-[var(--color-border)] bg-white"}`}
                  >
                    <div>
                      <p className="font-bold text-[var(--color-text)]">
                        {r.year}년 {r.month}월
                      </p>
                      <p className="text-[11px] text-[var(--color-muted)]">
                        성공 {r.success_count}명 · 실패 {r.failure_count}명
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st.color}`}>
                      {st.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 선택된 Run 상세 */}
        {selectedRun && (
          <section>
            <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">
              {selectedRun.year}년 {selectedRun.month}월 — 아이별 결과
            </p>
            {childRuns.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">아이 결과가 없어요.</p>
            ) : (
              <div className="space-y-2">
                {childRuns.map((cr) => {
                  const st = STATUS_LABELS[cr.status] ?? STATUS_LABELS.pending;
                  return (
                    <div key={cr.id} className="rounded-[14px] border border-[var(--color-border)] bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--color-text)]">{cr.child_name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      {cr.interest_amount !== null && (
                        <p className="mt-1 text-sm text-[#059669] font-semibold">
                          이자 +{formatWon(cr.interest_amount)}
                          {cr.rate_adjustment !== null && cr.rate_adjustment !== 0 && (
                            <span className="ml-2 text-[var(--color-muted)]">
                              ({cr.rate_adjustment > 0 ? "+" : ""}{cr.rate_adjustment}%p)
                            </span>
                          )}
                        </p>
                      )}
                      {cr.failure_reason && (
                        <p className="mt-1 text-xs text-[#dc2626]">{cr.failure_reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="mt-6">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
