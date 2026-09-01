import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CardRechargeForm } from "@/components/cards/card-recharge-form";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CardRechargePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const [{ data: card }, { data: wallet }] = await Promise.all([
    supabase
      .from("child_cards")
      .select("id, last4, child_id, children(name)")
      .eq("id", id)
      .eq("parent_id", auth.user!.id)
      .maybeSingle(),
    supabase
      .from("parent_wallets")
      .select("balance")
      .eq("parent_id", auth.user!.id)
      .maybeSingle(),
  ]);

  if (!card) notFound();
  const child = Array.isArray(card.children) ? card.children[0] : card.children;
  const walletBalance: number = wallet?.balance ?? 0;

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/cards" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 카드 관리로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">카드</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">카드 충전</h1>
        <p className="text-[13px] text-white/65">
          {String(child?.name ?? "")} 카드{card.last4 ? ` **** ${card.last4}` : ""}
        </p>

        {/* 지갑 잔액 표시 */}
        <div className="mt-4 flex items-center gap-2 rounded-[12px] border border-white/20 bg-white/15 px-4 py-3">
          <Wallet size={16} className="shrink-0 text-white/70" />
          <div>
            <p className="text-[10px] font-semibold text-white/60">내 지갑 잔액</p>
            <p className="text-[15px] font-black tabular-nums text-white">{formatWon(walletBalance)}</p>
          </div>
        </div>
      </PageHero>

      <PageContent className="pt-5">
        <section className="mb-4">
          <SectionTitle>충전 금액 설정</SectionTitle>
          <div className="mt-3 monari-card p-4">
            {walletBalance > 0 ? (
              <CardRechargeForm cardId={card.id} maxAmount={walletBalance} />
            ) : (
              <div className="py-6 text-center">
                <p className="text-[14px] font-bold text-[var(--monari-ink)]">지갑 잔액이 없어요</p>
                <p className="mt-1 text-[12px] text-[var(--monari-ink-muted)]">
                  먼저 부모 지갑을 충전해주세요.
                </p>
                <Link
                  href="/settings"
                  className="mt-4 inline-block rounded-[10px] bg-[var(--monari-hero)] px-5 py-2.5 text-[13px] font-bold text-white"
                >
                  지갑 충전하러 가기
                </Link>
              </div>
            )}
          </div>
        </section>

        <div className="rounded-[14px] bg-[var(--monari-surface-soft)] px-4 py-3.5 mb-6">
          <ul className="space-y-1.5">
            {[
              "충전 금액은 부모 지갑에서 차감됩니다.",
              "1회 최대 충전 금액은 100만원이에요.",
              "충전은 즉시 처리되며 취소할 수 없어요.",
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
