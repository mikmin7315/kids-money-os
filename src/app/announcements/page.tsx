import Link from "next/link";
import { Bell, ChevronRight, Wrench, Zap } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Announcement = {
  id: string;
  title: string;
  body: string;
  type: "notice" | "maintenance" | "update";
  target: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

const TYPE_STYLE: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  notice:      { icon: <Bell size={14} />,   label: "공지",    color: "bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]" },
  maintenance: { icon: <Wrench size={14} />, label: "점검",    color: "bg-[var(--status-pending-solid)] text-[var(--status-pending-solid-text)]" },
  update:      { icon: <Zap size={14} />,    label: "업데이트", color: "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]" },
};

async function loadAnnouncements(): Promise<Announcement[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from("announcements")
      .select("id, title, body, type, target, starts_at, ends_at, created_at")
      .eq("status", "active")
      .or("starts_at.is.null,starts_at.lte.now()")
      .or("ends_at.is.null,ends_at.gt.now()")
      .order("created_at", { ascending: false })
      .limit(30);
    return (data ?? []) as Announcement[];
  } catch {
    return [];
  }
}

export default async function AnnouncementsPage() {
  await requireParentSession();
  const announcements = await loadAnnouncements();

  const noticeCount = announcements.filter((a) => a.type === "notice").length;
  const maintenanceCount = announcements.filter((a) => a.type === "maintenance").length;
  const updateCount = announcements.filter((a) => a.type === "update").length;

  return (
    <AppNavShell>
      <PageHero>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">고객지원</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-3">
          {announcements.length === 0 ? "공지사항" : `공지 ${announcements.length}건`}
        </h1>
        <div className="flex gap-3">
          <HeroPill label="공지" value={`${noticeCount}건`} />
          <HeroPill label="점검" value={`${maintenanceCount}건`} />
          <HeroPill label="업데이트" value={`${updateCount}건`} />
        </div>
      </PageHero>

      <PageContent className="pt-5">
      {announcements.length === 0 ? (
        <div className="monari-card p-8 text-center">
          <p className="text-[18px] font-black text-[var(--monari-ink)] mb-2">공지사항이 없어요</p>
          <p className="text-[14px] text-[var(--monari-ink-muted)]">현재 진행 중인 공지나 점검 안내가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const st = TYPE_STYLE[a.type] ?? TYPE_STYLE.notice;
            return (
              <Link
                key={a.id}
                href={`/announcements/${a.id}`}
                className="monari-card flex items-start gap-3 p-4 transition active:scale-[0.98]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.color}`}>
                      {st.icon}{st.label}
                    </span>
                    <span className="text-[11px] text-[var(--monari-ink-muted)]">
                      {a.created_at.slice(0, 10).replace(/-/g, ".")}
                    </span>
                  </div>
                  <p className="text-[15px] font-bold text-[var(--monari-ink)] truncate">{a.title}</p>
                  <p className="text-[13px] text-[var(--monari-ink-muted)] mt-0.5 truncate">{a.body}</p>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-[var(--monari-ink-muted)]" />
              </Link>
            );
          })}
        </div>
      )}
      </PageContent>
    </AppNavShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-white/15 px-4 py-2.5 text-center backdrop-blur-sm">
      <p className="text-[11px] font-semibold text-white/70">{label}</p>
      <p className="text-[18px] font-black text-white">{value}</p>
    </div>
  );
}
