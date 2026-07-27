import Link from "next/link";
import { Download, Lock, Sparkles, Coins, MessageCircle, Target, Trophy } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";
import { computeMonthlyReport } from "@/lib/finance";
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

type PersonalityType = {
  emoji: string;
  label: string;
  color: string;
  bg: string;
  desc: string;
};

function getPersonalityType(saveRatio: number, spendRatio: number, behRate: number): PersonalityType {
  if (saveRatio >= 40 && behRate >= 70)
    return { emoji: "🏆", label: "저축왕", color: "#36C275", bg: "#dcfce7", desc: "용돈을 아껴 꾸준히 모으는 재테크형이에요. 저축이 자연스러운 습관이 됐어요." };
  if (saveRatio >= 25 && behRate >= 70)
    return { emoji: "⭐", label: "균형형", color: "#4F7FFF", bg: "#eff6ff", desc: "저축과 소비를 균형있게 관리하는 안정형이에요. 약속도 잘 지켜요." };
  if (behRate >= 80)
    return { emoji: "✨", label: "약속왕", color: "#8b5cf6", bg: "#f5f3ff", desc: "약속을 잘 지키는 성실형이에요. 저축 목표를 정하면 금방 달라질 거예요." };
  if (spendRatio >= 75)
    return { emoji: "🌊", label: "소비형", color: "#FFAA33", bg: "#fff7ed", desc: "소비가 활발한 편이에요. '필요한가?' 한 번 더 생각하는 연습이 도움돼요." };
  return { emoji: "🌱", label: "성장형", color: "#64748b", bg: "#f8fafc", desc: "금융 습관을 만들어가는 중이에요. 작은 목표부터 함께 시작해봐요." };
}

