import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Section, Surface, Badge } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/data";

export default async function AdminDashboardPage() {
  await requireAdminSession();

  let stats = { totalParents: 0, totalChildren: 0, totalTransactions: 0 };

  if (hasSupabaseEnv()) {
    try {
      const admin = getSupabaseAdminClient();
      const [profilesRes, childrenRes, txRes] = await Promise.all([
        admin.from("profiles").select("id", { count: "exact", head: true }),
        admin.from("children").select("id", { count: "exact", head: true }),
        admin.from("money_transactions").select("id", { count: "exact", head: true }),
      ]);
      stats = {
        totalParents: profilesRes.count ?? 0,
        totalChildren: childrenRes.count ?? 0,
        totalTransactions: txRes.count ?? 0,
      };
    } catch {
      // stats remain at defaults
    }
  }

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin" title="운영 대시보드" />

        <section className="mt-6">
          <Surface className="bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(224,242,254,0.92))]">
            <p className="text-sm font-medium text-[var(--color-soft)]">Monari 관리자</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatChip label="부모 계정" value={`${stats.totalParents}`} />
              <StatChip label="아이" value={`${stats.totalChildren}`} />
              <StatChip label="거래" value={`${stats.totalTransactions}`} />
            </div>
          </Surface>
        </section>

        <Section title="관리 메뉴">
          <div className="space-y-3">
            <MenuCard
              href="/admin/roles"
              title="RBAC 역할 관리"
              description="사용자 역할을 조회하고 변경합니다."
              badge="A-R-01"
            />
            <MenuCard
              href="/"
              title="부모 대시보드 보기"
              description="일반 사용자 화면으로 이동합니다."
              badge="부모"
            />
          </div>
        </Section>

        <Section title="시스템 상태">
          <Surface>
            <div className="space-y-2 text-sm text-[var(--color-muted)]">
              <div className="flex items-center justify-between">
                <span>Supabase 연결</span>
                <Badge tone={hasSupabaseEnv() ? "emerald" : "amber"}>
                  {hasSupabaseEnv() ? "연결됨" : "데모 모드"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>월말 정산 Edge Function</span>
                <Badge tone="sky">supabase/functions/monthly-settlement</Badge>
              </div>
            </div>
          </Surface>
        </Section>
      </MobileShell>
    </PageContainer>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/70 p-3">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MenuCard({ href, title, description, badge }: { href: string; title: string; description: string; badge: string }) {
  return (
    <Link href={href}>
      <Surface className="transition hover:bg-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
          </div>
          <Badge tone="sky">{badge}</Badge>
        </div>
      </Surface>
    </Link>
  );
}
