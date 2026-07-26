import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Wrench, Zap } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
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
    <AppNavShell>
      <PageHero>
        <Link href="/announcements" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 공지 목록
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">고객지원</p>
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ti.color}`}>
            {ti.icon} {ti.label}
          </span>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">{String(a.title)}</h1>
        <p className="mt-1.5 text-[12px] text-white/60">
          {String(a.created_at ?? "").slice(0, 10).replace(/-/g, ".")}
          {a.starts_at && ` · 적용 ${String(a.starts_at).slice(0, 10).replace(/-/g, ".")}`}
          {a.ends_at && ` ~ ${String(a.ends_at).slice(0, 10).replace(/-/g, ".")}`}
        </p>
      </PageHero>

      <PageContent className="pt-5">
        {/* 본문 */}
        <div className="monari-card p-5 mb-5">
          <p className="text-[15px] leading-relaxed text-[var(--monari-ink-soft)] whitespace-pre-wrap">
            {String(a.body)}
          </p>
        </div>

        <Link href="/inquiries" className="text-[13px] font-bold text-[var(--monari-hero)]">문의하기 →</Link>
      </PageContent>
    </AppNavShell>
  );
}