// 건강점수 백분위 추정 (간단한 분포 모델)
function estimatePercentile(score: number): number {
  if (score >= 90) return 94;
  if (score >= 85) return 85;
  if (score >= 80) return 73;
  if (score >= 70) return 58;
  if (score >= 60) return 42;
  if (score >= 50) return 28;
  return 15;
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
  const healthPercentile = estimatePercentile(healthScore);
  const healthMsg =
    healthScore >= 85 ? "금융 습관이 매우 우수해요 🏆" :
    healthScore >= 70 ? "전반적으로 잘 관리하고 있어요 👍" :
    healthScore >= 55 ? "조금 더 저축해 볼까요?" :
    "함께 습관을 만들어봐요";

  // 소비성향 유형
  const personality = primary ? getPersonalityType(saveRatio, spendRatio, behRate) : null;

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

  // 6개월 트렌드 계산 (3개월 → 6개월로 확장)
  const trendMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getMonth() + 1}월` };
  });
  const trendData = primary
    ? trendMonths.map(({ year, month: m, label }) => {
        const r = computeMonthlyReport(primary.child.id, year, m, bundle.moneyTransactions, bundle.behaviorLogs);
        const sr = r.totalAllowance > 0 ? Math.round((r.totalSave / r.totalAllowance) * 100) : 0;
        return { label, saveRate: sr, behRate: Math.round(r.behaviorSuccessRate) };
      })
    : [];

  // 이자 시뮬레이션
  const simInterestRate = Math.min(currentRate + 2, 20);
  const actualMonthlyInterestEst = Math.round(currentBalance * currentRate / 100 / 12);
  const simMonthlyInterest = Math.round(currentBalance * simInterestRate / 100 / 12);
  const interestGap = simMonthlyInterest - actualMonthlyInterestEst;

  // 미래 예측 — 현재 나이에서 12세까지 저축액 추정
  const currentAge = primaryChild?.birthYear ? today.getFullYear() - primaryChild.birthYear : null;
  const monthsTo12 = currentAge !== null && currentAge < 12 ? (12 - currentAge) * 12 : null;
  const projectedAt12 = monthsTo12 !== null && save > 0 ? Math.round(currentBalance + save * monthsTo12) : null;
  const projectedAt15 = currentAge !== null && currentAge < 15 && save > 0
    ? Math.round(currentBalance + save * ((15 - (currentAge ?? 10)) * 12))
    : null;

  // AI 용돈 추천
  const allowanceRec: { action: string; reason: string; delta?: number } | null = peer ? (() => {
    const diff = allowance - peer.avgAllowance;
    const pct = Math.abs(diff) / Math.max(peer.avgAllowance, 1);
    if (behRate >= 80 && diff < -peer.avgAllowance * 0.15)
      return { action: "인상 고려", reason: `약속을 잘 지키는 만큼, 또래 평균보다 ${Math.round(pct * 100)}% 낮아요`, delta: Math.round(-diff * 0.5 / 1000) * 1000 };
    if (behRate >= 80 && diff >= 0)
      return { action: "적정 수준", reason: `또래 평균 이상이고 약속도 잘 지켜요. 저축 목표를 다음 목표로 삼아보세요.` };
    if (behRate < 50 && diff > peer.avgAllowance * 0.1)
      return { action: "유지 권장", reason: `약속 달성률을 먼저 높여보세요. 달성률 개선 후 용돈 조정을 논의해보세요.` };
    return { action: "현행 유지", reason: `또래와 비슷한 수준이에요. 달성률에 따라 조정 여부를 논의해보세요.` };
  })() : null;

  // 부모 코칭 3단계
  const praisePoint =
    saveRatio >= 30 ? `이번 달 용돈의 ${saveRatio}%를 저축했어요` :
    behRate >= 80 ? `약속을 ${behRate}%나 지켜냈어요` :
    interest > 0 ? `이자 ${formatWon(interest)}을 받았어요` :
    `용돈 관리를 꾸준히 기록하고 있어요`;

  const questionToAsk =
    saveRatio >= 30 ? `"이번 달 모은 돈으로 무얼 하고 싶어?"` :
    spendRatio >= 80 ? `"이번 달 쓴 것 중에 지금 돌아보면 필요 없었던 게 있어?"` :
    behRate < 50 ? `"이번 달 약속이 어려웠던 이유가 있어? 다음 달엔 어떻게 해볼까?"` :
    `"다음 달엔 어떤 걸 목표로 해볼까?"`;

  const nextMonthMission =
    saveRatio < 15 ? "저축 목표 20% 달성해보기" :
    behRate < 60 ? "약속 달성률 70% 이상 도전" :
    borrowed > 0 ? "미리쓰기 없이 한 달 버텨보기" :
    saveRatio < 30 ? `저축률 ${Math.min(saveRatio + 10, 40)}% 도전` :
    "지금 이 좋은 습관 한 달 더 유지하기";

  return (
    <AppNavShell>
      <PageHero>
        {primary ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60 mb-1">
              {String(primary.child.name)} · {month}월 리포트
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
          <p className="text-[15px] font-bold text-[var(--monari-ink)] mb-1">아이를 먼저 등록해주세요</p>
          <p className="text-[13px] text-[var(--monari-ink-muted)] mb-4">리포트를 보려면 아이 프로필이 필요합니다.</p>
          <Link href="/settings" className="monari-btn-primary px-5">아이 등록하기 →</Link>
        </div>
      )}

      {primary && (
        <>
          {/* ① 이번 달의 한 문장 */}
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

          {/* ② 금융 건강 점수 — 백분위 포함 */}
          {healthScore > 0 && (
            <section className="mb-5">
              <div className="rounded-[20px] overflow-hidden" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #4F7FFF 100%)" }}>
                <div className="px-5 py-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[11px] font-bold text-white/60 mb-0.5 tracking-[0.06em] uppercase">금융 건강 점수</p>
                      <p className="text-[12px] text-white/50">저축 · 약속 · 이자 종합</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-black text-white">
                          상위 {100 - healthPercentile}%
                        </span>
                        <span className="text-[11px] text-white/50">또래 추정</span>
                      </div>
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
            </section>
          )}

          {/* ④ 이달 현황 숫자 — 저축/지출/통장 */}
          <section className="mb-5">
            <p className="monari-eyebrow mb-1">이달 현황</p>
            <p className="text-[16px] font-extrabold text-[var(--monari-ink)] mb-3">저축 · 지출 · 통장</p>

            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div className="monari-card p-4">
                <p className="monari-eyebrow mb-2">저축</p>
                <p className="text-[26px] font-black tracking-[-0.03em] tabular-nums text-[var(--monari-done)] leading-tight">
                  {formatWon(save)}
                </p>
                <div className="mt-3 h-[3px] rounded-full bg-[var(--monari-done-bg)] overflow-hidden">
                  <div className="h-[3px] rounded-full bg-[var(--monari-done)]" style={{ width: `${saveRatio}%` }} />
                </div>
              </div>
              <div className="monari-card p-4">
                <p className="monari-eyebrow mb-2" style={{ color: "var(--monari-minus)" }}>지출</p>
                <p className="text-[26px] font-black tracking-[-0.03em] tabular-nums text-[var(--monari-minus)] leading-tight">
                  {formatWon(spend)}
                </p>
                <div className="mt-3 h-[3px] rounded-full bg-[var(--monari-minus-bg)] overflow-hidden">
                  <div className="h-[3px] rounded-full bg-[var(--monari-minus)]" style={{ width: `${spendRatio}%` }} />
                </div>
              </div>
            </div>

            {borrowed > 0 && (
              <div className="monari-card mb-2.5 flex items-center gap-2.5 px-4 py-3">
                <Coins size={14} className="shrink-0 text-[var(--monari-pending)]" />
                <p className="text-[13px] font-semibold text-[var(--monari-ink-soft)]">미리쓰기</p>
                <p className="ml-auto text-[14px] font-extrabold tabular-nums text-[var(--monari-pending)]">{formatWon(borrowed)}</p>
              </div>
            )}

            <div className="monari-card px-4 py-4 grid grid-cols-3 divide-x divide-[var(--monari-line)]">
              <div className="text-center pr-3">
                <p className="monari-eyebrow mb-1.5" style={{ fontSize: "10px" }}>잔액</p>
                <p className="text-[17px] font-black tabular-nums text-[var(--monari-ink)] leading-tight">{formatWon(currentBalance)}</p>
              </div>
              <div className="text-center px-3">
                <p className="monari-eyebrow mb-1.5" style={{ fontSize: "10px" }}>이자율</p>
                <p className="text-[17px] font-black tabular-nums text-[var(--monari-hero)] leading-tight">{currentRate}%</p>
              </div>
              <div className="text-center pl-3">
                <p className="monari-eyebrow mb-1.5" style={{ fontSize: "10px" }}>이달 이자</p>
                <p className={`text-[17px] font-black tabular-nums leading-tight ${interest > 0 ? "text-[var(--monari-done)]" : "text-[var(--monari-ink-muted)]"}`}>
                  {interest > 0 ? `+${formatWon(interest)}` : "—"}
                </p>
              </div>
            </div>
            {interest > 0 && (
              <div className="mt-2 rounded-[12px] bg-[var(--monari-done-bg)] px-4 py-3">
                <p className="text-[12px] font-bold text-[var(--monari-done)]">
                  이번 달 이자 {formatWon(interest)}을 받았어요! 저금하면 이자가 쌓여요.
                </p>
              </div>
            )}
          </section>

          {/* ③ 소비성향 유형 배지 — 건강점수 바로 다음 */}
          {personality && (
            <section className="mb-5">
              <p className="monari-eyebrow mb-1">소비성향 분석</p>
              <p className="text-[16px] font-extrabold text-[var(--monari-ink)] mb-3">이달 {childName}의 유형</p>
              <div className="monari-card p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] text-[32px]"
                    style={{ background: personality.bg }}
                  >
                    {personality.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[20px] font-black" style={{ color: personality.color }}>{personality.label}</p>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
                        style={{ background: personality.bg, color: personality.color }}
                      >
                        {ageGroup}세
                      </span>
                    </div>
                    <p className="text-[12px] leading-5 text-[var(--monari-ink-muted)]">{personality.desc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--monari-line)]">
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-[var(--monari-ink-muted)] mb-1">저축률</p>
                    <p className="text-[16px] font-black tabular-nums" style={{ color: saveRatio >= 25 ? "#36C275" : "var(--monari-ink-muted)" }}>{saveRatio}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-[var(--monari-ink-muted)] mb-1">지출률</p>
                    <p className="text-[16px] font-black tabular-nums" style={{ color: spendRatio >= 75 ? "#FFAA33" : "var(--monari-ink-muted)" }}>{spendRatio}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-[var(--monari-ink-muted)] mb-1">약속달성</p>
                    <p className="text-[16px] font-black tabular-nums" style={{ color: behRate >= 70 ? "#4F7FFF" : "var(--monari-ink-muted)" }}>{behRate}%</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ④ 시각화 — 도넛 + 6개월 트렌드 */}
          {allowance > 0 && (
            <section className="mb-5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="monari-card p-4 flex flex-col items-center">
                  <p className="monari-eyebrow mb-3 self-start">이달 분배</p>
                  <DonutChart save={save} spend={spend} total={allowance} />
                  <div className="mt-3 w-full space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--monari-done)]" />
                      <span className="text-[10px] font-semibold text-[var(--monari-ink-muted)] flex-1">저축</span>
                      <span className="text-[11px] font-extrabold tabular-nums text-[var(--monari-done)]">{saveRatio}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--monari-minus)]" />
                      <span className="text-[10px] font-semibold text-[var(--monari-ink-muted)] flex-1">지출</span>
                      <span className="text-[11px] font-extrabold tabular-nums text-[var(--monari-minus)]">{spendRatio}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--monari-line-strong)]" />
                      <span className="text-[10px] font-semibold text-[var(--monari-ink-muted)] flex-1">잔여</span>
                      <span className="text-[11px] font-extrabold tabular-nums text-[var(--monari-ink-muted)]">{Math.max(0, 100 - saveRatio - spendRatio)}%</span>
                    </div>
                  </div>
                </div>
                {trendData.length > 0 && (
                  <div className="monari-card p-4">
                    <p className="monari-eyebrow mb-1">6개월 트렌드</p>
                    <TrendBars data={trendData} />
                    <div className="mt-2 flex gap-3">
                      <div className="flex items-center gap-1">
                        <div className="h-[3px] w-4 rounded-full bg-[var(--monari-done)]" />
                        <span className="text-[10px] font-semibold text-[var(--monari-ink-muted)]">저축</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-[3px] w-4 rounded-full" style={{ background: "#6366f1" }} />
                        <span className="text-[10px] font-semibold text-[var(--monari-ink-muted)]">약속</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ⑤ 이달 예상 결과 */}
          {daysLeft > 0 && allowance > 0 && (
            <section className="mb-5">
              <div className="overflow-hidden rounded-[20px]" style={{ border: "1px solid var(--monari-hero-lo)", background: "var(--monari-hero-lo)" }}>
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
            </section>
          )}

          {/* ⑦ 또래 비교 */}
          <section className="mb-5">
            <p className="monari-eyebrow mb-1">또래 비교</p>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[16px] font-extrabold text-[var(--monari-ink)]">전국 또래 평균</p>
              <span className="rounded-full bg-[var(--monari-hero-lo)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--monari-hero)]">
                {ageGroup}세
              </span>
            </div>
            {!peer ? (
              <div className="monari-card p-5 text-center">
                <p className="text-[14px] font-bold text-[var(--monari-ink)]">아직 비교 데이터가 부족해요</p>
                <p className="text-[12px] text-[var(--monari-ink-muted)] mt-1">같은 연령대 표본이 10명 이상 모이면 또래 통계를 보여드려요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="monari-card p-5">
                  <p className="text-[13px] font-extrabold text-[var(--monari-ink)] mb-4">이달 용돈</p>
                  <div className="mb-3">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] font-semibold text-[var(--monari-ink-muted)]">또래 평균</span>
                      <span className="text-[12px] font-extrabold tabular-nums text-[var(--monari-ink-muted)]">{formatWon(peer.avgAllowance)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--monari-surface-soft)] overflow-hidden">
                      <div className="h-2 rounded-full bg-[var(--monari-line-strong)]" style={{ width: `${peerAllowancePct}%` }} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] font-bold text-[var(--monari-hero)]">{String(primary.child.name)}</span>
                      <span className="text-[12px] font-extrabold tabular-nums text-[var(--monari-hero)]">{formatWon(allowance)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--monari-hero-lo)] overflow-hidden">
                      <div className="h-2 rounded-full bg-[var(--monari-hero)]" style={{ width: `${childAllowancePct}%` }} />
                    </div>
                  </div>
                  {allowance > 0 && (
                    <div className={`rounded-[10px] px-3 py-2 text-[12px] font-bold ${aheadOfPeer ? "bg-[var(--monari-done-bg)] text-[var(--monari-done)]" : "bg-[var(--monari-minus-bg)] text-[var(--monari-minus)]"}`}>
                      {aheadOfPeer
                        ? `또래보다 ${formatWon(allowance - peer.avgAllowance)} 더 받아요`
                        : `또래 평균보다 ${formatWon(peer.avgAllowance - allowance)} 적어요`}
                    </div>
                  )}
                  <p className="mt-2 text-right text-[10px] text-[var(--monari-ink-muted)]">익명 표본 {peer.sampleSize}명</p>
                </div>
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
                {peer.spendBreakdown.length > 0 && (
                  <PremiumLockedCard
                    isPremium={IS_PREMIUM}
                    previewLabel="또래 지출 카테고리 TOP 4"
                    hint={`${ageGroup}세 아이들이 가장 많이 쓰는 곳: ${peer.spendBreakdown[0].label}`}
                  >
                    <div className="space-y-2.5">
                      {peer.spendBreakdown.map((item, i) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-[11px] font-extrabold text-[var(--monari-ink-muted)] w-4 shrink-0">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-[12px] mb-1">
                              <span className="font-semibold text-[var(--monari-ink-soft)]">{item.label}</span>
                              <span className="font-extrabold text-[var(--monari-ink)]">{item.pct}%</span>
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

          {/* ⑧ AI 용돈 추천 */}
          {allowanceRec && (
            <section className="mb-5">
              <PremiumLockedCard
                isPremium={IS_PREMIUM}
                previewLabel="AI 용돈 추천"
                hint={`${allowanceRec.action} — ${allowanceRec.reason}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-[14px] bg-[var(--monari-hero-lo)] px-4 py-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--monari-hero)] text-white">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] font-extrabold text-[var(--monari-hero)]">{allowanceRec.action}</p>
                      <p className="text-[11px] leading-5 text-[var(--monari-ink-muted)] mt-0.5">{allowanceRec.reason}</p>
                    </div>
                  </div>
                  {allowanceRec.delta && (
                    <div className="flex items-center justify-between rounded-[12px] border border-[var(--monari-line)] px-4 py-3">
                      <span className="text-[12px] font-semibold text-[var(--monari-ink-soft)]">추천 인상액</span>
                      <span className="text-[15px] font-extrabold tabular-nums text-[var(--monari-hero)]">+{formatWon(allowanceRec.delta)}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-center text-[var(--monari-ink-muted)]">
                    또래 평균·약속달성률·저축률을 종합한 추천이에요
                  </p>
                </div>
              </PremiumLockedCard>
            </section>
          )}

          {/* ⑨ 이자 시뮬레이션 */}
          {currentRate > 0 && behRate < 95 && (
            <section className="mb-5">
              <PremiumLockedCard
                isPremium={IS_PREMIUM}
                previewLabel="이자 시뮬레이션"
                hint={`약속 달성률을 높이면 이자가 월 +${formatWon(interestGap)} 늘어날 수 있어요`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center rounded-[12px] bg-[var(--monari-surface-soft)] px-4 py-3">
                    <span className="text-[12px] font-semibold text-[var(--monari-ink-muted)]">현재 이자율 {currentRate}%</span>
                    <span className="text-[14px] font-extrabold tabular-nums text-[var(--monari-ink)]">월 {formatWon(actualMonthlyInterestEst)}</span>
                  </div>
                  <div className="flex justify-between items-center rounded-[12px] bg-[var(--monari-done-bg)] px-4 py-3">
                    <span className="text-[12px] font-bold text-[var(--monari-done)]">달성률 100% 달성 시 {simInterestRate}%</span>
                    <span className="text-[14px] font-extrabold tabular-nums text-[var(--monari-done)]">월 {formatWon(simMonthlyInterest)}</span>
                  </div>
                  <p className="text-[11px] text-center text-[var(--monari-ink-muted)]">매달 {formatWon(interestGap)} 더 받을 수 있어요</p>
                </div>
              </PremiumLockedCard>
            </section>
          )}

          {/* ⑩ 미래 예측 */}
          {(projectedAt12 !== null || projectedAt15 !== null) && (
            <section className="mb-5">
              <PremiumLockedCard
                isPremium={IS_PREMIUM}
                previewLabel="미래 저축 예측"
                hint={projectedAt12 !== null ? `이 속도라면 12세에 ${formatWon(projectedAt12)} 모을 수 있어요` : `이 속도라면 15세에 ${formatWon(projectedAt15!)} 모을 수 있어요`}
              >
                <div className="space-y-3">
                  <div
                    className="rounded-[16px] px-5 py-4 text-center"
                    style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
                  >
                    <p className="text-[11px] font-bold text-emerald-600 mb-1 tracking-[0.05em] uppercase">
                      {projectedAt12 !== null ? "12세까지 예상 저축액" : "15세까지 예상 저축액"}
                    </p>
                    <p className="text-[32px] font-black tabular-nums text-emerald-700 leading-tight">
                      {projectedAt12 !== null ? formatWon(projectedAt12) : formatWon(projectedAt15!)}
                    </p>
                    <p className="text-[11px] text-emerald-600/70 mt-1">현재 저축 추이 기준 · 이자 미포함</p>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-[12px] bg-[var(--monari-surface-soft)] px-4 py-3">
                    <p className="text-[11px] leading-5 text-[var(--monari-ink-muted)]">
                      매달 {formatWon(save)}씩 모으는 지금 속도로 꾸준히 저축하면, 이자까지 더해 훨씬 더 늘어날 수 있어요.
                    </p>
                  </div>
                </div>
              </PremiumLockedCard>
            </section>
          )}

          {/* ⑪ 부모 코칭 — 3단계 강화 */}
          <section className="mb-5">
            <p className="monari-eyebrow mb-1">부모 코칭</p>
            <p className="text-[16px] font-extrabold text-[var(--monari-ink)] mb-3">이번달 가이드</p>
            <div className="space-y-3">
              {/* 칭찬 포인트 */}
              <div className="monari-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={16} className="text-amber-500 shrink-0" />
                  <p className="text-[13px] font-extrabold text-[var(--monari-ink)]">이달 칭찬 포인트</p>
                </div>
                <div className="rounded-[12px] bg-amber-50 px-4 py-3 mb-3">
                  <p className="text-[14px] font-black text-amber-700">"{praisePoint}"</p>
                  <p className="text-[11px] text-amber-600/80 mt-1">지금 바로 아이에게 전해주세요</p>
                </div>
                <p className="text-[12px] leading-[1.65] text-[var(--monari-ink-soft)]">
                  {saveRatio >= 30
                    ? `이번달 저축률 ${saveRatio}%는 정말 훌륭해요. 구체적인 숫자를 함께 보며 칭찬해주면 더 효과적이에요.`
                    : behRate >= 80
                    ? `약속 달성률 ${behRate}%는 또래 중에서도 높은 수준이에요. 규칙을 지키는 힘이 금융 습관의 기초예요.`
                    : `꾸준히 기록하고 있다는 것 자체가 훌륭한 시작이에요. 과정을 격려해주세요.`}
                </p>
              </div>

              {/* 아이에게 물어볼 질문 */}
              <div className="monari-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={16} className="text-[var(--monari-hero)] shrink-0" />
                  <p className="text-[13px] font-extrabold text-[var(--monari-ink)]">아이에게 물어볼 질문</p>
                </div>
                <div className="rounded-[12px] bg-[var(--monari-hero-lo)] px-4 py-3">
                  <p className="text-[14px] font-bold text-[var(--monari-hero)] leading-6">{questionToAsk}</p>
                </div>
                <p className="mt-2.5 text-[11px] leading-5 text-[var(--monari-ink-muted)]">
                  정답보다 대화가 중요해요. 아이의 생각을 먼저 들어보세요.
                </p>
              </div>

              {/* 다음달 미션 */}
              <div className="monari-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-rose-500 shrink-0" />
                  <p className="text-[13px] font-extrabold text-[var(--monari-ink)]">다음 달 미션</p>
                </div>
                <div className="rounded-[12px] bg-rose-50 px-4 py-3 mb-3">
                  <p className="text-[14px] font-black text-rose-700">{nextMonthMission}</p>
                </div>
                <p className="text-[12px] leading-5 text-[var(--monari-ink-muted)]">
                  아이와 함께 이 미션을 정하면 더 의미 있어요. 달성 시 작은 보상을 약속해보세요.
                </p>
              </div>

              {/* 용돈 적정성 힌트 */}
              {peer && (
                <div className="monari-card-ghost px-4 py-3.5">
                  <p className="text-[13px] font-bold text-[var(--monari-ink)] mb-1">💰 용돈 적정성 힌트</p>
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

          {/* ⑫ CSV 내보내기 */}
          <div className="mb-6">
            <Link
              href={`/api/reports/export?child=${primary.child.id}`}
              className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--monari-line)] bg-[var(--monari-surface)] py-2.5 text-[12px] font-bold text-[var(--monari-ink-soft)] transition active:scale-[0.97]"
            >
              <Download size={13} /> 이달 리포트 CSV 내보내기
            </Link>
          </div>
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

function DonutChart({ save, spend, total }: { save: number; spend: number; total: number }) {
  const r = 36;
  const cx = 44;
  const cy = 44;
  const circ = 2 * Math.PI * r;
  const savePct = Math.min(save / Math.max(total, 1), 1);
  const spendPct = Math.min(spend / Math.max(total, 1), 1 - savePct);
  const restPct = Math.max(0, 1 - savePct - spendPct);

  function arc(startFrac: number, lengthFrac: number) {
    if (lengthFrac <= 0) return "";
    const start = startFrac * circ;
    const dash = lengthFrac * circ;
    const gap = circ - dash;
    void start;
    return `${dash} ${gap}`;
  }

  const saveOffset = -circ * 0.25;
  const spendOffset = -circ * 0.25 + savePct * circ;
  const restOffset = -circ * 0.25 + (savePct + spendPct) * circ;

  return (
    <svg viewBox="0 0 88 88" width={88} height={88} style={{ overflow: "visible" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--monari-surface-soft)" strokeWidth={12} />
      {restPct > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--monari-line-strong)" strokeWidth={12}
          strokeDasharray={arc(0, restPct)} strokeDashoffset={restOffset} strokeLinecap="round" />
      )}
      {spendPct > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--monari-minus)" strokeWidth={12}
          strokeDasharray={arc(0, spendPct)} strokeDashoffset={spendOffset} strokeLinecap="round" />
      )}
      {savePct > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--monari-done)" strokeWidth={12}
          strokeDasharray={arc(0, savePct)} strokeDashoffset={saveOffset} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={14} fontWeight={900} fill="var(--monari-ink)" fontFamily="inherit">
        {Math.round(savePct * 100)}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--monari-ink-muted)" fontFamily="inherit">
        저축률
      </text>
    </svg>
  );
}

