import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const { action } = await searchParams;
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  let q = admin
    .from("admin_audit_logs")
    .select("id, action, resource_type, resource_id, notes, created_at, profiles!admin_audit_logs_admin_id_fkey(email)")
    .order("created_at", { ascending: false })
    .limit(80);
  if (action) q = q.eq("action", action);

  const { data } = await q;
  const logs = (data ?? []).map((l) => {
    const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
    return { ...l, admin_email: String(profile?.email ?? "-") };
  });

  const actions = [...new Set(logs.map((l) => l.action))];

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 감사" title="관리자 행동 로그" />

        {actions.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <Link href="/admin/audit-logs" className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${!action ? "bg-[var(--color-accent)] text-white" : "bg-[var(--monari-surface-soft)]"}`}>전체</Link>
            {actions.map((a) => (
              <Link key={a} href={`/admin/audit-logs?action=${a}`} className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${action === a ? "bg-[var(--color-accent)] text-white" : "bg-[var(--monari-surface-soft)]"}`}>{a}</Link>
            ))}
          </div>
        )}

        {logs.length === 0 ? (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] py-10 text-center text-sm text-[var(--color-muted)]">로그가 없어요.</div>
        ) : (
          <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden divide-y divide-[var(--color-border)]">
            {logs.map((l) => (
              <div key={l.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[var(--monari-hero-lo)] px-2 py-0.5 text-[10px] font-bold text-[var(--monari-hero)]">{l.action}</span>
                  <span className="text-[10px] text-[var(--color-muted)]">{String(l.created_at ?? "").slice(0, 16)}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {l.resource_type} {l.resource_id ? `· ${l.resource_id.slice(0, 8)}` : ""}
                </p>
                <p className="text-[11px] text-[var(--color-muted)]">{l.admin_email}</p>
                {l.notes && <p className="mt-0.5 text-[11px] text-[var(--color-text)]">{l.notes}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
