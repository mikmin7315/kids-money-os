import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  parent_id: string;
  child_id: string | null;
  target: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

async function loadLogs(): Promise<{ rows: LogRow[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .select("id, parent_id, child_id, target, type, title, body, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return { rows: (data ?? []) as LogRow[] };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function NotificationLogsPage() {
  await requireAdminSession();
  const { rows, error } = await loadLogs();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 알림" title="알림 발송 로그 (A-17)" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-[14px] border border-[var(--color-border)] p-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--monari-surface-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--monari-ink-soft)]">
                  {row.target === "parent" ? "부모" : "아이"}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {row.created_at.slice(0, 19).replace("T", " ")}
                </span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-[var(--color-text)]">{row.type}</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">{row.title}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{row.body}</p>
              <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                읽음: {row.is_read ? "예" : "아니오"}
              </p>
            </div>
          ))}
          {rows.length === 0 && !error && (
            <p className="text-sm text-[var(--color-text-muted)]">발송된 알림이 없습니다.</p>
          )}
        </section>
      </MobileShell>
    </PageContainer>
  );
}
