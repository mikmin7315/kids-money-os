import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
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
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="설정" title="공동 보호자 관리" />

        <div className="mb-5 rounded-[16px] bg-[var(--monari-hero-lo)] p-4">
          <p className="text-sm font-bold text-[var(--monari-hero)]">공동 보호자란?</p>
          <p className="mt-1 text-xs text-[var(--monari-hero)]">
            배우자나 다른 보호자를 초대해 아이 계정을 함께 관리할 수 있어요.
            권한은 아이별로 세밀하게 조정 가능합니다.
          </p>
        </div>

        {/* 초대 폼 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">보호자 초대</p>
          <InviteGuardianForm />
        </section>

        {/* 대기 중 초대 */}
        {invites.length > 0 && (
          <section className="mb-5">
            <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">초대 현황</p>
            <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{inv.email}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {inv.expired ? "만료됨" : `${inv.expires_at.slice(0, 10)}까지`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      inv.status === "accepted" ? "bg-[#d1fae5] text-[#065f46]" :
                      inv.expired ? "bg-[#f3f4f6] text-[#6b7280]" :
                      "bg-[#fef3c7] text-[#92400e]"
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
          <section className="mb-5">
            <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">등록된 보호자</p>
            <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
              {guardians.map((g) => (
                <Link
                  key={g.id}
                  href={`/settings/guardians/${g.guardian_id}?child=${g.child_id}`}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{g.email}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">{g.child_name} 담당</p>
                  </div>
                  <span className="text-xs text-[var(--color-accent)]">권한 설정 →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {invites.length === 0 && guardians.length === 0 && (
          <div className="rounded-[16px] bg-[#f9fafb] py-10 text-center text-sm text-[var(--color-muted)]">
            아직 초대한 보호자가 없어요.
          </div>
        )}

        <div className="mt-4">
          <Link href="/settings" className="text-sm font-bold text-[var(--color-accent)]">← 설정으로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
