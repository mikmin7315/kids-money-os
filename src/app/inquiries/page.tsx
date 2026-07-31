import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { InquirySubmitForm } from "@/components/support/inquiry-form";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";

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
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">고객지원</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">문의하기</h1>
        <p className="text-[13px] text-white/65">불편한 점이나 궁금한 점을 남겨주세요</p>
      </PageHero>

      <PageContent className="pt-5">
        {/* 문의 작성 폼 */}
        <section className="mb-6">
          <SectionTitle>새 문의 작성</SectionTitle>
          <div className="monari-card mt-3 p-5">
            <InquirySubmitForm />
          </div>
        </section>

        {/* 내 문의 내역 */}
        <section className="mb-6">
          <SectionTitle>내 문의 내역</SectionTitle>
          <div className="mt-3">
          {inquiries.length === 0 ? (
            <div className="monari-card p-8 text-center">
              <p className="text-[14px] font-extrabold text-[var(--monari-ink)]">문의 내역이 없어요</p>
              <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">위 양식으로 문의를 남겨주세요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inquiries.map((q) => {
                const st = STATUS_STYLE[q.status] ?? STATUS_STYLE.pending;
                return (
                  <Link
                    key={q.id}
                    href={`/inquiries/${q.id}`}
                    className="monari-card flex items-start gap-3 p-4 transition active:scale-[0.98]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.color}`}>{st.label}</span>
                        <span className="text-[11px] text-[var(--monari-ink-muted)]">{CATEGORY_LABEL[q.category] ?? q.category}</span>
                      </div>
                      <p className="text-[15px] font-bold text-[var(--monari-ink)] truncate">{q.title}</p>
                      <p className="text-[12px] text-[var(--monari-ink-muted)] mt-0.5">
                        {q.created_at.slice(0, 10).replace(/-/g, ".")}
                        {q.admin_reply ? " · 답변 있음" : ""}
                      </p>
                    </div>
                    <ChevronRight size={16} className="mt-1 shrink-0 text-[var(--monari-ink-muted)]" />
                  </Link>
                );
              })}
            </div>
          )}
          </div>
        </section>

        <Link href="/announcements" className="text-[13px] font-bold text-[var(--monari-hero)]">공지사항 보기 →</Link>
      </PageContent>
    </AppNavShell>
  );
}
