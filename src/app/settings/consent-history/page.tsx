import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  service: "이용약관",
  privacy: "개인정보처리방침",
  marketing: "마케팅 수신 동의",
};

export default async function ConsentHistoryPage() {
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("consent_logs")
    .select("id, terms_type, version, accepted_at")
    .eq("user_id", auth.user!.id)
    .order("accepted_at", { ascending: false });

  const logs = data ?? [];

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">설정</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">동의 이력</h1>
        <p className="text-[13px] text-white/65">약관 동의 기록을 확인하세요</p>
      </PageHero>

      <PageContent className="pt-5">
        {logs.length === 0 ? (
          <div className="monari-card px-5 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
              <FileText size={26} />
            </span>
            <p className="mt-4 text-[15px] font-extrabold text-[var(--monari-ink)]">동의 이력이 없어요</p>
          </div>
        ) : (
          <section className="mb-5">
            <SectionTitle>동의 내역</SectionTitle>
            <div className="mt-3 monari-card divide-y divide-[var(--monari-line)]">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--monari-ink)]">
                      {TYPE_LABEL[l.terms_type] ?? l.terms_type}
                    </p>
                    <p className="text-[11px] text-[var(--monari-ink-muted)] mt-0.5">v{l.version}</p>
                  </div>
                  <p className="text-[12px] text-[var(--monari-ink-muted)]">
                    {String(l.accepted_at ?? "").slice(0, 10)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-[12px] text-[var(--monari-ink-muted)] mb-6">
          약관 내용은{" "}
          <Link href="/legal/terms" className="font-bold text-[var(--monari-hero)]">이용약관</Link>
          {" "}및{" "}
          <Link href="/legal/privacy" className="font-bold text-[var(--monari-hero)]">개인정보처리방침</Link>
          에서 확인하세요.
        </p>
      </PageContent>
    </AppNavShell>
  );
}
