import Link from "next/link";
import { ChevronRight, CreditCard, Plus, Receipt } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { CardToggleForm } from "@/components/cards/card-toggle-form";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

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

  const statusLabel = (s: string) =>
    s === "active" ? "정상" : s === "frozen" ? "일시정지" : s === "lost" ? "분실신고" : s;
  const statusStyle = (s: string) =>
    s === "active"
      ? "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]"
      : s === "frozen"
      ? "bg-[var(--status-info-solid)] text-[var(--status-info-solid-text)]"
      : s === "lost"
      ? "bg-[var(--status-danger-solid)] text-[var(--status-danger-solid-text)]"
      : "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]";

  const hasCards = cardList.length > 0;
  const hasApps = appList.length > 0;

  return (
    <AppNavShell>
      <PageHero>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">금융</p>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {hasCards ? `카드 ${cardList.length}장` : "카드 관리"}
            </h1>
            <p className="mt-0.5 text-[13px] text-white/65">아이 카드를 관리하세요</p>
          </div>
          <Link
            href="/cards/apply"
            className="flex shrink-0 items-center gap-1.5 rounded-[12px] bg-white/20 px-4 py-2.5 text-[13px] font-bold text-white transition active:scale-[0.97]"
          >
            <Plus size={14} /> 카드 신청
          </Link>
        </div>

        {/* 신청 중 배지 */}
        {hasApps && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white">
              신청 심사 중 {appList.length}건
            </span>
          </div>
        )}
      </PageHero>

      <PageContent className="pt-5">

        {/* ① 신청 현황 — 카드가 있든 없든 신청 건이 있으면 단일 섹션으로 표시 */}
        {hasApps && (
          <section className="mb-5">
            <SectionTitle>신청 현황</SectionTitle>
            <Link
              href="/cards/status"
              className="mt-3 monari-card flex items-center justify-between px-4 py-4 transition active:scale-[0.98]"
            >
              <div>
                <p className="text-[14px] font-700 text-[var(--monari-ink)]">심사 진행 중 {appList.length}건</p>
                <p className="mt-0.5 text-[12px] text-[var(--monari-ink-muted)]">발급 완료 후 여기에 카드 관리 화면이 나타나요</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-[var(--monari-ink-muted)]" />
            </Link>
          </section>
        )}

        {/* ② 카드 목록 */}
        {hasCards && (
          <section className="mb-4">
            <SectionTitle>내 카드</SectionTitle>
            <div className="mt-3 space-y-4">
              {cardList.map((card) => (
                <div key={card.id} className="monari-card overflow-hidden">
                  {/* 카드 헤더 */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-[16px] font-800 text-[var(--monari-ink)]">{card.child_name} 카드</p>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-700 ${statusStyle(card.status)}`}>
                        {statusLabel(card.status)}
                      </span>
                    </div>
                    {card.last4 && (
                      <p className="text-[12px] text-[var(--monari-ink-muted)] mb-4">**** **** **** {card.last4}</p>
                    )}

                    {/* 한도 */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-[12px] bg-[var(--monari-hero-lo)] p-3">
                        <p className="text-[11px] font-600 text-[var(--monari-hero)]/60">일 한도</p>
                        <p className="mt-1 text-[14px] font-700 text-[var(--monari-hero)]">{formatWon(card.daily_limit)}</p>
                      </div>
                      <div className="rounded-[12px] bg-[var(--monari-hero-lo)] p-3">
                        <p className="text-[11px] font-600 text-[var(--monari-hero)]/60">월 한도</p>
                        <p className="mt-1 text-[14px] font-700 text-[var(--monari-hero)]">{formatWon(card.monthly_limit)}</p>
                      </div>
                    </div>

                    {/* 사용 내역 — 주 CTA */}
                    <Link
                      href="/cards/transactions"
                      className="mb-3 flex items-center justify-between rounded-[14px] bg-[var(--monari-hero)] px-4 py-3 transition active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2 text-white">
                        <Receipt size={15} aria-hidden="true" />
                        <span className="text-[14px] font-700">카드 사용 내역</span>
                      </div>
                      <ChevronRight size={15} className="text-white/70" />
                    </Link>

                    {/* 보조 액션 */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cards/${card.id}/limits`}
                        className="flex-1 rounded-[10px] border border-[var(--monari-line)] py-2.5 text-center text-[12px] font-700 text-[var(--monari-ink-soft)] transition active:scale-[0.97]"
                      >
                        한도 변경
                      </Link>
                      <div className="flex-1">
                        <CardToggleForm cardId={card.id} isEnabled={card.is_enabled} />
                      </div>
                    </div>
                  </div>

                  {/* 분실 신고 — 위험 액션, 하단 구분선 뒤로 격하 */}
                  <div className="border-t border-[var(--monari-line)] px-5 py-3">
                    <Link
                      href={`/cards/${card.id}/lost`}
                      className="text-[12px] font-600 text-[var(--monari-minus)] transition hover:opacity-80"
                    >
                      분실 신고
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ③ 빈 상태 */}
        {!hasCards && !hasApps && (
          <div className="monari-card px-5 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
              <CreditCard size={26} />
            </span>
            <p className="mt-4 text-[16px] font-800 text-[var(--monari-ink)]">아직 카드가 없어요</p>
            <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">아이를 위한 체크카드를 신청해보세요.</p>
            <Link
              href="/cards/apply"
              className="mt-5 inline-flex items-center gap-1.5 rounded-[14px] bg-[var(--monari-hero)] px-6 py-3 text-[14px] font-700 text-white"
            >
              <Plus size={15} /> 카드 신청하기
            </Link>
          </div>
        )}

      </PageContent>
    </AppNavShell>
  );
}
