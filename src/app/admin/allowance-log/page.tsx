import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

type ExecRow = {
  id: string;
  child_name: string;
  rule_title: string;
  amount: number;
  status: string;
  scheduled_date: string;
  executed_at: string | null;
  failure_reason: string | null;
};

async function loadExecutions(): Promise<{ rows: ExecRow[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();

    const { data: execs, error: eErr } = await admin
      .from("allowance_executions")
      .select("id, allowance_rule_id, amount, status, scheduled_date, executed_at, failure_reason")
      .order("scheduled_date", { ascending: false })
      .limit(200);
    if (eErr) throw eErr;

    const ruleIds = [...new Set((execs ?? []).map((e) => e.allowance_rule_id))];
    const { data: rules } = await admin
      .from("allowance_rules")
      .select("id, title, child_id")
      .in("id", ruleIds);

    const childIds = [...new Set((rules ?? []).map((r) => r.child_id))];
    const { data: children } = await admin
      .from("children")
      .select("id, name")
      .in("id", childIds);

    const ruleMap = (rules ?? []).reduce<Record<string, { title: string; child_id: string }>>((acc, r) => {
      acc[r.id] = { title: String(r.title), child_id: r.child_id };
      return acc;
    }, {});
    const childMap = (children ?? []).reduce<Record<string, string>>((acc, c) => {
      acc[c.id] = String(c.name);
      return acc;
    }, {});

    const rows: ExecRow[] = (execs ?? []).map((e) => {
      const rule = ruleMap[e.allowance_rule_id];
      return {
        id: e.id,
        child_name: childMap[rule?.child_id ?? ""] ?? "알 수 없음",
        rule_title: rule?.title ?? "삭제된 규칙",
        amount: Number(e.amount),
        status: String(e.status),
        scheduled_date: String(e.scheduled_date ?? ""),
        executed_at: e.executed_at ? String(e.executed_at) : null,
        failure_reason: e.failure_reason ? String(e.failure_reason) : null,
      };
    });

    return { rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

const STATUS_STYLE: Record<string, string> = {
  success: "bg-[#d1fae5] text-[#065f46]",
  failed: "bg-[#fee2e2] text-[#991b1b]",
  pending: "bg-[#f3f4f6] text-[#6b7280]",
  skipped: "bg-[#fef3c7] text-[#92400e]",
};

export default async function AdminAllowanceLogPage() {
  await requireAdminSession();
  const { rows, error } = await loadExecutions();

  const failed = rows.filter((r) => r.status === "failed");
  const success = rows.filter((r) => r.status === "success");

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 운영" title="용돈 배치 로그" />

        {error && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* 요약 */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "전체", value: rows.length, color: "text-[var(--color-text)]" },
            { label: "성공", value: success.length, color: "text-[#059669]" },
            { label: "실패", value: failed.length, color: "text-[#dc2626]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-[12px] bg-[#f9fafb] p-3 text-center">
              <p className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</p>
              <p className={`mt-1 text-lg font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* 실패 항목 먼저 표시 */}
        {failed.length > 0 && (
          <section className="mb-6">
            <p className="mb-3 text-sm font-extrabold text-[#991b1b]">⚠️ 미지급 실패 내역</p>
            <div className="space-y-2">
              {failed.map((r) => (
                <div key={r.id} className="rounded-[14px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#991b1b]">
                        {r.child_name} · {r.rule_title}
                      </p>
                      <p className="text-xs text-[#b91c1c]">{r.scheduled_date}</p>
                    </div>
                    <p className="shrink-0 tabular-nums font-bold text-[#991b1b]">
                      {formatWon(r.amount)}
                    </p>
                  </div>
                  {r.failure_reason && (
                    <p className="mt-2 text-xs text-[#dc2626]">{r.failure_reason}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 전체 로그 */}
        <section>
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">전체 실행 이력</p>
          {rows.length === 0 ? (
            <div className="rounded-[16px] bg-[#f9fafb] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
              실행 이력이 없어요. 정기 용돈 배치가 실행되면 여기에 기록돼요.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[#f9fafb] text-left text-xs font-semibold text-[var(--color-muted)]">
                    <th className="px-4 py-3">아이 / 규칙</th>
                    <th className="px-4 py-3">예정일</th>
                    <th className="px-4 py-3 text-right">금액</th>
                    <th className="px-4 py-3 text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} className={`${i < rows.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--color-text)]">{r.child_name}</p>
                        <p className="text-[11px] text-[var(--color-muted)]">{r.rule_title}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted)]">{r.scheduled_date}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatWon(r.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[r.status] ?? STATUS_STYLE.pending}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
