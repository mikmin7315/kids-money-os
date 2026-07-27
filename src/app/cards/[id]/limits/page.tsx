import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CardLimitsForm } from "@/components/cards/card-limits-form";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CardLimitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: card } = await supabase
    .from("child_cards")
    .select("id, daily_limit, monthly_limit, child_id, children(name)")
    .eq("id", id)
    .eq("parent_id", auth.user!.id)
    .maybeSingle();

  if (!card) notFound();
  const child = Array.isArray(card.children) ? card.children[0] : card.children;

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/cards" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 카드 관리로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">카드</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">한도 설정</h1>
        <p className="text-[13px] text-white/65">{String(child?.name ?? "")} 카드</p>

        {/* 현재 한도 요약 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[12px] border border-white/20 bg-white/15 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-white/60 mb-0.5">현재 일 한도</p>
            <p className="text-[14px] font-black tabular-nums text-white">{formatWon(Number(card.daily_limit))}</p>
          </div>
          <div className="rounded-[12px] border border-white/20 bg-white/15 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-white/60 mb-0.5">현재 월 한도</p>
            <p className="text-[14px] font-black tabular-nums text-white">{formatWon(Number(card.monthly_limit))}</p>
          </div>
        </div>
      </PageHero>

      <PageContent className="pt-5">
        <section className="mb-4">
          <SectionTitle>한도 변경</SectionTitle>
          <div className="mt-3 monari-card p-4">
            <CardLimitsForm
              cardId={card.id}
              dailyLimit={Number(card.daily_limit)}
              monthlyLimit={Number(card.monthly_limit)}
            />
          </div>
        </section>

        <div className="rounded-[14px] bg-[var(--monari-surface-soft)] px-4 py-3.5 mb-6">
          <ul className="space-y-1.5">
            {[
              "일 한도는 월 한도를 초과할 수 없어요.",
              "한도 변경은 즉시 적용됩니다.",
              "잔액 부족 시 결제가 거절돼요.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[12px] text-[var(--monari-ink-muted)]">
                <span className="shrink-0 mt-0.5">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </PageContent>
    </AppNavShell>
  );
}
