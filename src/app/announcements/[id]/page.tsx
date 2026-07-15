import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Wrench, Zap } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPE_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  notice:      { icon: <Bell size={16} />,   label: "공지",     color: "bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]" },
  maintenance: { icon: <Wrench size={16} />, label: "점검 안내", color: "bg-[#fef3c7] text-[#92400e]" },
  update:      { icon: <Zap size={16} />,    label: "업데이트",  color: "bg-[#d1fae5] text-[#065f46]" },
};

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireParentSession();

  const supabase = await getSupabaseServerClient();
  const { data: a } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!a) notFound();

  // 읽음 처리 (upsert, fire-and-forget)
  if (auth.user) {
    supabase.from("announcement_reads").upsert(
      { announcement_id: id, user_id: auth.user.id },
      { onConflict: "announcement_id,user_id" },
    ).then(() => {});
  }

  const ti = TYPE_INFO[String(a.type)] ?? TYPE_INFO.notice;

  return (
    <main className="px-4 pb-36 pt-8">
      <Link href="/announcements" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
        <ArrowLeft size={16} /> 공지 목록
      </Link>

      <div className="mb-6">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${ti.color}`}>
          {ti.icon} {ti.label}
        </span>
        <h1 className="mt-3" style={{ fontSize: 24, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.02em" }}>
          {String(a.title)}
        </h1>
        <p className="mt-2" style={{ fontSize: 12, color: "var(--monari-ink-muted)" }}>
          {String(a.created_at ?? "").slice(0, 10).replace(/-/g, ".")}
          {a.starts_at && ` · 적용 ${String(a.starts_at).slice(0, 10).replace(/-/g, ".")}`}
          {a.ends_at && ` ~ ${String(a.ends_at).slice(0, 10).replace(/-/g, ".")}`}
        </p>
      </div>

      <div className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--monari-ink-soft)", whiteSpace: "pre-wrap" }}>
          {String(a.body)}
        </p>
      </div>

      <div className="mt-6">
        <Link href="/support" className="text-sm font-bold text-[var(--monari-hero)]">문의하기 →</Link>
      </div>
    </main>
  );
}
