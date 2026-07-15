import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { getChildModeContext } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ChildCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getChildModeContext();
  if (ctx.childId !== id) {
    const { redirect } = await import("next/navigation");
    redirect(`/child/${ctx.childId}/card`);
  }
  const supabase = await getSupabaseServerClient();

  const { data: cards } = await supabase
    .from("child_cards")
    .select("id, status, is_enabled, daily_limit, monthly_limit, last4")
    .eq("child_id", id)
    .not("status", "in", '("cancelled")')
    .limit(1);

  const card = cards?.[0] ?? null;

  const { data: txs } = card
    ? await supabase
        .from("card_transactions")
        .select("id, merchant_name, amount, status, approved_at")
        .eq("card_id", card.id)
        .order("approved_at", { ascending: false })
        .limit(10)
    : { data: [] };

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="내 카드" title="카드 사용 내역" />

        {!card ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p style={{ fontSize: 48, marginBottom: 12 }}>💳</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">아직 카드가 없어요</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">부모님께 카드 신청을 부탁해보세요!</p>
          </div>
        ) : (
          <>
            {/* 카드 상태 */}
            <div className={`mb-5 rounded-[24px] p-5 ${card.is_enabled && card.status === "active" ? "bg-gradient-to-br from-[#7c3aed] to-[#4f46e5]" : "bg-[#6b7280]"}`}>
              <p className="text-[11px] font-bold text-white/70">Monari 체크카드</p>
              {card.last4 && <p className="mt-2 font-mono text-sm text-white">**** **** **** {card.last4}</p>}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-white/70">일 한도</p>
                  <p className="text-sm font-bold text-white">{formatWon(Number(card.daily_limit))}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  card.status === "active" && card.is_enabled ? "bg-white/20 text-white" :
                  card.status === "lost" ? "bg-red-500/80 text-white" :
                  "bg-white/10 text-white/70"
                }`}>
                  {card.status === "active" && card.is_enabled ? "사용 가능" :
                   card.status === "lost" ? "분실 신고됨" :
                   "일시 정지"}
                </span>
              </div>
            </div>

            {/* 최근 내역 */}
            <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">최근 사용</p>
            {(txs ?? []).length === 0 ? (
              <div className="rounded-[16px] bg-[var(--monari-surface-soft)] py-8 text-center text-sm text-[var(--color-muted)]">
                아직 사용 내역이 없어요.
              </div>
            ) : (
              <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden divide-y divide-[var(--color-border)]">
                {(txs ?? []).map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{t.merchant_name || "가맹점"}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">{String(t.approved_at ?? "").slice(0, 10)}</p>
                    </div>
                    <p className={`tabular-nums text-sm font-bold ${t.status === "approved" ? "text-[var(--monari-minus)]" : "text-[var(--monari-ink-muted)]"}`}>
                      {t.status === "approved" ? "-" : ""}{formatWon(Number(t.amount))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-5">
          <Link href={`/child/${id}`} className="text-sm font-bold text-[var(--color-accent)]">← 홈으로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
