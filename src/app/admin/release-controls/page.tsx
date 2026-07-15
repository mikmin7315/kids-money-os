import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { AppConfigForm } from "@/components/admin/app-config-form";

export const dynamic = "force-dynamic";

export default async function AdminReleaseControlsPage() {
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  const { data } = await admin.from("app_config").select("key, value, description, updated_at").order("key");
  const configs = data ?? [];

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 릴리즈" title="앱 설정 / 기능 플래그" />

        <div className="mb-4 rounded-[16px] bg-[#fef3c7] p-3">
          <p className="text-xs font-bold text-[#92400e]">⚠️ 주의</p>
          <p className="mt-0.5 text-xs text-[#92400e]">
            maintenance_mode를 true로 설정하면 모든 사용자 접근이 차단됩니다.
          </p>
        </div>

        <div className="mb-5 rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
          {configs.map((c) => (
            <div key={c.key} className="px-4 py-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs font-bold text-[var(--color-text)]">{c.key}</p>
                  {c.description && <p className="text-[11px] text-[var(--color-muted)]">{c.description}</p>}
                </div>
                <span className="font-mono text-xs font-bold text-[var(--monari-hero)]">
                  {JSON.stringify(c.value)}
                </span>
              </div>
              <AppConfigForm configKey={c.key} currentValue={JSON.stringify(c.value)} />
            </div>
          ))}
        </div>

        {configs.length === 0 && (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] py-10 text-center text-sm text-[var(--color-muted)]">
            설정이 없어요. DB migration을 먼저 실행해주세요.
          </div>
        )}

        <div className="mt-4">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
