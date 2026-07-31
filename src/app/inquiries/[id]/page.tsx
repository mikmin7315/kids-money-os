import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "접수됨", in_progress: "처리 중", resolved: "답변 완료", closed: "종료",
};
const CATEGORY_LABEL: Record<string, string> = {
  general: "일반", account: "계정", finance: "금융·이자", borrow: "미리쓰기",
  allowance: "용돈", bug: "버그", other: "기타",
};

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: q } = await supabase
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user!.id)
    .maybeSingle();

  if (!q) notFound();

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/inquiries" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 문의 내역
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
            {CATEGORY_LABEL[String(q.category)] ?? String(q.category)}
          </span>
          <span className="text-[12px] text-white/60">
            {STATUS_LABEL[String(q.status)] ?? String(q.status)} · {String(q.created_at ?? "").slice(0, 10).replace(/-/g, ".")}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">{String(q.title)}</h1>
      </PageHero>

      <PageContent className="pt-5">
        <div className="mb-5 monari-card p-5">
          <p className="text-[13px] font-bold text-[var(--monari-ink-muted)] mb-2">문의 내용</p>
          <p className="text-[15px] leading-[1.75] text-[var(--monari-ink-soft)] whitespace-pre-wrap">
            {String(q.body)}
          </p>
        </div>

        {q.admin_reply ? (
          <div className="rounded-[24px] border-l-4 border-[var(--monari-hero)] bg-[var(--monari-hero-lo)] p-5 mb-8">
            <p className="text-[13px] font-bold text-[var(--monari-hero)] mb-2">
              운영팀 답변 · {String(q.replied_at ?? "").slice(0, 10).replace(/-/g, ".")}
            </p>
            <p className="text-[15px] leading-[1.75] text-[var(--monari-ink-soft)] whitespace-pre-wrap">
              {String(q.admin_reply)}
            </p>
          </div>
        ) : (
          <div className="monari-card p-5 text-center mb-8">
            <p className="text-[14px] text-[var(--monari-ink-muted)]">
              아직 답변이 작성되지 않았어요. 빠르게 도움을 드릴게요 🙏
            </p>
          </div>
        )}
      </PageContent>
    </AppNavShell>
  );
}