function TrendBars({ data }: { data: { label: string; saveRate: number; behRate: number }[] }) {
  const barW = 10;
  const gap = 5;
  const groupW = barW * 2 + gap;
  const spacing = 6;
  const maxH = 64;
  const chartW = data.length * (groupW + spacing);
  const chartH = maxH + 24;

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height={chartH} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const x = i * (groupW + spacing);
        const saveH = Math.max(2, (d.saveRate / 100) * maxH);
        const behH = Math.max(2, (d.behRate / 100) * maxH);
        const isLast = i === data.length - 1;
        return (
          <g key={d.label}>
            <rect x={x} y={maxH - saveH} width={barW} height={saveH} rx={3}
              fill="var(--monari-done)" opacity={isLast ? 1 : 0.55} />
            {isLast && (
              <text x={x + barW / 2} y={maxH - saveH - 3} textAnchor="middle" fontSize={7} fontWeight={700} fill="var(--monari-done)" fontFamily="inherit">
                {d.saveRate}
              </text>
            )}
            <rect x={x + barW + gap} y={maxH - behH} width={barW} height={behH} rx={3}
              fill="#6366f1" opacity={isLast ? 1 : 0.55} />
            {isLast && (
              <text x={x + barW + gap + barW / 2} y={maxH - behH - 3} textAnchor="middle" fontSize={7} fontWeight={700} fill="#6366f1" fontFamily="inherit">
                {d.behRate}
              </text>
            )}
            <text x={x + groupW / 2} y={maxH + 14} textAnchor="middle" fontSize={8} fontWeight={600} fill="var(--monari-ink-muted)" fontFamily="inherit">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HeroPill({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-white/10 border border-white/15 px-2 py-3 gap-1">
      <p className="text-[10px] font-semibold text-white/55">{label}</p>
      <p className="text-[16px] font-black text-white leading-none tabular-nums">{value}</p>
      {sub && <p className={`text-[9px] font-bold ${warn ? "text-rose-300" : "text-sky-300"}`}>{sub}</p>}
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
          <span className="font-semibold text-[var(--monari-ink-soft)]">{left.label}</span>
          <span className="font-extrabold tabular-nums text-[var(--monari-ink-muted)]">{left.value.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--monari-surface-soft)]">
          <div className="h-2 rounded-full bg-[var(--monari-line-strong)]" style={{ width: `${Math.min(left.value, 100)}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[12px] mb-1.5">
          <span className="font-bold text-[var(--monari-hero)]">{right.label}</span>
          <span className="font-extrabold tabular-nums text-[var(--monari-hero)]">{right.value.toFixed(0)}%</span>
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
        <p className="text-[14px] font-extrabold text-[var(--monari-ink)] mb-4">{previewLabel}</p>
        {children}
      </div>
    );
  }

  return (
    <div className="relative rounded-[20px] overflow-hidden" style={{ border: "1px solid var(--monari-line)" }}>
      <div className="p-5" style={{ background: "var(--monari-surface)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-extrabold text-[var(--monari-ink)]">{previewLabel}</p>
          <span className="flex items-center gap-1 rounded-full bg-[var(--monari-hero-lo)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--monari-hero)]">
            <Sparkles size={9} strokeWidth={3} /> 플러스
          </span>
        </div>
        <p className="text-[12px] font-semibold text-[var(--monari-ink-muted)] mb-4 leading-5">
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
          className="flex items-center gap-2 rounded-[14px] bg-[var(--monari-hero)] px-6 py-3 text-[13px] font-extrabold text-white shadow-[0_4px_20px_rgba(109,40,217,0.4)] transition active:scale-[0.97]"
        >
          <Lock size={12} strokeWidth={3} />
          전체 보기 — 모나리 플러스
        </Link>
      </div>
    </div>
  );
}
