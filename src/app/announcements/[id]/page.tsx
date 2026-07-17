import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Wrench, Zap } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPE_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  notice:      { icon: <Bell size={16} />,   label: "공지",     color: "bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]" },
  maintenance: { icon: <Wrench size={16} />, label: "점검 안내", color: "bg-[var(--status-pending-solid)] text-[var(--status-pending-solid-text)]" },
  update:      { icon: <Zap size={16} />,    label: "업데이트",  color: "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]" },
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
    <MobileAppShell title="공지사항" subtitle="모나리 소식">
      <Link
        href="/announcements"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
      >
        <ArrowLeft size={16} /> 공지 목록
      </Link>

      {/* 히어로 */}
      <section
        className="relative mb-6 overflow-hidden rounded-[24px] p-6 text-white"
        style={{
          background: "linear-gradient(145deg,#5b21b6 0%,#7c3aed 55%,#a855f7 100%)",
          boxShadow: "0 16px 40px rgba(109,40,217,0.35)",
        }}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${ti.color}`}>
            {ti.icon} {ti.label}
          </span>
          <h2
            className="mt-3 font-black tracking-tight text-white"
            style={{ fontSize: 20, letterSpacing: "-0.02em" }}
          >
            {String(a.title)}
          </h2>
          <p className="mt-2 text-[12px] text-white/60">
            {String(a.created_at ?? "").slice(0, 10).replace(/-/g, ".")}
            {a.starts_at && ` · 적용 ${String(a.starts_at).slice(0, 10).replace(/-/g, ".")}`}
            {a.ends_at && ` ~ ${String(a.ends_at).slice(0, 10).replace(/-/g, ".")}`}
          </p>
        </div>
      </section>

      {/* 본문 */}
      <div className="rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
        <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--monari-ink-soft)", whiteSpace: "pre-wrap" }}>
          {String(a.body)}
        </p>
      </div>

      <div className="mt-6">
        <Link href="/support" className="text-sm font-bold text-[var(--monari-hero)]">문의하기 →</Link>
      </div>
    </MobileAppShell>
  );
}
