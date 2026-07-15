import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    <main className="px-4 pb-36 pt-8">
      <Link href="/inquiries" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
        <ArrowLeft size={16} /> 문의 내역
      </Link>

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-[var(--monari-hero-lo)] px-2 py-0.5 text-xs font-bold text-[var(--monari-hero)]">
            {CATEGORY_LABEL[String(q.category)] ?? String(q.category)}
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {STATUS_LABEL[String(q.status)] ?? String(q.status)} · {String(q.created_at ?? "").slice(0, 10).replace(/-/g, ".")}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.02em" }}>
          {String(q.title)}
        </h1>
      </div>

      {/* 문의 내용 */}
      <div className="mb-5 rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>문의 내용</p>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: "#374151", whiteSpace: "pre-wrap" }}>
          {String(q.body)}
        </p>
      </div>

      {/* 답변 */}
      {q.admin_reply ? (
        <div className="rounded-[20px] border-l-4 border-[var(--monari-hero)] bg-[var(--monari-hero-lo)] p-5">
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-hero)", marginBottom: 8 }}>
            📩 운영팀 답변 · {String(q.replied_at ?? "").slice(0, 10).replace(/-/g, ".")}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: "#374151", whiteSpace: "pre-wrap" }}>
            {String(q.admin_reply)}
          </p>
        </div>
      ) : (
        <div className="rounded-[20px] bg-[#f9fafb] p-5 text-center">
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            아직 답변이 작성되지 않았어요. 빠르게 도움을 드릴게요 🙏
          </p>
        </div>
      )}
    </main>
  );
}
