import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PolicyRow = {
  child_id: string;
  child_name: string;
  base_interest_rate: number;
  current_rate: number;
  confirmed: boolean;
  confirmed_at: string | null;
};

async function loadPolicies(): Promise<{ rows: PolicyRow[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const [policyRes, snapRes] = await Promise.all([
      admin.from("interest_policies").select("child_id, base_interest_rate, confirmed, confirmed_at"),
      admin.from("wallet_snapshots").select("child_id, current_interest_rate"),
    ]);
    if (policyRes.error) throw policyRes.error;

    const childIds = [...new Set((policyRes.data ?? []).map((r) => r.child_id))];
    const { data: children } = await admin.from("children").select("id, name").in("id", childIds);
    const nameMap = (children ?? []).reduce<Record<string, string>>((acc, c) => { acc[c.id] = String(c.name); return acc; }, {});
    const snapMap = (snapRes.data ?? []).reduce<Record<string, number>>((acc, s) => {
      acc[s.child_id] = Number(s.current_interest_rate ?? 0);
      return acc;
    }, {});

    const rows: PolicyRow[] = (policyRes.data ?? []).map((p) => ({
      child_id: p.child_id,
      child_name: nameMap[p.child_id] ?? "알 수 없음",
      base_interest_rate: Number(p.base_interest_rate ?? 0),
      current_rate: snapMap[p.child_id] ?? Number(p.base_interest_rate ?? 0),
      confirmed: Boolean(p.confirmed),
      confirmed_at: p.confirmed_at ? String(p.confirmed_at).slice(0, 10) : null,
    }));
    return { rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function AdminInterestPoliciesPage() {
  await requireAdminSession();
  const { rows, error } = await loadPolicies();

  const avgBase = rows.length ? (rows.reduce((s, r) => s + r.base_interest_rate, 0) / rows.length).toFixed(1) : "0";
  const avgCurrent = rows.length ? (rows.reduce((s, r) => s + r.current_rate, 0) / rows.length).toFixed(1) : "0";

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 이자율" title="이자율 전체 조회" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { label: "아이 수", value: `${rows.length}명` },
            { label: "평균 기본 이자율", value: `${avgBase}%` },
            { label: "평균 현재 이자율", value: `${avgCurrent}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[12px] bg-white p-3 text-center shadow-[var(--monari-shadow-sm)]">
              <p className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</p>
              <p className="mt-1 text-sm font-black text-[var(--monari-hero)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden">
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">이자율 정책 없음</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--monari-surface-soft)] text-xs text-left font-semibold text-[var(--color-muted)]">
                  <th className="px-4 py-3">아이</th>
                  <th className="px-4 py-3 text-right">기본</th>
                  <th className="px-4 py-3 text-right">현재</th>
                  <th className="px-4 py-3 text-center">확정</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.child_id} className={i < rows.length - 1 ? "border-b border-[var(--color-border)]" : ""}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/children/${r.child_id}`} className="font-semibold text-[var(--color-text)] hover:text-[var(--color-accent)]">
                        {r.child_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{r.base_interest_rate}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`tabular-nums font-bold ${r.current_rate > r.base_interest_rate ? "text-[var(--monari-done)]" : r.current_rate < r.base_interest_rate ? "text-[var(--monari-minus)]" : "text-[var(--color-text)]"}`}>
                        {r.current_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.confirmed ? (
                        <span className="text-[11px] font-bold text-[var(--monari-done)]">✓ {r.confirmed_at}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-[var(--monari-primary-strong)]">미확정</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
