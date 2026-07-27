import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  approved: "승인", declined: "거절", cancelled: "취소", reversed: "환불",
};
const STATUS_COLOR: Record<string, string> = {
  approved: "text-[var(--monari-done)]",
  declined: "text-[var(--monari-minus)]",
  cancelled: "text-[var(--monari-ink-muted)]",
  reversed: "text-blue-600",
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
    .limit(50);

  if (cardIds.length > 0) txQuery = txQuery.in("card_id", cardIds);

  const { data: txs } = await txQuery;
  const txList = (txs ?? []).map((t) => ({ ...t, child_name: cardMap[t.card_id] ?? "-" }));

  const childList = (cards ?? []).map((c) => {
    const child = Array.isArray(c.children) ? c.children[0] : c.children;
    return { id: c.child_id, name: String(child?.name ?? "-") };
  });
  const uniqueChildren = [...new Map(childList.map((c) => [c.id, c])).values()];

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/cards" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 카드 관리로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">카드</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">카드 사용 내역</h1>
        <p className="text-[13px] text-white/65">최근 50건</p>
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

        <section className="mb-6">
          <SectionTitle>내역</SectionTitle>
          {txList.length === 0 ? (
            <div className="mt-3 monari-card px-5 py-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
                <CreditCard size={26} />
              </span>
              <p className="mt-4 text-[15px] font-800 text-[var(--monari-ink)]">카드 사용 내역이 없어요</p>
            </div>
          ) : (
            <div className="mt-3 monari-card divide-y divide-[var(--monari-line)]">
              {txList.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[var(--monari-ink)] truncate">
                      {t.merchant_name || "가맹점 미상"}
                    </p>
                    <p className="text-[11px] text-[var(--monari-ink-muted)] mt-0.5">
                      {t.child_name} · {t.merchant_category} · {String(t.approved_at ?? "").slice(0, 10)}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className={`tabular-nums text-[14px] font-bold ${STATUS_COLOR[t.status] ?? ""}`}>
                      {t.status === "approved" ? "-" : ""}{formatWon(Number(t.amount))}
                    </p>
                    <p className="text-[11px] text-[var(--monari-ink-muted)]">{STATUS_LABEL[t.status] ?? t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageContent>
    </AppNavShell>
  );
}
