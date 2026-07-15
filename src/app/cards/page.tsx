import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";
import { CardToggleForm } from "@/components/cards/card-toggle-form";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: cards } = await supabase
    .from("child_cards")
    .select("id, status, is_enabled, daily_limit, monthly_limit, last4, issued_at, child_id, children(name)")
    .eq("parent_id", auth.user!.id)
    .not("status", "in", '("cancelled")')
    .order("issued_at", { ascending: false });

  const { data: apps } = await supabase
    .from("card_applications")
    .select("id, status, child_id, created_at, children(name)")
    .eq("parent_id", auth.user!.id)
    .not("status", "in", '("cancelled","rejected")')
    .order("created_at", { ascending: false });

  const cardList = (cards ?? []).map((c) => {
    const child = Array.isArray(c.children) ? c.children[0] : c.children;
    return { ...c, child_name: String(child?.name ?? "-") };
  });

  const appList = (apps ?? []).map((a) => {
    const child = Array.isArray(a.children) ? a.children[0] : a.children;
    return { ...a, child_name: String(child?.name ?? "-") };
  });

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="카드" title="아이 카드 관리" />

        <div className="mb-4 flex gap-2">
          <Link
            href="/cards/apply"
            className="flex-1 rounded-[12px] bg-[var(--color-accent)] py-2.5 text-center text-sm font-bold text-white"
          >
            + 카드 신청
          </Link>
          {appList.length > 0 && (
            <Link
              href="/cards/status"
              className="flex-1 rounded-[12px] border border-[var(--color-accent)] py-2.5 text-center text-sm font-bold text-[var(--color-accent)]"
            >
              신청 현황
            </Link>
          )}
        </div>

        {/* 신청 대기 중 */}
        {appList.length > 0 && cardList.length === 0 && (
          <div className="mb-4 rounded-[16px] bg-[var(--monari-hero-lo)] p-4">
            <p className="text-sm font-bold text-[var(--monari-hero)]">카드 신청 접수 완료</p>
            <p className="mt-1 text-xs text-[var(--monari-ink-soft)]">발급 완료 후 여기에 카드 관리 화면이 나타나요.</p>
            <Link href="/cards/status" className="mt-2 inline-block text-xs font-bold text-[var(--monari-hero)]">
              신청 현황 보기 →
            </Link>
          </div>
        )}

        {/* 카드 목록 */}
        {cardList.map((card) => (
          <div key={card.id} className="mb-4 rounded-[16px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-extrabold text-[var(--color-text)]">{card.child_name} 카드</p>
                {card.last4 && <p className="text-[11px] text-[var(--color-muted)]">**** **** **** {card.last4}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  card.status === "active" ? "bg-[#d1fae5] text-[#065f46]" :
                  card.status === "frozen" ? "bg-[#dbeafe] text-[#1e40af]" :
                  card.status === "lost" ? "bg-[#fee2e2] text-[#991b1b]" :
                  "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"
                }`}>
                  {card.status === "active" ? "정상" : card.status === "frozen" ? "일시정지" : card.status === "lost" ? "분실신고" : card.status}
                </span>
              </div>
            </div>

            {/* 일/월 한도 */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-[10px] bg-[var(--monari-surface-soft)] p-3">
                <p className="text-[10px] font-semibold text-[var(--color-muted)]">일 한도</p>
                <p className="mt-1 text-sm font-bold">{formatWon(card.daily_limit)}</p>
              </div>
              <div className="rounded-[10px] bg-[var(--monari-surface-soft)] p-3">
                <p className="text-[10px] font-semibold text-[var(--color-muted)]">월 한도</p>
                <p className="mt-1 text-sm font-bold">{formatWon(card.monthly_limit)}</p>
              </div>
            </div>

            {/* 카드 ON/OFF */}
            <CardToggleForm cardId={card.id} isEnabled={card.is_enabled} />

            <div className="mt-3 flex gap-2">
              <Link
                href={`/cards/${card.id}/limits`}
                className="flex-1 rounded-[10px] border border-[var(--color-border)] py-2 text-center text-xs font-bold text-[var(--color-text)]"
              >
                한도 변경
              </Link>
              <Link
                href={`/cards/${card.id}/lost`}
                className="flex-1 rounded-[10px] border border-[#fee2e2] py-2 text-center text-xs font-bold text-[#dc2626]"
              >
                분실 신고
              </Link>
            </div>

            <div className="mt-2">
              <Link
                href="/cards/transactions"
                className="block rounded-[10px] bg-[var(--monari-surface-soft)] py-2 text-center text-xs font-bold text-[var(--color-text)]"
              >
                카드 사용 내역 →
              </Link>
            </div>
          </div>
        ))}

        {cardList.length === 0 && appList.length === 0 && (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] px-5 py-12 text-center">
            <p style={{ fontSize: 36, marginBottom: 8 }}>💳</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">아직 카드가 없어요.</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">아이를 위한 체크카드를 신청해보세요.</p>
            <Link href="/cards/apply" className="mt-3 inline-block rounded-[12px] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white">
              카드 신청하기
            </Link>
          </div>
        )}

        <div className="mt-4">
          <Link href="/" className="text-sm font-bold text-[var(--color-accent)]">← 홈으로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
