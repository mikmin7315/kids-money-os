import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
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

  return (
    <MobileAppShell title="카드 관리" subtitle="아이 카드">
      <section className="monari-hero mb-6">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/75">카드 관리</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-white">
              {cardList.length > 0 ? `카드 ${cardList.length}장` : "등록된 카드 없음"}
            </h2>
          </div>
          <Link
            href="/cards/apply"
            className="flex items-center gap-1.5 rounded-[12px] bg-white/20 px-4 py-2.5 text-[13px] font-700 text-white transition active:scale-[0.97]"
          >
            <Plus size={14} /> 카드 신청
          </Link>
        </div>
      </section>

      {/* 신청 진행 중 */}
      {appList.length > 0 && cardList.length === 0 && (
        <div className="monari-card mb-4 p-5">
          <p className="text-[15px] font-700 text-[var(--monari-hero)]">카드 신청 접수 완료</p>
          <p className="mt-1 text-[13px] text-[var(--monari-ink-soft)]">발급 완료 후 여기에 카드 관리 화면이 나타나요.</p>
          <Link href="/cards/status" className="mt-3 inline-block text-[13px] font-700 text-[var(--monari-hero)]">
            신청 현황 보기 →
          </Link>
        </div>
      )}

      {appList.length > 0 && (
        <div className="mb-4">
          <Link
            href="/cards/status"
            className="monari-card flex items-center justify-between px-4 py-3.5 transition active:scale-[0.98]"
          >
            <span className="text-[14px] font-700 text-[var(--monari-ink)]">신청 현황 보기</span>
            <span className="text-[12px] font-700 text-[var(--monari-hero)]">→</span>
          </Link>
        </div>
      )}

      {/* 카드 목록 */}
      {cardList.length > 0 && (
        <section className="mb-4">
          <SectionTitle>내 카드</SectionTitle>
          <div className="mt-3 space-y-4">
            {cardList.map((card) => (
              <div key={card.id} className="monari-card overflow-hidden">
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-[16px] font-800 text-[var(--monari-ink)]">{card.child_name} 카드</p>
                      {card.last4 && (
                        <p className="mt-0.5 text-[12px] text-[var(--monari-ink-muted)]">**** **** **** {card.last4}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-700 ${statusStyle(card.status)}`}>
                      {statusLabel(card.status)}
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[12px] bg-[var(--monari-hero-lo)] p-3">
                      <p className="text-[11px] font-600 text-[var(--monari-hero)]/60">일 한도</p>
                      <p className="mt-1 text-[14px] font-700 text-[var(--monari-hero)]">{formatWon(card.daily_limit)}</p>
                    </div>
                    <div className="rounded-[12px] bg-[var(--monari-hero-lo)] p-3">
                      <p className="text-[11px] font-600 text-[var(--monari-hero)]/60">월 한도</p>
                      <p className="mt-1 text-[14px] font-700 text-[var(--monari-hero)]">{formatWon(card.monthly_limit)}</p>
                    </div>
                  </div>

                  <CardToggleForm cardId={card.id} isEnabled={card.is_enabled} />

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href={`/cards/${card.id}/limits`}
                      className="rounded-[10px] border border-[var(--monari-line)] py-2.5 text-center text-[12px] font-700 text-[var(--monari-ink-soft)] transition active:scale-[0.97]"
                    >
                      한도 변경
                    </Link>
                    <Link
                      href={`/cards/${card.id}/lost`}
                      className="rounded-[10px] border border-[#fee2e2] py-2.5 text-center text-[12px] font-700 text-[var(--monari-minus)] transition active:scale-[0.97]"
                    >
                      분실 신고
                    </Link>
                  </div>
                </div>
                <div className="border-t border-[var(--monari-line)]">
                  <Link
                    href="/cards/transactions"
                    className="flex min-h-12 items-center justify-between px-5 text-[13px] font-700 text-[var(--monari-hero)] transition active:scale-[0.98]"
                  >
                    카드 사용 내역 <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 빈 상태 */}
      {cardList.length === 0 && appList.length === 0 && (
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
    </MobileAppShell>
  );
}
