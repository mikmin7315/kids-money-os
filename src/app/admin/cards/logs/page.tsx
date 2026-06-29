import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCardLogsPage() {
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  const { data } = await admin
    .from("card_integration_logs")
    .select("id, card_id, event_type, status_code, error_message, retried, created_at")
    .order("created_at", { ascending: false })
    .limit(60);

  const logs = data ?? [];
  const errorCount = logs.filter((l) => l.status_code && l.status_code >= 400).length;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 카드" title="카드 연동 로그" />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-[12px] bg-white p-3 text-center shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
            <p className="text-[10px] text-[var(--color-muted)]">최근 60건</p>
            <p className="mt-1 text-lg font-black">{logs.length}</p>
          </div>
          <div className="rounded-[12px] bg-white p-3 text-center shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
            <p className="text-[10px] text-[var(--color-muted)]">에러</p>
            <p className={`mt-1 text-lg font-black ${errorCount > 0 ? "text-[#dc2626]" : "text-[#059669]"}`}>{errorCount}</p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-[16px] bg-[#f9fafb] py-10 text-center text-sm text-[var(--color-muted)]">로그가 없어요.</div>
        ) : (
          <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
            {logs.map((l) => (
              <div key={l.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--color-text)]">{l.event_type}</p>
                  <div className="flex items-center gap-2">
                    {l.retried && <span className="text-[10px] text-[#d97706]">재처리</span>}
                    <span className={`text-xs font-bold ${
                      !l.status_code ? "text-[#6b7280]" :
                      l.status_code < 300 ? "text-[#059669]" : "text-[#dc2626]"
                    }`}>
                      {l.status_code ?? "—"}
                    </span>
                  </div>
                </div>
                {l.error_message && (
                  <p className="mt-0.5 text-[11px] text-[#dc2626]">{l.error_message}</p>
                )}
                <p className="text-[10px] text-[var(--color-muted)]">
                  {l.card_id?.slice(0, 8) ?? "-"} · {String(l.created_at ?? "").slice(0, 19)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <Link href="/admin/cards" className="block text-sm font-bold text-[var(--color-accent)]">← 카드 목록으로</Link>
          <Link href="/admin" className="block text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
