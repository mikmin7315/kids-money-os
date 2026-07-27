import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GuardianPermissionsForm } from "@/components/guardians/guardian-permissions-form";

export const dynamic = "force-dynamic";

export default async function GuardianDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ child?: string }>;
}) {
  const { id: guardianId } = await params;
  const { child: childId } = await searchParams;
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: record } = await supabase
    .from("child_guardians")
    .select("*, profiles!child_guardians_guardian_id_fkey(email), children(name)")
    .eq("guardian_id", guardianId)
    .eq("invited_by", auth.user!.id)
    .eq("child_id", childId ?? "")
    .maybeSingle();

  if (!record) notFound();

  const profile = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
  const child = Array.isArray(record.children) ? record.children[0] : record.children;

  const PERMISSIONS = [
    { key: "can_give_allowance", label: "용돈 지급", desc: "아이에게 직접 용돈을 줄 수 있어요." },
    { key: "can_approve_behavior", label: "행동 약속 승인", desc: "아이의 행동 달성을 확인하고 승인해요." },
    { key: "can_approve_borrow", label: "미리쓰기 승인", desc: "아이의 미리쓰기 요청을 승인해요." },
    { key: "can_change_settings", label: "설정 변경", desc: "이자율, 용돈 일정 등을 변경할 수 있어요." },
    { key: "can_invite_guardian", label: "보호자 초대", desc: "다른 보호자를 추가로 초대할 수 있어요." },
  ] as const;

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings/guardians" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 보호자 목록으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">설정 · 보호자</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">권한 설정</h1>
        <p className="text-[13px] text-white/65">{String(child?.name ?? "-")} 담당 보호자</p>
      </PageHero>

      <PageContent className="pt-5">

        {/* 보호자 정보 */}
        <section className="mb-6">
          <div className="monari-card flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
              <Users size={18} />
            </div>
            <div>
              <p className="text-[15px] font-800 text-[var(--monari-ink)]">{String(profile?.email ?? "-")}</p>
              <p className="text-[12px] text-[var(--monari-ink-muted)]">{String(child?.name ?? "-")} 담당 보호자</p>
            </div>
          </div>
        </section>

        {/* 권한 설정 */}
        <section className="mb-6">
          <SectionTitle>권한</SectionTitle>
          <div className="mt-3">
            <GuardianPermissionsForm
              guardianId={guardianId}
              childId={childId ?? ""}
              permissions={{
                can_give_allowance: Boolean(record.can_give_allowance),
                can_approve_behavior: Boolean(record.can_approve_behavior),
                can_approve_borrow: Boolean(record.can_approve_borrow),
                can_change_settings: Boolean(record.can_change_settings),
                can_invite_guardian: Boolean(record.can_invite_guardian),
              }}
              permissionDefs={PERMISSIONS}
            />
          </div>
        </section>

      </PageContent>
    </AppNavShell>
  );
}
