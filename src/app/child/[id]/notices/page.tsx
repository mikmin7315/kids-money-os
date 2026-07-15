import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ann = {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
};

const TYPE_EMOJI: Record<string, string> = {
  notice: "📢",
  maintenance: "🔧",
  update: "✨",
};

export default async function ChildNoticesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([
    getChildModeContext(),
    getAppDataBundle(),
  ]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, type, created_at")
    .eq("status", "active")
    .in("target", ["all", "child"])
    .or("starts_at.is.null,starts_at.lte.now()")
    .or("ends_at.is.null,ends_at.gt.now()")
    .order("created_at", { ascending: false })
    .limit(20);
  const notices: Ann[] = (data ?? []) as Ann[];

  return (
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      <div className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>{child.name}에게</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          📢 공지사항
        </h1>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p style={{ fontSize: 48, marginBottom: 12 }}>📭</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--monari-ink)" }}>공지사항이 없어요</p>
          <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>현재 새로운 공지가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((a) => (
            <div key={a.id} className="rounded-[24px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="flex items-start gap-3">
                <span style={{ fontSize: 28 }}>{TYPE_EMOJI[a.type] ?? "📢"}</span>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)" }}>{a.title}</p>
                  <p style={{ fontSize: 13, color: "var(--monari-ink-muted)", marginTop: 2 }}>
                    {a.created_at.slice(0, 10).replace(/-/g, ".")}
                  </p>
                  <p style={{ fontSize: 14, color: "var(--monari-ink-soft)", marginTop: 8, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                    {a.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
