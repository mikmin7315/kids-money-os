import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CardLostForm } from "@/components/cards/card-lost-form";

export const dynamic = "force-dynamic";

export default async function CardLostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: card } = await supabase
    .from("child_cards")
    .select("id, status, child_id, children(name)")
    .eq("id", id)
    .eq("parent_id", auth.user!.id)
    .maybeSingle();

  if (!card) notFound();
  const child = Array.isArray(card.children) ? card.children[0] : card.children;

  if (card.status === "lost") {
    return (
      <AppNavShell>
        <PageHero>
          <Link href="/cards" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
            <ArrowLeft size={14} /> 카드 관리로
          </Link>
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">카드</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">카드 재발급</h1>
        </PageHero>

        <PageContent className="pt-5">
          <div className="monari-card px-5 py-8 text-center mb-5">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]">
              <Lock size={26} />
            </span>
            <p className="mt-4 text-[16px] font-extrabold text-[var(--monari-ink)]">분실 신고된 카드예요</p>
            <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">분실 신고 후 카드는 사용이 중지됐어요.</p>
          </div>

          <div className="monari-card px-4 py-4 mb-5">
            <p className="text-[13px] font-bold text-[var(--monari-hero)] mb-3">재발급 안내</p>
            <ul className="space-y-2">
              {[
                "재발급은 고객센터 문의를 통해 진행돼요.",
                "기존 카드 번호는 변경되며 새 카드가 발급돼요.",
                "재발급 소요 기간: 영업일 기준 3~5일",
                "재발급 중 카드 사용은 불가해요.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[13px] text-[var(--monari-ink-soft)]">
                  <span className="mt-0.5 shrink-0 text-[var(--monari-ink-muted)]">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href="/cards"
              className="flex-1 rounded-[14px] border border-[var(--monari-line)] py-3 text-center text-[14px] font-bold text-[var(--monari-ink-soft)]"
            >
              카드 관리로
            </Link>
            <Link
              href="/inquiries"
              className="flex-1 rounded-[14px] bg-[var(--monari-hero)] py-3 text-center text-[14px] font-bold text-white"
            >
              재발급 신청하기
            </Link>
          </div>
        </PageContent>
      </AppNavShell>
    );
  }

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/cards" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 카드 관리로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">카드</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">분실 신고</h1>
        <p className="text-[13px] text-white/65">{String(child?.name ?? "")} 카드</p>
      </PageHero>

      <PageContent className="pt-5">
        <div className="monari-card p-4">
          <CardLostForm cardId={card.id} childName={String(child?.name ?? "")} />
        </div>
      </PageContent>
    </AppNavShell>
  );
}
