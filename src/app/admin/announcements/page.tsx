import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export const dynamic = "force-dynamic";

type Ann = {
  id: string;
  title: string;
  type: string;
  target: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

async function loadAnnouncements(): Promise<{ rows: Ann[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("announcements")
      .select("id, title, type, target, status, starts_at, ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { rows: (data ?? []) as Ann[] };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-[#d1fae5] text-[#065f46]",
  draft:  "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]",
  ended:  "bg-[#fee2e2] text-[#991b1b]",
};
const STATUS_LABEL: Record<string, string> = { active: "게시 중", draft: "임시저장", ended: "종료" };

export default async function AdminAnnouncementsPage() {
  await requireAdminSession();
  const { rows, error } = await loadAnnouncements();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 공지" title="공지/점검 관리" />

        {error && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* 공지 작성 폼 */}
        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">새 공지 작성</p>
          <AnnouncementForm />
        </section>

        {/* 공지 목록 */}
        <section>
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">공지 목록</p>
          {rows.length === 0 ? (
            <div className="rounded-[16px] bg-[var(--monari-surface-soft)] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
              등록된 공지가 없어요.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((a) => (
                <div key={a.id} className="rounded-[14px] border border-[var(--color-border)] bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--color-text)]">{a.title}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">
                        {a.type} · {a.target} · {a.created_at.slice(0, 10)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[a.status] ?? STATUS_STYLE.draft}`}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
