import Link from "next/link";
import { ArrowLeft, ChevronRight, Users } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { InviteGuardianForm } from "@/components/guardians/invite-guardian-form";
import { CancelInviteButton } from "@/components/guardians/cancel-invite-button";

export const dynamic = "force-dynamic";

export default async function GuardiansPage() {
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const [inviteRes, guardianRes] = await Promise.all([
    supabase
      .from("guardian_invites")
      .select("id, email, status, expires_at, created_at")
      .eq("parent_id", auth.user!.id)
      .not("status", "in", '("cancelled")')
      .order("created_at", { ascending: false }),
    supabase
      .from("child_guardians")
      .select("id, guardian_id, child_id, can_give_allowance, can_approve_behavior, can_approve_borrow, can_change_settings, can_invite_guardian, profiles!child_guardians_guardian_id_fkey(email), children(name)")
      .eq("invited_by", auth.user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const invites = (inviteRes.data ?? []).map((i) => ({
    ...i,
    expired: new Date(i.expires_at) < new Date(),
  }));

  const guardians = (guardianRes.data ?? []).map((g) => {
    const profile = Array.isArray(g.profiles) ? g.profiles[0] : g.profiles;
    const child = Array.isArray(g.children) ? g.children[0] : g.children;
    return { ...g, email: String(profile?.email ?? "-"), child_name: String(child?.name ?? "-") };
  });

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">설정</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">공동 보호자</h1>
        <p className="text-[13px] text-white/65">배우자나 다른 보호자를 초대해 함께 관리하세요</p>
        {guardians.length > 0 && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white">
              <Users size={12} /> 보호자 {guardians.length}명
            </span>
          </div>
        )}
      </PageHero>

      <PageContent className="pt-5">

        {/* 보호자 초대 */}
        <section className="mb-6">
          <SectionTitle>보호자 초대</SectionTitle>
          <div className="mt-3 mb-3 rounded-[14px] bg-[var(--monari-hero-lo)] px-4 py-3.5">
            <p className="text-[12px] font-bold text-[var(--monari-hero)] mb-0.5">공동 보호자란?</p>
            <p className="text-[12px] text-[var(--monari-hero)]/70 leading-relaxed">
              배우자나 다른 보호자를 초대해 아이 계정을 함께 관리할 수 있어요. 권한은 아이별로 조정 가능합니다.
            </p>
          </div>
          <InviteGuardianForm />
        </section>

        {/* 초대 현황 */}
        {invites.length > 0 && (
          <section className="mb-6">
            <SectionTitle>초대 현황</SectionTitle>
            <div className="mt-3 monari-card divide-y divide-[var(--monari-line)]">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-[14px] font-bold text-[var(--monari-ink)]">{inv.email}</p>
                    <p className="text-[11px] text-[var(--monari-ink-muted)] mt-0.5">
                      {inv.expired ? "만료됨" : `${inv.expires_at.slice(0, 10)}까지`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      inv.status === "accepted"
                        ? "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]"
                        : inv.expired
                        ? "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"
                        : "bg-[var(--status-pending-solid)] text-[var(--status-pending-solid-text)]"
                    }`}>
                      {inv.status === "accepted" ? "수락" : inv.expired ? "만료" : "대기"}
                    </span>
                    {inv.status === "pending" && !inv.expired && (
                      <CancelInviteButton inviteId={inv.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 등록된 보호자 */}
        {guardians.length > 0 && (
          <section className="mb-6">
            <SectionTitle>등록된 보호자</SectionTitle>
            <div className="mt-3 monari-card divide-y divide-[var(--monari-line)]">
              {guardians.map((g) => (
                <Link
                  key={g.id}
                  href={`/settings/guardians/${g.guardian_id}?child=${g.child_id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
                    <Users size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[var(--monari-ink)] truncate">{g.email}</p>
                    <p className="text-[12px] text-[var(--monari-ink-muted)]">{g.child_name} 담당</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[var(--monari-ink-muted)]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 빈 상태 */}
        {invites.length === 0 && guardians.length === 0 && (
          <div className="monari-card px-5 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
              <Users size={26} />
            </span>
            <p className="mt-4 text-[16px] font-extrabold text-[var(--monari-ink)]">아직 초대한 보호자가 없어요</p>
            <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">위 폼으로 배우자나 다른 보호자를 초대해보세요.</p>
          </div>
        )}

      </PageContent>
    </AppNavShell>
  );
}
