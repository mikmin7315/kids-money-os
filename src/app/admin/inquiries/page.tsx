import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminInquiryReplyForm } from "@/components/admin/inquiry-reply-form";

export const dynamic = "force-dynamic";

type InquiryRow = {
  id: string;
  user_name: string;
  category: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  admin_reply: string | null;
  replied_at: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "접수됨", in_progress: "처리 중", resolved: "답변 완료", closed: "종료",
};
const STATUS_STYLE: Record<string, string> = {
  pending:     "bg-[var(--status-pending-solid)] text-[var(--status-pending-solid-text)]",
  in_progress: "bg-[var(--status-info-solid)] text-[var(--status-info-solid-text)]",
  resolved:    "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]",
  closed:      "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]",
};

async function loadInquiries(): Promise<{ rows: InquiryRow[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("inquiries")
      .select("id, user_id, category, title, body, status, created_at, admin_reply, replied_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
    const { data: profiles } = await admin.from("profiles").select("id, name").in("id", userIds);
    const nameMap = (profiles ?? []).reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = String(p.name ?? "");
      return acc;
    }, {});

    const rows: InquiryRow[] = (data ?? []).map((r) => ({
      id: r.id,
      user_name: nameMap[r.user_id] ?? "알 수 없음",
      category: String(r.category),
      title: String(r.title),
      body: String(r.body),
      status: String(r.status),
      created_at: String(r.created_at ?? ""),
      admin_reply: r.admin_reply ? String(r.admin_reply) : null,
      replied_at: r.replied_at ? String(r.replied_at) : null,
    }));
    return { rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireAdminSession();
  const { id: selectedId } = await searchParams;
  const { rows, error } = await loadInquiries();
  const selected = selectedId ? rows.find((r) => r.id === selectedId) : null;
  const pending = rows.filter((r) => r.status === "pending" || r.status === "in_progress");

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 고객지원" title="문의 관리" />

        {error && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { label: "전체", value: rows.length, c: "" },
            { label: "미처리", value: pending.length, c: "text-[var(--monari-minus)]" },
            { label: "완료", value: rows.filter((r) => r.status === "resolved").length, c: "text-[var(--monari-done)]" },
          ].map(({ label, value, c }) => (
            <div key={label} className="rounded-[12px] bg-[var(--monari-surface-soft)] p-3 text-center">
              <p className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</p>
              <p className={`mt-1 text-lg font-black ${c || "text-[var(--color-text)]"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* 선택된 문의 상세 + 답변 */}
        {selected && (
          <section className="mb-6 rounded-[16px] border border-[var(--color-border)] bg-white p-4">
            <div className="mb-3">
              <p className="font-bold text-[var(--color-text)]">{selected.title}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {selected.user_name} · {selected.category} · {selected.created_at.slice(0, 10)}
              </p>
            </div>
            <div className="mb-4 rounded-[10px] bg-[var(--monari-surface-soft)] p-3">
              <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{selected.body}</p>
            </div>
            {selected.admin_reply && (
              <div className="mb-4 rounded-[10px] bg-[var(--monari-hero-lo)] p-3">
                <p className="text-xs font-semibold text-[var(--monari-hero)] mb-1">기존 답변</p>
                <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{selected.admin_reply}</p>
              </div>
            )}
            <AdminInquiryReplyForm inquiryId={selected.id} />
          </section>
        )}

        {/* 문의 목록 */}
        <section>
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">문의 목록</p>
          {rows.length === 0 ? (
            <div className="rounded-[16px] bg-[var(--monari-surface-soft)] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
              접수된 문의가 없어요.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                const isSelected = selectedId === r.id;
                return (
                  <Link
                    key={r.id}
                    href={`/admin/inquiries?id=${r.id}`}
                    className={`block rounded-[14px] border px-4 py-3 transition ${isSelected ? "border-[var(--color-accent)] bg-[var(--monari-hero-lo)]" : "border-[var(--color-border)] bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--color-text)]">{r.title}</p>
                        <p className="text-[11px] text-[var(--color-muted)]">
                          {r.user_name} · {r.category} · {r.created_at.slice(0, 10)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${st}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
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
