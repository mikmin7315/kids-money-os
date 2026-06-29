import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { NotificationTemplateForm } from "@/components/admin/notification-template-form";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Template = {
  notif_type: string;
  label: string;
  title_template: string;
  body_template: string;
  is_active: boolean;
};

async function loadTemplates(): Promise<{ rows: Template[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("notification_templates")
      .select("notif_type, label, title_template, body_template, is_active")
      .order("notif_type", { ascending: true });
    if (error) throw error;
    return { rows: (data ?? []) as Template[] };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function NotificationTemplatesPage() {
  await requireAdminSession();
  const { rows, error } = await loadTemplates();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 알림" title="알림 템플릿 관리 (A-16)" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="space-y-3">
          {rows.map((row) => (
            <NotificationTemplateForm
              key={row.notif_type}
              notifType={row.notif_type}
              titleTemplate={row.title_template}
              bodyTemplate={row.body_template}
              isActive={row.is_active}
            />
          ))}
          {rows.length === 0 && !error && (
            <p className="text-sm text-[var(--color-text-muted)]">등록된 템플릿이 없습니다.</p>
          )}
        </section>
      </MobileShell>
    </PageContainer>
  );
}
