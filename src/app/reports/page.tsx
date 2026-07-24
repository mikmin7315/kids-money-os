import Link from "next/link";
import { ArrowRight, Lock, Sparkles, Coins } from "lucide-react";
import { MonthlyReportQuickForm } from "@/components/finance/action-forms";
import { ReportBarGroup, SpendVsSaveSplit, BehaviorRing } from "@/components/finance/report-visuals";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
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

  // 이번 달 약속별 달성 현황
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const monthKey = today.slice(0, 7);
  const childLogs = primary
    ? bundle.behaviorLogs.filter((l) => l.childId === primary.child.id && l.date.startsWith(monthKey))
    : [];
  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);

  const primaryChild = primary ? bundle.children.find((c) => c.id === primary.child.id) : null;
  const ageGroup = getAgeGroup(primaryChild?.birthYear);
  const peer = primary ? await getPeerStats(ageGroup) : null;

  const peerMaxAllowance = peer ? Math.max(allowance, peer.avgAllowance, 1) : 1;
  const peerAllowancePct = peer ? Math.round((peer.avgAllowance / peerMaxAllowance) * 100) : 0;
  const childAllowancePct = peer ? Math.round((allowance / peerMaxAllowance) * 100) : 0;
  const aheadOfPeer = peer ? allowance >= peer.avgAllowance : false;

  return (
    <MobileAppShell title="이번달 리포트" subtitle="리포트">
      {/* 아이 선택 */}
      {allChildren.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {allChildren.map((c) => (
            <Link
              key={c.child.id}
              href={`/reports?child=${c.child.id}`}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95 ${
                primary?.child.id === c.child.id
                  ? "bg-[var(--monari-hero)] text-white shadow-[0_2px_12px_rgba(109,40,217,0.4)]"
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
          <p className="monari-meta mb-4">리포트를 보려면 아이 프로필이 필요합니다.</p>
          <Link href="/settings" className="monari-btn-primary px-5">아이 등록하기 →</Link>
        </div>
      )}

      {primary && (
        <>
          {/* ═══ HERO — 이달의 핵심 숫자 ═══ */}
          <div className="monari-hero mb-6">
            <p className="text-[11px] font-700 uppercase tracking-[0.1em] text-white/50 mb-4">
              {String(primary.child.name)}의 {new Date().getMonth() + 1}월 리포트
            </p>

            {/* 저축률 — 가장 중요한 단일 숫자 */}
            <div className="mb-5 text-center">
              <p className="text-[11px] font-600 text-white/60 mb-1">이달 저축률</p>
              <p className="text-[80px] font-900 leading-none tracking-[-0.05em] text-white">
                {saveRatio}<span className="text-[32px] text-white/65">%</span>
              </p>
              <p className="mt-2 text-[13px] font-600 text-white/60">
                {saveRatio >= 30 ? "훌륭한 저축 습관이에요" : saveRatio >= 15 ? "조금 더 모아볼까요?" : "저축을 시작해보세요"}
              </p>
            </div>

            {/* 보조 지표 4개 */}
            <div className="grid grid-cols-4 gap-1.5 border-t border-white/15 pt-4">
              <HeroPill label="용돈" value={formatWon(allowance)} sub="" />
              <HeroPill label="지출" value={`${spendRatio}%`} sub={spendRatio > 70 ? "주의" : "양호"} warn={spendRatio > 70} />
              <HeroPill label="이자" value={formatWon(interest)} sub={interest > 0 ? "획득" : "—"} />
              <HeroPill label="약속" value={`${behRate}%`} sub={behRate >= 80 ? "우수" : behRate >= 50 ? "보통" : "노력"} warn={behRate < 50} />
            </div>
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

          {/* ═══ 잔액 + 이자율 현황 ═══ */}
          <section className="mb-5">
            <SectionTitle eyebrow="현황">지금 통장 상태</SectionTitle>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="monari-card p-4 text-center">
                <p className="monari-eyebrow mb-1.5">잔액</p>
                <p className="text-[18px] font-900 tabular-nums text-[var(--monari-ink)] leading-tight">{formatWon(currentBalance)}</p>
              </div>
              <div className="monari-card p-4 text-center">
                <p className="monari-eyebrow mb-1.5">이자율</p>
                <p className="text-[18px] font-900 tabular-nums text-[var(--monari-hero)] leading-tight">{currentRate}%</p>
              </div>
              <div className="monari-card p-4 text-center">
                <p className="monari-eyebrow mb-1.5">이달 이자</p>
                <p className={`text-[18px] font-900 tabular-nums leading-tight ${interest > 0 ? "text-[var(--monari-done)]" : "text-[var(--monari-ink-muted)]"}`}>
                  {interest > 0 ? `+${formatWon(interest)}` : "—"}
                </p>
              </div>
            </div>
            {interest > 0 && (
              <div className="mt-2 rounded-[14px] bg-[var(--monari-done-bg)] px-4 py-3">
                <p className="text-[12px] font-700 text-[var(--monari-done)]">
                  🎉 이번 달 이자 {formatWon(interest)}을 받았어요! 저금하면 이자가 쌓여요.
                </p>
              </div>
            )}
          </section>

          {/* ═══ 약속별 달성 현황 ═══ */}
          {activeRules.length > 0 && (
            <section className="mb-5">
              <SectionTitle eyebrow="약속">이번 달 약속 현황</SectionTitle>
              <div className="mt-3 monari-card overflow-hidden">
                {activeRules.map((rule, i) => {
                  const logs = childLogs.filter((l) => l.behaviorRuleId === rule.id);
                  const approved = logs.filter((l) => l.status === "approved" || l.status === "completed").length;
                  const pending = logs.filter((l) => l.status === "pending").length;
                  const isDone = approved > 0;
                  const isWaiting = !isDone && pending > 0;
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-3 px-4 py-3.5 ${i < activeRules.length - 1 ? "border-b border-[var(--monari-line)]" : ""}`}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[14px]"
                        style={{
                          background: isDone ? "var(--status-success-solid)" : isWaiting ? "var(--status-pending-solid)" : "var(--monari-surface-soft)",
                        }}
                      >
                        {isDone ? "✓" : isWaiting ? "⏳" : "○"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-700 text-[var(--monari-ink)] truncate">{rule.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: isDone ? "var(--monari-done)" : isWaiting ? "var(--monari-pending)" : "var(--monari-ink-muted)" }}>
                          {isDone ? "달성 완료" : isWaiting ? "확인 대기 중" : "아직 미달성"}
                        </p>
                      </div>
                      <p className="shrink-0 text-[13px] font-800 tabular-nums" style={{ color: isDone ? "var(--monari-done)" : "var(--monari-line-strong)" }}>
                        +{rule.interestDelta}%p
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ 또래 비교 — 수익 핵심 ═══ */}
          <section className="mb-6">
            <div className="mb-3">
              <p className="monari-eyebrow">또래 비교</p>
              <div className="flex items-center justify-between">
                <h2 className="monari-section-title">전국 또래 평균</h2>
                <span className="rounded-full bg-[var(--monari-hero-lo)] px-2.5 py-1 text-[11px] font-800 text-[var(--monari-hero)]">
                  {ageGroup}세
                </span>
              </div>
            </div>

            {!peer ? (
              <div className="monari-card p-5 text-center">
                <p className="text-[14px] font-700 text-[var(--monari-ink)]">아직 비교 데이터가 부족해요</p>
                <p className="monari-meta mt-1">같은 연령대 표본이 10명 이상 모이면 또래 통계를 보여드려요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 무료 — 용돈 바 차트 비교 */}
                <div className="monari-card p-5">
                  <p className="text-[13px] font-800 text-[var(--monari-ink)] mb-4">이달 용돈</p>
                  <div className="mb-3">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] font-500 text-[var(--monari-ink-muted)]">또래 평균</span>
                      <span className="text-[12px] font-800 tabular-nums text-[var(--monari-ink-muted)]">{formatWon(peer.avgAllowance)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--monari-surface-soft)] overflow-hidden">
                      <div className="h-1.5 rounded-full bg-[var(--monari-line-strong)]" style={{ width: `${peerAllowancePct}%`, background: "var(--monari-ink-muted)" }} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] font-700 text-[var(--monari-hero)]">{String(primary.child.name)}</span>
                      <span className="text-[12px] font-800 tabular-nums text-[var(--monari-hero)]">{formatWon(allowance)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--monari-hero-lo)] overflow-hidden">
                      <div className="h-1.5 rounded-full bg-[var(--monari-hero)]" style={{ width: `${childAllowancePct}%` }} />
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

                {/* 저축률 비교 */}
                <PremiumLockedCard
                  isPremium={IS_PREMIUM}
                  previewLabel="저축률 비교"
                  hint={saveRatio >= peer.savingsRate
                    ? `또래보다 ${saveRatio - Math.round(peer.savingsRate)}%p 더 저축하고 있어요`
                    : `또래 평균보다 ${Math.round(peer.savingsRate) - saveRatio}%p 낮아요`}
                >
                  <ComparisonBarPair
                    left={{ label: "또래 평균", value: peer.savingsRate, color: "var(--monari-ink-muted)" }}
                    right={{ label: String(primary.child.name), value: saveRatio, color: "var(--monari-hero)" }}
                  />
                </PremiumLockedCard>

                {/* 행동 달성률 비교 */}
                <PremiumLockedCard
                  isPremium={IS_PREMIUM}
                  previewLabel="약속 달성률 비교"
                  hint={behRate >= peer.behaviorRate
                    ? `약속을 또래보다 잘 지키고 있어요`
                    : `또래 평균 달성률은 ${Math.round(peer.behaviorRate)}%예요`}
                >
                  <ComparisonBarPair
                    left={{ label: "또래 평균", value: peer.behaviorRate, color: "var(--monari-ink-muted)" }}
                    right={{ label: String(primary.child.name), value: behRate, color: "var(--monari-hero)" }}
                  />
                </PremiumLockedCard>

                {/* 지출 카테고리 */}
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
                            <div className="h-1.5 w-full rounded-full bg-[var(--monari-surface-soft)]">
                              <div className="h-1.5 rounded-full bg-[var(--monari-hero)]" style={{ width: `${item.pct}%` }} />
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

          {/* ═══ 약속 달성률 ═══ */}
          <section className="mb-5">
            <SectionTitle eyebrow="약속">약속 달성률</SectionTitle>
            <div className="monari-card mt-3 p-5">
              <BehaviorRing rate={primary.monthReport.behaviorSuccessRate} />
            </div>
          </section>

          {/* ═══ 시각화 ═══ */}
          <section className="mb-5">
            <SectionTitle eyebrow="분석">돈의 흐름</SectionTitle>
            <div className="space-y-3 mt-3">
              <div className="monari-card p-5">
                <ReportBarGroup allowance={allowance} spend={spend} save={save} borrowed={borrowed} />
              </div>
              <div className="monari-card p-5">
                <SpendVsSaveSplit spend={spend} save={save} />
              </div>
            </div>
          </section>

          {/* ═══ 코칭 포인트 ═══ */}
          <section className="mb-5">
            <SectionTitle eyebrow="코칭">이번달 포인트</SectionTitle>
            <div className="mt-3 space-y-2">
              {/* 메인 코칭 — 왼쪽 파란 accent border */}
              <div className="monari-card-accent p-5">
                <p className="text-[15px] font-800 text-[var(--monari-ink)] mb-2">
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
              {/* 서브 코칭 — ghost */}
              <div className="monari-card-ghost px-4 py-3.5">
                <p className="text-[13px] font-700 text-[var(--monari-ink)] mb-1">미리쓰기는 목적 중심으로</p>
                <p className="text-[12px] leading-[1.6] text-[var(--monari-ink-muted)]">
                  미리쓰기 이유를 아이가 직접 쓰게 하면 충동 구매보다 계획 소비로 전환하기 쉽습니다.
                </p>
              </div>
            </div>
          </section>

          {/* ═══ 리포트 생성 ═══ */}
          <section className="mb-5">
            <SectionTitle eyebrow="내보내기">월간 리포트</SectionTitle>
            <div className="monari-card mt-3 p-5">
              <MonthlyReportQuickForm childOptions={bundle.children} />
            </div>
          </section>

          {/* ═══ 다른 아이와 비교 ═══ */}
          {allChildren.length > 1 && (
            <section className="mb-5">
              <SectionTitle eyebrow="비교">다른 아이와 비교</SectionTitle>
              <div className="mt-3 space-y-2">
                {allChildren.map((c) => {
                  const r = Math.round((c.monthReport.totalSave / Math.max(c.monthReport.totalAllowance, 1)) * 100);
                  const b = Math.round(c.monthReport.behaviorSuccessRate);
                  const isSelected = c.child.id === primary.child.id;
                  return (
                    <Link
                      key={c.child.id}
                      href={`/reports?child=${c.child.id}`}
                      className="monari-card block p-4 transition active:scale-[0.99]"
                      style={isSelected ? { borderColor: "var(--monari-hero)", borderWidth: "1.5px" } : {}}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-800 text-[var(--monari-ink)]">{String(c.child.name)}</p>
                          {isSelected && <span className="rounded-full bg-[var(--monari-hero-lo)] px-2 py-0.5 text-[10px] font-800 text-[var(--monari-hero)]">현재</span>}
                        </div>
                        <ArrowRight size={15} className="text-[var(--monari-ink-muted)]" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <ChildStatBox label="용돈" value={formatWon(c.monthReport.totalAllowance)} />
                        <ChildStatBox label="저축률" value={`${r}%`} highlight />
                        <ChildStatBox label="약속 달성" value={`${b}%`} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </MobileAppShell>
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

function HeroPill({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-white/10 border border-white/15 px-2 py-3 gap-1">
      <p className="text-[10px] font-600 text-white/55">{label}</p>
      <p className="text-[16px] font-900 text-white leading-none">{value}</p>
      {sub && <p className={`text-[9px] font-700 ${warn ? "text-rose-300" : "text-emerald-300"}`}>{sub}</p>}
    </div>
  );
}


function ComparisonBarPair({
  left,
  right,
}: {
  left: { label: string; value: number; color: string };
  right: { label: string; value: number; color: string };
}) {
  return (
    <div className="space-y-3">
      {[left, right].map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="font-600 text-[var(--monari-ink-soft)]">{item.label}</span>
            <span className="font-800 tabular-nums" style={{ color: item.color }}>{item.value.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--monari-surface-soft)]">
            <div
              className="h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(item.value, 100)}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
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
        <div className="pointer-events-none select-none" style={{ filter: "blur(5px)", opacity: 0.4 }}>
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
          <ArrowRight size={12} strokeWidth={3} />
        </Link>
      </div>
    </div>
  );
}

function ChildStatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-[12px] p-2.5 text-center" style={{ background: highlight ? "var(--monari-hero-lo)" : "var(--monari-surface-soft)" }}>
      <p className="text-[10px] font-600 text-[var(--monari-ink-muted)] mb-0.5">{label}</p>
      <p className={`text-[14px] font-900 tabular-nums ${highlight ? "text-[var(--monari-hero)]" : "text-[var(--monari-ink)]"}`}>{value}</p>
    </div>
  );
}
