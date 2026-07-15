import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
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
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="설정 · 보호자" title="권한 설정" />

        <div className="mb-5 rounded-[16px] bg-white p-4 shadow-[var(--monari-shadow-md)]">
          <p className="text-sm font-extrabold">{String(profile?.email ?? "-")}</p>
          <p className="text-[11px] text-[var(--color-muted)]">{String(child?.name ?? "-")} 담당 보호자</p>
        </div>

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

        <div className="mt-4">
          <Link href="/settings/guardians" className="text-sm font-bold text-[var(--color-accent)]">← 보호자 목록으로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
