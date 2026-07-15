import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminConsentsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  let q = admin
    .from("consent_logs")
    .select("id, terms_type, version, accepted_at, profiles!consent_logs_user_id_fkey(email)")
    .order("accepted_at", { ascending: false })
    .limit(80);
  if (type) q = q.eq("terms_type", type);

  const { data } = await q;
  const logs = (data ?? []).map((l) => {
    const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
    return { ...l, email: String(profile?.email ?? "-") };
  });

  const types = [...new Set(logs.map((l) => l.terms_type))];

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 동의" title="동의 이력 조회" />

        {types.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <Link href="/admin/consents" className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${!type ? "bg-[var(--color-accent)] text-white" : "bg-[var(--monari-surface-soft)]"}`}>전체</Link>
            {types.map((t) => (
              <Link key={t} href={`/admin/consents?type=${t}`} className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${type === t ? "bg-[var(--color-accent)] text-white" : "bg-[var(--monari-surface-soft)]"}`}>{t}</Link>
            ))}
          </div>
        )}

        {logs.length === 0 ? (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] py-10 text-center text-sm text-[var(--color-muted)]">동의 이력이 없어요.</div>
        ) : (
          <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden divide-y divide-[var(--color-border)]">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{l.email}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{l.terms_type} v{l.version}</p>
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">{String(l.accepted_at ?? "").slice(0, 10)}</p>
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
