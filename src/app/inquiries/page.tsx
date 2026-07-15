import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { InquirySubmitForm } from "@/components/support/inquiry-form";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  general: "일반", account: "계정", finance: "금융·이자", borrow: "미리쓰기",
  allowance: "용돈", bug: "버그", other: "기타",
};
const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  pending:     { label: "접수됨",   color: "bg-[var(--status-pending-solid)] text-[var(--status-pending-solid-text)]" },
  in_progress: { label: "처리 중",  color: "bg-[var(--status-info-solid)] text-[var(--status-info-solid-text)]" },
  resolved:    { label: "답변 완료", color: "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]" },
  closed:      { label: "종료",     color: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]" },
};

type InquiryRow = {
  id: string;
  category: string;
  title: string;
  status: string;
  created_at: string;
  admin_reply: string | null;
};

export default async function InquiriesPage() {
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id, category, title, status, created_at, admin_reply")
    .eq("user_id", auth.user!.id)
    .order("created_at", { ascending: false })
    .limit(30);
  const inquiries: InquiryRow[] = (data ?? []) as InquiryRow[];

  return (
    <main className="px-4 pb-36 pt-8">
      <div className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>고객지원</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          💬 문의하기
        </h1>
      </div>

      {/* 문의 작성 폼 */}
      <section className="mb-8">
        <p style={{ fontSize: 16, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>새 문의 작성</p>
        <InquirySubmitForm />
      </section>

      {/* 내 문의 내역 */}
      <section>
        <p style={{ fontSize: 16, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>내 문의 내역</p>
        {inquiries.length === 0 ? (
          <div className="rounded-[24px] bg-white p-8 text-center shadow-[var(--monari-shadow-md)]">
            <p style={{ fontSize: 36, marginBottom: 10 }}>📭</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--monari-ink)" }}>문의 내역이 없어요</p>
            <p className="mt-2" style={{ fontSize: 13, color: "var(--monari-ink-muted)" }}>
              위 양식으로 문의를 남겨주세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((q) => {
              const st = STATUS_STYLE[q.status] ?? STATUS_STYLE.pending;
              return (
                <Link
                  key={q.id}
                  href={`/inquiries/${q.id}`}
                  className="flex items-start gap-3 rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-md)] transition active:scale-[0.98]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.color}`}>{st.label}</span>
                      <span style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>{CATEGORY_LABEL[q.category] ?? q.category}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)" }} className="truncate">{q.title}</p>
                    <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", marginTop: 2 }}>
                      {q.created_at.slice(0, 10).replace(/-/g, ".")}
                      {q.admin_reply ? " · 답변 있음" : ""}
                    </p>
                  </div>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-[#d1d5db]" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Link href="/support" className="text-sm font-bold text-[var(--monari-hero)]">FAQ 보기 →</Link>
        </div>
      </section>
    </main>
  );
}
