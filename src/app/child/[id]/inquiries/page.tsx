import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChildModeContext, requireAppConsent, getAuthContext } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ChildInquiryForm } from "@/components/child/child-inquiry-form";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  pending:     { label: "접수됨",   color: "bg-[#fef3c7] text-[#92400e]" },
  in_progress: { label: "확인 중",  color: "bg-[#dbeafe] text-[#1d4ed8]" },
  resolved:    { label: "답변 완료", color: "bg-[#d1fae5] text-[#065f46]" },
  closed:      { label: "완료",     color: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]" },
};

export default async function ChildInquiriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAppConsent();
  const [ctx, auth] = await Promise.all([getChildModeContext(), getAuthContext()]);
  if (!ctx || ctx.childId !== id) notFound();
  const userId = auth.user?.id;
  if (!userId) notFound();

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id, category, title, status, created_at, admin_reply")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  const inquiries = data ?? [];

  return (
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}/settings`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
        <ArrowLeft size={16} /> 설정으로
      </Link>

      <div className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>도움 받기</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          💬 궁금한 게 있어요?
        </h1>
        <p className="mt-2" style={{ fontSize: 13, color: "var(--monari-ink-muted)", lineHeight: 1.7 }}>
          운영팀에게 궁금한 점을 물어보세요. 빠르게 답변드릴게요!
        </p>
      </div>

      <section className="mb-8">
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>새 문의 쓰기</p>
        <ChildInquiryForm />
      </section>

      <section>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>내가 보낸 문의</p>
        {inquiries.length === 0 ? (
          <div className="rounded-[24px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)" }}>아직 문의가 없어요</p>
            <p className="mt-1" style={{ fontSize: 12, color: "var(--monari-ink-muted)" }}>위에서 궁금한 점을 물어보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((q) => {
              const st = STATUS_STYLE[String(q.status)] ?? STATUS_STYLE.pending;
              return (
                <div key={q.id} className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.color}`}>{st.label}</span>
                    <span style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>{String(q.created_at ?? "").slice(0, 10).replace(/-/g, ".")}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)" }}>{String(q.title)}</p>
                  {q.admin_reply && (
                    <div className="mt-2 rounded-[10px] bg-[var(--monari-hero-lo)] p-3">
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--monari-hero)", marginBottom: 4 }}>운영팀 답변</p>
                      <p style={{ fontSize: 13, color: "var(--monari-ink-soft)", lineHeight: 1.6 }}>{String(q.admin_reply)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
