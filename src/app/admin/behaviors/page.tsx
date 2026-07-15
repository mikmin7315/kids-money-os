import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BehaviorRow = {
  id: string;
  child_name: string;
  rule_name: string;
  achieved: boolean;
  logged_at: string;
  approved: boolean | null;
};

type RuleStat = { name: string; total: number; achieved: number; rate: number };

async function loadBehaviors(): Promise<{ rows: BehaviorRow[]; stats: RuleStat[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const [logsRes, statsRes] = await Promise.all([
      admin.from("behavior_logs")
        .select("id, child_id, achieved, approved, logged_at, behavior_rules(name)")
        .order("logged_at", { ascending: false }).limit(60),
      admin.from("behavior_logs")
        .select("achieved, behavior_rules(name)"),
    ]);

    if (logsRes.error) throw logsRes.error;

    const childIds = [...new Set((logsRes.data ?? []).map((r) => r.child_id))];
    const { data: children } = await admin.from("children").select("id, name").in("id", childIds);
    const nameMap = (children ?? []).reduce<Record<string, string>>((acc, c) => { acc[c.id] = String(c.name); return acc; }, {});

    const rows: BehaviorRow[] = (logsRes.data ?? []).map((r) => {
      const rule = Array.isArray(r.behavior_rules) ? r.behavior_rules[0] : r.behavior_rules;
      return {
        id: r.id,
        child_name: nameMap[r.child_id] ?? "알 수 없음",
        rule_name: rule?.name ?? "-",
        achieved: Boolean(r.achieved),
        logged_at: String(r.logged_at ?? ""),
        approved: r.approved as boolean | null,
      };
    });

    const statMap: Record<string, { total: number; achieved: number }> = {};
    for (const r of statsRes.data ?? []) {
      const rule = Array.isArray(r.behavior_rules) ? r.behavior_rules[0] : r.behavior_rules;
      const name = rule?.name ?? "알 수 없음";
      if (!statMap[name]) statMap[name] = { total: 0, achieved: 0 };
      statMap[name].total++;
      if (r.achieved) statMap[name].achieved++;
    }
    const stats: RuleStat[] = Object.entries(statMap)
      .map(([name, { total, achieved }]) => ({ name, total, achieved, rate: Math.round((achieved / total) * 100) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return { rows, stats };
  } catch (e) {
    return { rows: [], stats: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function AdminBehaviorsPage() {
  await requireAdminSession();
  const { rows, stats, error } = await loadBehaviors();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 행동약속" title="행동약속 조회" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* 약속별 달성률 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">약속별 달성률 (전체)</p>
          <div className="space-y-2">
            {stats.map((s) => (
              <div key={s.name} className="rounded-[12px] bg-white p-3 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{s.name}</p>
                  <span className="text-sm font-black text-[var(--monari-hero)]">{s.rate}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--monari-surface-soft)]">
                  <div className="h-1.5 rounded-full bg-[var(--monari-hero)]" style={{ width: `${s.rate}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-[var(--color-muted)]">{s.achieved}/{s.total}회 달성</p>
              </div>
            ))}
          </div>
        </section>

        {/* 최근 기록 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">최근 행동 기록 (최대 60건)</p>
          <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            {rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">기록 없음</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{r.rule_name}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">{r.child_name} · {r.logged_at.slice(0, 10)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.approved !== null && (
                        <span className={`text-[10px] font-bold ${r.approved ? "text-[#059669]" : "text-[#dc2626]"}`}>
                          {r.approved ? "승인됨" : "거절됨"}
                        </span>
                      )}
                      <span className={`text-[11px] font-bold ${r.achieved ? "text-[#059669]" : "text-[#dc2626]"}`}>
                        {r.achieved ? "✓ 달성" : "✗ 미달성"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
      </MobileShell>
    </PageContainer>
  );
}
