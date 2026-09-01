import Link from "next/link";
import { ArrowLeft, BookOpen, Bus, CreditCard, Gamepad2, Heart, HelpCircle, Pill, ShoppingBag, ShoppingCart, Store, Utensils } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { CardSyncButton } from "@/components/cards/card-sync-button";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  recharge:          { label: "모나리 충전",     icon: <CreditCard size={13} />,  color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" },
  convenience:      { label: "편의점",          icon: <Store size={13} />,       color: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" },
  convenience_top_up: { label: "편의점 충전",   icon: <Store size={13} />,       color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" },
  food:             { label: "음식·식당",        icon: <Utensils size={13} />,    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400" },
  education:        { label: "교육",             icon: <BookOpen size={13} />,    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" },
  transport:        { label: "교통",             icon: <Bus size={13} />,         color: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400" },
  entertainment:    { label: "엔터테인먼트",     icon: <Gamepad2 size={13} />,    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" },
  shopping:         { label: "쇼핑",             icon: <ShoppingBag size={13} />, color: "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400" },
  mart:             { label: "마트·슈퍼",        icon: <ShoppingCart size={13} />,color: "bg-lime-100 text-lime-600 dark:bg-lime-900/40 dark:text-lime-400" },
  pharmacy:         { label: "약국",             icon: <Pill size={13} />,        color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" },
  medical:          { label: "의료",             icon: <Heart size={13} />,       color: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400" },
};

const DEFAULT_META = { label: "기타",     icon: <HelpCircle size={13} />,  color: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]" };

const STATUS_LABEL: Record<string, string> = {
  approved: "승인", declined: "거절", cancelled: "취소", reversed: "환불",
};

export default async function CardTransactionsPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const { child: selectedChildId } = await searchParams;
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: cards } = await supabase
    .from("child_cards")
    .select("id, child_id, children(name)")
    .eq("parent_id", auth.user!.id);

  const cardMap = (cards ?? []).reduce<Record<string, string>>((acc, c) => {
    const child = Array.isArray(c.children) ? c.children[0] : c.children;
    acc[c.id] = String(child?.name ?? "-");
    return acc;
  }, {});

  const cardIds = selectedChildId
    ? (cards ?? []).filter((c) => c.child_id === selectedChildId).map((c) => c.id)
    : (cards ?? []).map((c) => c.id);

  let txQuery = supabase
    .from("card_transactions")
    .select("id, card_id, merchant_name, merchant_category, amount, status, approved_at")
    .order("approved_at", { ascending: false })
    .limit(100);

  if (cardIds.length > 0) txQuery = txQuery.in("card_id", cardIds);

  const { data: txs } = await txQuery;
  const txList = (txs ?? []).map((t) => ({ ...t, child_name: cardMap[t.card_id] ?? "-" }));

  const childList = (cards ?? []).map((c) => {
    const child = Array.isArray(c.children) ? c.children[0] : c.children;
    return { id: c.child_id, name: String(child?.name ?? "-") };
  });
  const uniqueChildren = [...new Map(childList.map((c) => [c.id, c])).values()];

  // 월별 그룹
  const groups: Record<string, typeof txList> = {};
  for (const t of txList) {
    const key = String(t.approved_at ?? "").slice(0, 7); // YYYY-MM
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/cards" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 카드 관리로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">카드</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">카드 사용 내역</h1>
        <p className="text-[13px] text-white/65">최근 100건</p>

        {/* 카드별 동기화 버튼 */}
        {(cards ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(cards ?? []).map((c) => {
              const child = Array.isArray(c.children) ? c.children[0] : c.children;
              return (
                <CardSyncButton
                  key={c.id}
                  cardId={c.id}
                  childName={String(child?.name ?? "-")}
                />
              );
            })}
          </div>
        )}
      </PageHero>

      <PageContent className="pt-5">
        {/* 아이 탭 필터 */}
        {uniqueChildren.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/cards/transactions"
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold transition ${
                !selectedChildId
                  ? "bg-[var(--monari-hero)] text-white"
                  : "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"
              }`}
            >
              전체
            </Link>
            {uniqueChildren.map((c) => (
              <Link
                key={c.id}
                href={`/cards/transactions?child=${c.id}`}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold transition ${
                  selectedChildId === c.id
                    ? "bg-[var(--monari-hero)] text-white"
                    : "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {txList.length === 0 ? (
          <div className="monari-card px-5 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
              <CreditCard size={26} />
            </span>
            <p className="mt-4 text-[15px] font-extrabold text-[var(--monari-ink)]">카드 사용 내역이 없어요</p>
            <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">카드 결제 시 여기에 내역이 표시돼요</p>
          </div>
        ) : (
          Object.entries(groups).map(([month, items]) => (
            <section key={month} className="mb-5">
              <SectionTitle>{month.replace("-", "년 ")}월</SectionTitle>
              <div className="mt-2 monari-card divide-y divide-[var(--monari-line)]">
                {items.map((t) => {
                  const isCredit = t.merchant_category === "recharge" || t.merchant_category === "convenience_top_up";
                  const meta = CATEGORY_META[t.merchant_category] ?? DEFAULT_META;
                  const amountNum = Number(t.amount);

                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                      {/* 카테고리 아이콘 */}
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${meta.color}`}>
                        {meta.icon}
                      </span>

                      {/* 정보 */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[var(--monari-ink)] truncate">
                          {t.merchant_name || meta.label}
                        </p>
                        <p className="text-[11px] text-[var(--monari-ink-muted)] mt-0.5">
                          {t.child_name} · {meta.label} · {String(t.approved_at ?? "").slice(0, 10)}
                        </p>
                      </div>

                      {/* 금액 */}
                      <div className="ml-1 shrink-0 text-right">
                        <p className={`tabular-nums text-[14px] font-bold ${
                          isCredit
                            ? "text-[var(--monari-done)]"
                            : t.status === "cancelled" || t.status === "reversed"
                            ? "text-[var(--monari-ink-muted)] line-through"
                            : "text-[var(--monari-ink)]"
                        }`}>
                          {isCredit ? "+" : t.status === "approved" ? "-" : ""}{formatWon(amountNum)}
                        </p>
                        <p className="text-[11px] text-[var(--monari-ink-muted)]">
                          {isCredit ? "충전" : (STATUS_LABEL[t.status] ?? t.status)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </PageContent>
    </AppNavShell>
  );
}
