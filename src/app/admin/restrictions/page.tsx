import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { AddRestrictionForm } from "@/components/admin/add-restriction-form";
import { LiftRestrictionButton } from "@/components/admin/lift-restriction-button";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  full: "전체 차단", read_only: "읽기 전용", suspend: "일시 정지",
};

export default async function AdminRestrictionsPage() {
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  const [activeRes, parentsRes, childrenRes] = await Promise.all([
    admin.from("account_restrictions").select("id, type, reason, starts_at, ends_at, user_id, child_id, profiles!account_restrictions_user_id_fkey(email), children(name)")
      .eq("is_active", true).order("created_at", { ascending: false }),
    admin.from("profiles").select("id, email").eq("role", "parent").limit(50),
    admin.from("children").select("id, name").is("deleted_at", null).limit(50),
  ]);

  const active = (activeRes.data ?? []).map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const child = Array.isArray(r.children) ? r.children[0] : r.children;
    return { ...r, target_label: profile?.email ? String(profile.email) : child?.name ? String(child.name) : "-" };
  });

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 정책" title="이용 제한 관리" />

        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">새 이용 제한</p>
          <AddRestrictionForm
            parents={(parentsRes.data ?? []).map((p) => ({ id: p.id, email: String(p.email ?? "") }))}
            childOptions={(childrenRes.data ?? []).map((c) => ({ id: c.id, name: String(c.name ?? "") }))}
          />
        </section>

        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">
            현재 활성 제한 <span className={active.length > 0 ? "text-[var(--monari-minus)]" : "text-[var(--monari-done)]"}>({active.length})</span>
          </p>
          {active.length === 0 ? (
            <div className="rounded-[16px] bg-[var(--status-success-solid)] py-8 text-center text-sm font-bold text-[var(--status-success-solid-text)]">
              활성 제한 없음 ✓
            </div>
          ) : (
            <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden divide-y divide-[var(--color-border)]">
              {active.map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{r.target_label}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">{r.reason}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-[var(--status-danger-solid)] px-2 py-0.5 text-[10px] font-bold text-[var(--status-danger-solid-text)]">
                          {TYPE_LABEL[r.type] ?? r.type}
                        </span>
                        {r.ends_at && <span className="text-[10px] text-[var(--color-muted)]">~{String(r.ends_at).slice(0, 10)}</span>}
                      </div>
                    </div>
                    <LiftRestrictionButton restrictionId={r.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-4 space-y-2">
          <Link href="/admin/audit-logs" className="block text-sm font-bold text-[var(--color-accent)]">감사 로그 →</Link>
          <Link href="/admin" className="block text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
