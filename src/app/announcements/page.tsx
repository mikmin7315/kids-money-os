import Link from "next/link";
import { Bell, ChevronRight, Wrench, Zap } from "lucide-react";
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
  notice:      { icon: <Bell size={14} />,   label: "공지",  color: "bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]" },
  maintenance: { icon: <Wrench size={14} />, label: "점검",  color: "bg-[#fef3c7] text-[#92400e]" },
  update:      { icon: <Zap size={14} />,    label: "업데이트", color: "bg-[#d1fae5] text-[#065f46]" },
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

  return (
    <main className="px-4 pb-36 pt-8">
      <div className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>Monari</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          📢 공지사항
        </h1>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p style={{ fontSize: 48, marginBottom: 12 }}>📭</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--monari-ink)" }}>공지사항이 없어요</p>
          <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>현재 진행 중인 공지나 점검 안내가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const st = TYPE_STYLE[a.type] ?? TYPE_STYLE.notice;
            return (
              <Link
                key={a.id}
                href={`/announcements/${a.id}`}
                className="flex items-start gap-3 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition active:scale-[0.98]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.color}`}>
                      {st.icon}{st.label}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>
                      {a.created_at.slice(0, 10).replace(/-/g, ".")}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)" }} className="truncate">{a.title}</p>
                  <p style={{ fontSize: 13, color: "var(--monari-ink-muted)", marginTop: 2 }} className="truncate">{a.body}</p>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-[#d1d5db]" />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
