import Link from "next/link";
import { Download, Lock, Sparkles, Coins } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AgeGroup = "7-9" | "10-13" | "14-16";
type SpendBreakdownItem = { label: string; pct: number };
type PeerStatsRow = {
  avg_allowance: number | string;
  avg_savings_rate: number | string;
  avg_behavior_rate: number | string;
  spend_breakdown: unknown;
  sample_size: number;
};
type PeerStatsView = {
  avgAllowance: number;
  savingsRate: number;
  behaviorRate: number;
  spendBreakdown: SpendBreakdownItem[];
  sampleSize: number;
};

function getAgeGroup(birthYear?: number): AgeGroup {
  if (!birthYear) return "10-13";
  const age = new Date().getFullYear() - birthYear;
  if (age <= 9) return "7-9";
  if (age <= 13) return "10-13";
  return "14-16";
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const auth = await requireParentSession();
  const IS_PREMIUM = (auth.profile as { subscription_tier?: string } | null)?.subscription_tier === "plus";
  const { child: selectedChildId } = await searchParams;
  const [dashboard, bundle] = await Promise.all([getDashboardView(), getAppDataBundle()]);
  const allChildren = dashboard.children;
  const primary = selectedChildId
    ? (allChildren.find((c) => c.child.id === selectedChildId) ?? allChildren[0])
    : allChildren[0];

  const allowance = primary?.monthReport.totalAllowance ?? 0;
  const spend = primary?.monthReport.totalSpend ?? 0;
  const save = primary?.monthReport.totalSave ?? 0;
  const borrowed = primary?.monthReport.totalBorrowed ?? 0;
  const interest = primary?.monthReport.totalInterest ?? 0;
  const behRate = primary ? Math.round(primary.monthReport.behaviorSuccessRate) : 0;
  const saveRatio = Math.round((save / Math.max(allowance, 1)) * 100);
  const spendRatio = Math.round((spend / Math.max(allowance, 1)) * 100);
  const currentBalance = primary?.wallet.balance ?? 0;
  const currentRate = primary?.wallet.currentInterestRate ?? 0;

  const primaryChild = primary ? bundle.children.find((c) => c.id === primary.child.id) : null;
  const ageGroup = getAgeGroup(primaryChild?.birthYear);
  const peer = primary ? await getPeerStats(ageGroup) : null;

  const peerMaxAllowance = peer ? Math.max(allowance, peer.avgAllowance, 1) : 1;
  const peerAllowancePct = peer ? Math.round((peer.avgAllowance / peerMaxAllowance) * 100) : 0;
  const childAllowancePct = peer ? Math.round((allowance / peerMaxAllowance) * 100) : 0;
  const aheadOfPeer = peer ? allowance >= peer.avgAllowance : false;

  const month = new Date().getMonth() + 1;
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const daysLeft = daysInMonth - dayOfMonth;
  const projectedSaveRate = primary
    ? Math.round(((save + (allowance > 0 ? (save / Math.max(dayOfMonth, 1)) * daysLeft : 0)) / Math.max(allowance, 1)) * 100)
    : 0;

  // 금융 건강 점수 (저축률 35% + 행동달성률 40% + 이자 10% + 미리쓰기 없음 15%)
  const healthScore = primary
    ? Math.min(100, Math.round(saveRatio * 0.35 + behRate * 0.4 + (interest > 0 ? 10 : 0) + (borrowed === 0 ? 15 : 5)))
    : 0;
  const healthGrade = healthScore >= 90 ? "A+" : healthScore >= 80 ? "A" : healthScore >= 70 ? "B" : healthScore >= 60 ? "C" : "D";
  const healthMsg =
    healthScore >= 85 ? "금융 습관이 매우 우수해요 🏆" :
    healthScore >= 70 ? "전반적으로 잘 관리하고 있어요 👍" :
    healthScore >= 55 ? "조금 더 저축해 볼까요?" :
    "함께 습관을 만들어봐요";

  // 이번 달의 한 문장 (Spotify Wrapped 스타일)
  const childName = primary?.child.name ?? "아이";
  const monthSentence =
    saveRatio >= 30 && behRate >= 80
      ? `이번 달 ${childName}는 또래보다 더 꾸준히 모으는 아이였습니다.`
      : saveRatio >= 30
      ? `이번 달은 소비보다 저축을 선택한 한 달이었습니다.`
      : behRate >= 80
      ? `이번 달 ${childName}는 약속을 잘 지킨 한 달을 보냈습니다.`
      : `이번 달도 ${childName}와 함께 성장하는 한 달이었습니다.`;

  // 이자 시뮬레이션
  const simInterestRate = Math.min(currentRate + 2, 20);
  const actualMonthlyInterestEst = Math.round(currentBalance * currentRate / 100 / 12);
  const simMonthlyInterest = Math.round(currentBalance * simInterestRate / 100 / 12);
  const interestGap = simMonthlyInterest - actualMonthlyInterestEst;

  return (
    <AppNavShell>
      <PageHero>
        {primary ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60 mb-1">
              {String(primary.child.name)} · {month}월
            </p>
            <div className="mb-4 text-center">
              <p className="text-[11px] font-semibold text-white/60 mb-1">이달 저축률</p>
              <p className="text-[72px] font-black leading-none tracking-[-0.05em] text-white tabular-nums">
                {saveRatio}<span className="text-[28px] text-white/65">%</span>
              </p>
              <p className="mt-2 text-[13px] font-semibold text-white/60">
                {saveRatio >= 30 ? "훌륭한 저축 습관이에요" : saveRatio >= 15 ? "조금 더 모아볼까요?" : "저축을 시작해보세요"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 border-t border-white/15 pt-3">
              <HeroPill label="용돈" value={formatWon(allowance)} />
              <HeroPill label="지출" value={`${spendRatio}%`} sub={spendRatio > 70 ? "주의" : "양호"} warn={spendRatio > 70} />
              <HeroPill label="약속" value={`${behRate}%`} sub={behRate >= 80 ? "우수" : behRate >= 50 ? "보통" : "노력"} warn={behRate < 50} />
            </div>
          </>
        ) : (
          <h1 className="text-2xl font-extrabold text-white">이번 달 리포트</h1>
        )}
      </PageHero>
      <PageContent className="pt-4">
      {/* 아이 선택 */}
      {allChildren.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {allChildren.map((c) => (
            <Link
              key={c.child.id}
              href={`/reports?child=${c.child.id}`}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95 ${
                primary?.child.id === c.child.id
                  ? "bg-[var(--monari-hero)] text-white shadow-[0_2px_12px_rgba(0,85,179,0.35)]"
                  : "bg-[var(--monari-surface)] text-[var(--monari-ink-muted)] border border-[var(--monari-line)]"
              }`}
            >
              {String(c.child.name)}
            </Link>
          ))}
        </div>
      )}

      {!primary && (
        <div className="monari-card p-6 text-center">
          <p className="text-[15px] font-700 text-[var(--monari-ink)] mb-1">아이를 먼저 등록해주세요</p>
          <p className="text-[13px] text-[var(--monari-ink-muted)] mb-4">리포트를 보려면 아이 프로필이 필요합니다.</p>
          <Link href="/settings" className="monari-btn-primary px-5">아이 등록하기 →</Link>
        </div>
      )}

      {primary && (
        <>
          {/* 이번 달의 한 문장 (Spotify Wrapped 스타일) */}
          <div
            className="mb-5 rounded-[20px] px-5 py-5"
            style={{ background: "linear-gradient(135deg, #6d28d9 0%, #4F7FFF 100%)" }}
          >
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-white/50 mb-2">이번 달의 한 줄</p>
            <p className="text-[18px] font-black text-white leading-snug">{monthSentence}</p>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-[3px] w-8 rounded-full bg-white/60" />
              <div className="h-[3px] w-3 rounded-full bg-white/30" />
              <div className="h-[3px] w-2 rounded-full bg-white/20" />
            </div>
          </div>

          {/* 이달 예상 결과 카드 */}
          {daysLeft > 0 && allowance > 0 && (
            <div className="mb-5 overflow-hidden rounded-[20px]" style={{ border: "1px solid var(--monari-hero-lo)", background: "var(--monari-hero-lo)" }}>
              <div className="px-4 py-3.5">
                <p className="text-[11px] font-semibold text-[var(--monari-hero)] mb-2">📅 이달 예상 결과 · {daysLeft}일 남음</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-[12px] bg-white/70 px-3 py-2.5 text-center">
                    <p className="text-[10px] font-semibold text-[var(--monari-ink-muted)] mb-1">현재 저축률</p>
                    <p className="text-[16px] font-black text-[var(--monari-hero)] tabular-nums">{saveRatio}%</p>
                  </div>
                  <div className="rounded-[12px] bg-white/70 px-3 py-2.5 text-center">
                    <p className="text-[10px] font-semibold text-[var(--monari-ink-muted)] mb-1">예상 저축률</p>
                    <p className={`text-[16px] font-black tabular-nums ${projectedSaveRate >= 30 ? "text-[var(--monari-done)]" : "text-[var(--monari-ink)]"}`}>
                      {projectedSaveRate}%
                    </p>
                  </div>
                  <div className="rounded-[12px] bg-white/70 px-3 py-2.5 text-center">
                    <p className="text-[10px] font-semibold text-[var(--monari-ink-muted)] mb-1">약속 달성률</p>
                    <p className={`text-[16px] font-black tabular-nums ${behRate >= 80 ? "text-[var(--monari-done)]" : behRate >= 50 ? "text-amber-600" : "text-rose-500"}`}>
                      {behRate}%
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-[var(--monari-ink-muted)]">
                  {projectedSaveRate >= 30
                    ? "이대로라면 이달 저축 목표(30%)를 달성할 수 있어요 🎉"
                    : `저축률 30%까지 ${30 - projectedSaveRate}%p 남았어요. 함께 계획을 세워보세요.`}
                </p>
              </div>
            </div>
          )}

          {/* 금융 건강 점수 카드 */}
          {healthScore > 0 && (
            <div className="mb-5 rounded-[20px] overflow-hidden" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #4F7FFF 100%)" }}>
              <div className="px-5 py-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-bold text-white/60 mb-0.5 tracking-[0.06em] uppercase">금융 건강 점수</p>
                    <p className="text-[12px] text-white/50">저축 · 약속 · 이자 종합</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[52px] font-black leading-none tabular-nums text-white">{healthScore}</p>
                    <span className="inline-block rounded-lg bg-white/20 px-2.5 py-0.5 text-[13px] font-black text-white mt-1">{healthGrade}</span>
                  </div>
                </div>
                <div className="mb-2 h-2 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-2 rounded-full bg-white transition-all duration-700" style={{ width: `${healthScore}%` }} />
                </div>
                <p className="text-[13px] font-semibold text-white/80">{healthMsg}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-[10px] bg-white/15 px-2 py-2 text-center">
                    <p className="text-[10px] text-white/60 mb-0.5">저축률</p>
                    <p className="text-[14px] font-black text-white tabular-nums">{saveRatio}%</p>
                  </div>
                  <div className="rounded-[10px] bg-white/15 px-2 py-2 text-center">
                    <p className="text-[10px] text-white/60 mb-0.5">약속 달성</p>
                    <p className="text-[14px] font-black text-white tabular-nums">{behRate}%</p>
                  </div>
                  <div className="rounded-[10px] bg-white/15 px-2 py-2 text-center">
                    <p className="text-[10px] text-white/60 mb-0.5">이자</p>
                    <p className="text-[14px] font-black text-white tabular-nums">{interest > 0 ? formatWon(interest) : "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CSV 내보내기 */}
          <div className="mb-5">
            <Link
              href={`/api/reports/export?child=${primary.child.id}`}
              className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--monari-line)] bg-[var(--monari-surface)] py-2.5 text-[12px] font-bold text-[var(--monari-ink-soft)] transition active:scale-[0.97]"
            >
              <Download size={13} /> 이달 리포트 CSV 내보내기
            </Link>
          </div>

          {/* ═══ 저축 / 지출 2열 카드 ═══ */}
          <section className="mb-5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="monari-card p-4">
                <p className="monari-eyebrow mb-2">저축</p>
                <p className="text-[26px] font-900 tracking-[-0.03em] tabular-nums text-[var(--monari-done)] leading-tight">
                  {formatWon(save)}
                </p>
                <div className="mt-3 h-[3px] rounded-full bg-[var(--monari-done-bg)] overflow-hidden">
                  <div className="h-[3px] rounded-full bg-[var(--monari-done)]" style={{ width: `${saveRatio}%` }} />
                </div>
              </div>
              <div className="monari-card p-4">
                <p className="monari-eyebrow mb-2" style={{ color: "var(--monari-minus)" }}>지출</p>
                <p className="text-[26px] font-900 tracking-[-0.03em] tabular-nums text-[var(--monari-minus)] leading-tight">
                  {formatWon(spend)}
                </p>
                <div className="mt-3 h-[3px] rounded-full bg-[var(--monari-minus-bg)] overflow-hidden">
                  <div className="h-[3px] rounded-full bg-[var(--monari-minus)]" style={{ width: `${spendRatio}%` }} />
                </div>
              </div>
            </div>
            {borrowed > 0 && (
              <div className="monari-card mt-2.5 flex items-center gap-2.5 px-4 py-3">
                <Coins size={14} className="shrink-0 text-[var(--monari-pending)]" />
                <p className="text-[13px] font-600 text-[var(--monari-ink-soft)]">미리쓰기</p>
                <p className="ml-auto text-[14px] font-800 tabular-nums text-[var(--monari-pending)]">{formatWon(borrowed)}</p>
              </div>
            )}
          </section>

          {/* ═══ 통장 상태 — 단일 카드 3열 ═══ */}
          <section className="mb-5">
            <p className="monari-eyebrow mb-1">현황</p>
            <p className="text-[16px] font-800 text-[var(--monari-ink)] mb-3">지금 통장 상태</p>
            <div className="monari-card px-4 py-4 grid grid-cols-3 divide-x divide-[var(--monari-line)]">
              <div className="text-center pr-3">
                <p className="monari-eyebrow mb-1.5" style={{ fontSize: "10px" }}>잔액</p>
                <p className="text-[17px] font-900 tabular-nums text-[var(--monari-ink)] leading-tight">{formatWon(currentBalance)}</p>
              </div>
              <div className="text-center px-3">
                <p className="monari-eyebrow mb-1.5" style={{ fontSize: "10px" }}>이자율</p>
                <p className="text-[17px] font-900 tabular-nums text-[var(--monari-hero)] leading-tight">{currentRate}%</p>
              </div>
              <div className="text-center pl-3">
                <p className="monari-eyebrow mb-1.5" style={{ fontSize: "10px" }}>이달 이자</p>
                <p className={`text-[17px] font-900 tabular-nums leading-tight ${interest > 0 ? "text-[var(--monari-done)]" : "text-[var(--monari-ink-muted)]"}`}>
                  {interest > 0 ? `+${formatWon(interest)}` : "—"}
                </p>
              </div>
            </div>
            {interest > 0 && (
              <div className="mt-2 rounded-[12px] bg-[var(--monari-done-bg)] px-4 py-3">
                <p className="text-[12px] font-700 text-[var(--monari-done)]">
                  이번 달 이자 {formatWon(interest)}을 받았어요! 저금하면 이자가 쌓여요.
                </p>
              </div>
            )}
          </section>

          {/* 이자 시뮬레이션 — 플러스 */}
          {currentRate > 0 && behRate < 95 && (
            <section className="mb-5">
              <PremiumLockedCard
                isPremium={IS_PREMIUM}
                previewLabel="이자 시뮬레이션"
                hint={`약속 달성률을 높이면 이자가 월 +${formatWon(interestGap)} 늘어날 수 있어요`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center rounded-[12px] bg-[var(--monari-surface-soft)] px-4 py-3">
                    <span className="text-[12px] font-600 text-[var(--monari-ink-muted)]">현재 이자율 {currentRate}%</span>
                    <span className="text-[14px] font-800 tabular-nums text-[var(--monari-ink)]">월 {formatWon(actualMonthlyInterestEst)}</span>
                  </div>
                  <div className="flex justify-between items-center rounded-[12px] bg-[var(--monari-done-bg)] px-4 py-3">
                    <span className="text-[12px] font-700 text-[var(--monari-done)]">달성률 100% 달성 시 {simInterestRate}%</span>
                    <span className="text-[14px] font-800 tabular-nums text-[var(--monari-done)]">월 {formatWon(simMonthlyInterest)}</span>
                  </div>
                  <p className="text-[11px] text-center text-[var(--monari-ink-muted)]">매달 {formatWon(interestGap)} 더 받을 수 있어요</p>
                </div>
              </PremiumLockedCard>
            </section>
          )}

          {/* ═══ 또래 비교 ═══ */}
          <section className="mb-5">
            <p className="monari-eyebrow mb-1">또래 비교</p>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[16px] font-800 text-[var(--monari-ink)]">전국 또래 평균</p>
              <span className="rounded-full bg-[var(--monari-hero-lo)] px-2.5 py-0.5 text-[11px] font-800 text-[var(--monari-hero)]">
                {ageGroup}세
              </span>
            </div>

            {!peer ? (
              <div className="monari-card p-5 text-center">
                <p className="text-[14px] font-700 text-[var(--monari-ink)]">아직 비교 데이터가 부족해요</p>
                <p className="text-[12px] text-[var(--monari-ink-muted)] mt-1">같은 연령대 표본이 10명 이상 모이면 또래 통계를 보여드려요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 무료 — 용돈 바 차트 비교 */}
                <div className="monari-card p-5">
                  <p className="text-[13px] font-800 text-[var(--monari-ink)] mb-4">이달 용돈</p>
                  <div className="mb-3">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] font-600 text-[var(--monari-ink-muted)]">또래 평균</span>
                      <span className="text-[12px] font-800 tabular-nums text-[var(--monari-ink-muted)]">{formatWon(peer.avgAllowance)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--monari-surface-soft)] overflow-hidden">
                      <div className="h-2 rounded-full bg-[var(--monari-line-strong)]" style={{ width: `${peerAllowancePct}%` }} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] font-700 text-[var(--monari-hero)]">{String(primary.child.name)}</span>
                      <span className="text-[12px] font-800 tabular-nums text-[var(--monari-hero)]">{formatWon(allowance)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--monari-hero-lo)] overflow-hidden">
                      <div className="h-2 rounded-full bg-[var(--monari-hero)]" style={{ width: `${childAllowancePct}%` }} />
                    </div>
                  </div>
                  {allowance > 0 && (
                    <div className={`rounded-[10px] px-3 py-2 text-[12px] font-700 ${aheadOfPeer ? "bg-[var(--monari-done-bg)] text-[var(--monari-done)]" : "bg-[var(--monari-minus-bg)] text-[var(--monari-minus)]"}`}>
                      {aheadOfPeer
                        ? `또래보다 ${formatWon(allowance - peer.avgAllowance)} 더 받아요`
                        : `또래 평균보다 ${formatWon(peer.avgAllowance - allowance)} 적어요`}
                    </div>
                  )}
                  <p className="mt-2 text-right text-[10px] text-[var(--monari-ink-muted)]">익명 표본 {peer.sampleSize}명</p>
                </div>

                {/* 저축률 비교 — 플러스 */}
                <PremiumLockedCard
                  isPremium={IS_PREMIUM}
                  previewLabel="저축률 비교"
                  hint={saveRatio >= peer.savingsRate
                    ? `또래보다 ${saveRatio - Math.round(peer.savingsRate)}%p 더 저축하고 있어요`
                    : `또래 평균보다 ${Math.round(peer.savingsRate) - saveRatio}%p 낮아요`}
                >
                  <ComparisonBarPair
                    left={{ label: "또래 평균", value: peer.savingsRate }}
                    right={{ label: String(primary.child.name), value: saveRatio }}
                  />
                </PremiumLockedCard>

                {/* 약속 달성률 비교 — 플러스 */}
                <PremiumLockedCard
                  isPremium={IS_PREMIUM}
                  previewLabel="약속 달성률 비교"
                  hint={behRate >= peer.behaviorRate
                    ? `약속을 또래보다 잘 지키고 있어요`
                    : `또래 평균 달성률은 ${Math.round(peer.behaviorRate)}%예요`}
                >
                  <ComparisonBarPair
                    left={{ label: "또래 평균", value: peer.behaviorRate }}
                    right={{ label: String(primary.child.name), value: behRate }}
                  />
                </PremiumLockedCard>

                {/* 지출 카테고리 — 플러스 */}
                {peer.spendBreakdown.length > 0 && (
                  <PremiumLockedCard
                    isPremium={IS_PREMIUM}
                    previewLabel="또래 지출 카테고리 TOP 4"
                    hint={`${ageGroup}세 아이들이 가장 많이 쓰는 곳: ${peer.spendBreakdown[0].label}`}
                  >
                    <div className="space-y-2.5">
                      {peer.spendBreakdown.map((item, i) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-[11px] font-800 text-[var(--monari-ink-muted)] w-4 shrink-0">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-[12px] mb-1">
                              <span className="font-600 text-[var(--monari-ink-soft)]">{item.label}</span>
                              <span className="font-800 text-[var(--monari-ink)]">{item.pct}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[var(--monari-surface-soft)]">
                              <div className="h-2 rounded-full bg-[var(--monari-hero)]" style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PremiumLockedCard>
                )}
              </div>
            )}
          </section>

          {/* ═══ 코칭 포인트 ═══ */}
          <section className="mb-6">
            <p className="monari-eyebrow mb-1">코칭</p>
            <p className="text-[16px] font-800 text-[var(--monari-ink)] mb-3">이번달 포인트</p>
            <div className="space-y-2">
              <div className="monari-card-accent p-5">
                <p className="text-[14px] font-800 text-[var(--monari-ink)] mb-2">
                  {saveRatio >= 30
                    ? "저축 습관이 자리잡고 있어요"
                    : spendRatio >= 80
                      ? "소비 계획을 함께 점검해 보세요"
                      : "돈의 균형을 함께 살펴보세요"}
                </p>
                <p className="text-[13px] leading-[1.65] text-[var(--monari-ink-soft)]">
                  {saveRatio >= 30
                    ? `이번달 용돈의 ${saveRatio}%를 저축했어요. 저축 목표와 이자를 함께 이야기해 보세요.`
                    : spendRatio >= 80
                      ? `이번달 용돈의 ${spendRatio}%를 사용했어요. 다음 구매 전 필요한 것과 원하는 것을 나눠보면 좋아요.`
                      : "지출과 저축 기록을 보며 다음달에 유지할 습관 하나를 정해 보세요."}
                </p>
              </div>
              <div className="monari-card-ghost px-4 py-3.5">
                <p className="text-[13px] font-700 text-[var(--monari-ink)] mb-1">미리쓰기는 목적 중심으로</p>
                <p className="text-[12px] leading-[1.6] text-[var(--monari-ink-muted)]">
                  미리쓰기 이유를 아이가 직접 쓰게 하면 충동 구매보다 계획 소비로 전환하기 쉽습니다.
                </p>
              </div>
              {peer && (
                <div className="monari-card-ghost px-4 py-3.5">
                  <p className="text-[13px] font-700 text-[var(--monari-ink)] mb-1">💰 용돈 적정성 힌트</p>
                  <p className="text-[12px] leading-[1.6] text-[var(--monari-ink-muted)]">
                    {behRate >= 85 && allowance < peer.avgAllowance
                      ? `약속을 잘 지키는 만큼, 또래 평균(${formatWon(peer.avgAllowance)})에 맞춰 용돈을 조금 올리는 것도 좋은 동기부여가 돼요.`
                      : behRate >= 85
                      ? "약속도 잘 지키고 용돈도 적절해요. 저축 목표를 함께 만들어보세요."
                      : "약속 달성률이 높아지면 용돈 인상을 논의해보는 것도 훌륭한 동기부여 방법이에요."}
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
      </PageContent>
    </AppNavShell>
  );
}

async function getPeerStats(ageGroup: AgeGroup): Promise<PeerStatsView | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("peer_stats")
    .select("avg_allowance,avg_savings_rate,avg_behavior_rate,spend_breakdown,sample_size")
    .eq("age_group", ageGroup)
    .is("region", null)
    .gte("sample_size", 10)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as PeerStatsRow;
  const spendBreakdown = Array.isArray(row.spend_breakdown)
    ? row.spend_breakdown.filter(isSpendBreakdownItem).slice(0, 4)
    : [];
  return {
    avgAllowance: Number(row.avg_allowance ?? 0),
    savingsRate: Number(row.avg_savings_rate ?? 0),
    behaviorRate: Number(row.avg_behavior_rate ?? 0),
    spendBreakdown,
    sampleSize: Number(row.sample_size ?? 0),
  };
}

function isSpendBreakdownItem(value: unknown): value is SpendBreakdownItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.label === "string" && typeof item.pct === "number";
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

function HeroPill({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-white/10 border border-white/15 px-2 py-3 gap-1">
      <p className="text-[10px] font-600 text-white/55">{label}</p>
      <p className="text-[16px] font-900 text-white leading-none tabular-nums">{value}</p>
      {sub && <p className={`text-[9px] font-700 ${warn ? "text-rose-300" : "text-sky-300"}`}>{sub}</p>}
    </div>
  );
}


function ComparisonBarPair({
  left,
  right,
}: {
  left: { label: string; value: number };
  right: { label: string; value: number };
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-[12px] mb-1.5">
          <span className="font-600 text-[var(--monari-ink-soft)]">{left.label}</span>
          <span className="font-800 tabular-nums text-[var(--monari-ink-muted)]">{left.value.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--monari-surface-soft)]">
          <div className="h-2 rounded-full bg-[var(--monari-line-strong)]" style={{ width: `${Math.min(left.value, 100)}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[12px] mb-1.5">
          <span className="font-700 text-[var(--monari-hero)]">{right.label}</span>
          <span className="font-800 tabular-nums text-[var(--monari-hero)]">{right.value.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--monari-hero-lo)]">
          <div className="h-2 rounded-full bg-[var(--monari-hero)]" style={{ width: `${Math.min(right.value, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function PremiumLockedCard({
  isPremium,
  previewLabel,
  hint,
  children,
}: {
  isPremium: boolean;
  previewLabel: string;
  hint: string;
  children: React.ReactNode;
}) {
  if (isPremium) {
    return (
      <div className="monari-card p-5">
        <p className="text-[14px] font-800 text-[var(--monari-ink)] mb-4">{previewLabel}</p>
        {children}
      </div>
    );
  }

  return (
    <div className="relative rounded-[20px] overflow-hidden" style={{ border: "1px solid var(--monari-line)" }}>
      <div className="p-5" style={{ background: "var(--monari-surface)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-800 text-[var(--monari-ink)]">{previewLabel}</p>
          <span className="flex items-center gap-1 rounded-full bg-[var(--monari-hero-lo)] px-2.5 py-1 text-[10px] font-800 text-[var(--monari-hero)]">
            <Sparkles size={9} strokeWidth={3} /> 플러스
          </span>
        </div>
        <p className="text-[12px] font-600 text-[var(--monari-ink-muted)] mb-4 leading-5">
          💡 {hint}
        </p>
        <div className="pointer-events-none select-none" style={{ opacity: 0.35 }}>
          {children}
        </div>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-5 pt-16"
        style={{ background: "linear-gradient(to top, var(--monari-surface) 60%, transparent)" }}
      >
        <Link
          href="/settings/subscription"
          className="flex items-center gap-2 rounded-[14px] bg-[var(--monari-hero)] px-6 py-3 text-[13px] font-800 text-white shadow-[0_4px_20px_rgba(109,40,217,0.4)] transition active:scale-[0.97]"
        >
          <Lock size={12} strokeWidth={3} />
          전체 보기 — 모나리 플러스
        </Link>
      </div>
    </div>
  );
}

