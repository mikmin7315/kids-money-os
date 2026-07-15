import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  approved: "승인", declined: "거절", cancelled: "취소", reversed: "환불",
};
const STATUS_COLOR: Record<string, string> = {
  approved: "text-[var(--monari-done)]", declined: "text-[var(--monari-minus)]",
  cancelled: "text-[var(--monari-ink-muted)]", reversed: "text-[#2563eb]",
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

  if (cardIds.length > 0) {
    txQuery = txQuery.in("card_id", cardIds);
  }

  const { data: txs } = await txQuery;
  const txList = (txs ?? []).map((t) => ({
    ...t,
    child_name: cardMap[t.card_id] ?? "-",
  }));

  const childList = (cards ?? []).map((c) => {
    const child = Array.isArray(c.children) ? c.children[0] : c.children;
    return { id: c.child_id, name: String(child?.name ?? "-") };
  });
  const uniqueChildren = [...new Map(childList.map((c) => [c.id, c])).values()];

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="카드" title="카드 사용 내역" />

        {/* 아이 탭 필터 */}
        {uniqueChildren.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/cards/transactions"
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                !selectedChildId ? "bg-[var(--color-accent)] text-white" : "bg-[var(--monari-surface-soft)] text-[var(--color-text)]"
              }`}
            >
              전체
            </Link>
            {uniqueChildren.map((c) => (
              <Link
                key={c.id}
                href={`/cards/transactions?child=${c.id}`}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  selectedChildId === c.id ? "bg-[var(--color-accent)] text-white" : "bg-[var(--monari-surface-soft)] text-[var(--color-text)]"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {txList.length === 0 ? (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] px-5 py-12 text-center">
            <p className="text-sm text-[var(--color-muted)]">카드 사용 내역이 없어요.</p>
          </div>
        ) : (
          <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden divide-y divide-[var(--color-border)]">
            {txList.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{t.merchant_name || "가맹점 미상"}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {t.child_name} · {t.merchant_category} · {String(t.approved_at ?? "").slice(0, 10)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`tabular-nums text-sm font-bold ${STATUS_COLOR[t.status] ?? ""}`}>
                    {t.status === "approved" ? "-" : ""}{formatWon(Number(t.amount))}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">{STATUS_LABEL[t.status] ?? t.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Link href="/cards" className="text-sm font-bold text-[var(--color-accent)]">← 카드 관리로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
