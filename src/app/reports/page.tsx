import Link from "next/link";
import { Lock } from "lucide-react";
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
  const spendRatio = primary
    ? Math.round((primary.monthReport.totalSpend / Math.max(primary.monthReport.totalAllowance, 1)) * 100)
    : 0;
  const saveRatio = primary
    ? Math.round((primary.monthReport.totalSave / Math.max(primary.monthReport.totalAllowance, 1)) * 100)
    : 0;
  const coachingInsight = !primary
    ? null
    : saveRatio >= 30
      ? { title: "저축 습관을 잘 만들고 있어요", body: `이번달 용돈의 ${saveRatio}%를 저축했어요. 저축 목표와 이자를 함께 이야기해 보세요.` }
      : spendRatio >= 80
        ? { title: "소비 계획을 함께 점검해 보세요", body: `이번달 용돈의 ${spendRatio}%를 사용했어요. 다음 구매 전 필요한 것과 원하는 것을 나눠보면 좋아요.` }
        : { title: "돈의 균형을 함께 살펴보세요", body: "지출과 저축 기록을 보며 다음달에 유지할 습관 하나를 정해 보세요." };

  const primaryChild = primary ? bundle.children.find((c) => c.id === primary.child.id) : null;
  const ageGroup = getAgeGroup(primaryChild?.birthYear);
  const peer = primary ? await getPeerStats(ageGroup) : null;

  return (
    <MobileAppShell title="이번달 리포트" subtitle="리포트">
      {allChildren.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {allChildren.map((c) => (
            <Link
              key={c.child.id}
              href={`/reports?child=${c.child.id}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition ${
                primary?.child.id === c.child.id
                  ? "bg-[var(--monari-hero)] text-white"
                  : "bg-[var(--monari-surface)] text-[var(--monari-ink-muted)] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              }`}
            >
              {String(c.child.name)}
            </Link>
          ))}
        </div>
      )}

      {!primary && (
        <div className="monari-card p-5 text-center">
          <p className="text-[15px] font-700 text-[var(--monari-ink)] mb-1">아이를 먼저 등록해주세요</p>
          <p className="monari-meta mb-4">리포트를 보려면 아이 프로필이 필요합니다.</p>
          <Link href="/settings" className="monari-btn-primary px-5">아이 등록하기 →</Link>
        </div>
      )}

      {primary && (
        <>
          {/* Hero */}
          <div className="monari-hero mb-4">
            <p className="text-[13px] font-700 text-white/70 mb-2">{primary.child.name}</p>
            <p className="relative mb-4 text-[22px] font-800 leading-tight tracking-[-0.04em] text-white">
              이번달 돈 습관을<br />한눈에 확인해요
            </p>
            <div className="grid grid-cols-3 gap-2">
              <HeroPill label="지출 비중" value={`${spendRatio}%`} />
              <HeroPill label="저축 비중" value={`${saveRatio}%`} />
              <HeroPill label="약속 성공" value={`${primary.monthReport.behaviorSuccessRate.toFixed(0)}%`} />
            </div>
          </div>

          {/* KPI grid */}
          <section className="mb-4">
            <SectionTitle>핵심 수치</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <MetricCard label="용돈" value={formatWon(primary.monthReport.totalAllowance)} />
              <MetricCard label="지출" value={formatWon(primary.monthReport.totalSpend)} />
              <MetricCard label="저축" value={formatWon(primary.monthReport.totalSave)} />
              <MetricCard label="빌린 돈" value={formatWon(primary.monthReport.totalBorrowed)} />
            </div>
          </section>

          {/* Behavior rate */}
          <section className="mb-4">
            <SectionTitle>약속 달성률</SectionTitle>
            <div className="monari-card mt-3 p-5">
              <BehaviorRing rate={primary.monthReport.behaviorSuccessRate} />
            </div>
          </section>

          {/* Charts */}
          <section className="mb-4">
            <SectionTitle>시각화</SectionTitle>
            <div className="space-y-3 mt-3">
              <div className="monari-card p-4">
                <ReportBarGroup
                  allowance={primary.monthReport.totalAllowance}
                  spend={primary.monthReport.totalSpend}
                  save={primary.monthReport.totalSave}
                  borrowed={primary.monthReport.totalBorrowed}
                />
              </div>
              <div className="monari-card p-4">
                <SpendVsSaveSplit spend={primary.monthReport.totalSpend} save={primary.monthReport.totalSave} />
              </div>
            </div>
          </section>

          <section className="mb-4">
            <SectionTitle>이번달 코칭 포인트</SectionTitle>
            <div className="space-y-3 mt-3">
              <InsightCard title={coachingInsight!.title} body={coachingInsight!.body} />
              <InsightCard title="미리쓰기는 목적 중심으로" body="미리쓰기 이유를 아이가 직접 쓰게 하면 충동 구매보다 계획 소비로 전환하기 쉽습니다." />
            </div>
          </section>

          {/* ── 또래 비교 ── */}
          <section className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>또래 비교</SectionTitle>
              <span className="rounded-full bg-[var(--monari-hero-lo)] px-2.5 py-1 text-[11px] font-800 text-[var(--monari-hero)]">
                {ageGroup}세 기준
              </span>
            </div>

            {!peer ? (
              <div className="monari-card p-5 text-center">
                <p className="text-[14px] font-700 text-[var(--monari-ink)]">아직 비교할 데이터가 충분하지 않아요</p>
                <p className="monari-meta mt-1">같은 연령대 표본이 10명 이상 모이면 또래 통계를 보여드려요.</p>
              </div>
            ) : (
              <>
                {/* 맛보기 — 전국 또래 평균 용돈 (무료 공개) */}
                <div
                  className="rounded-[20px] p-4 mb-3 flex items-center justify-between"
                  style={{ background: "linear-gradient(135deg,#7C3AED14,#7C3AED08)", border: "1.5px solid var(--monari-hero-lo)" }}
                >
                  <div>
                    <p className="text-[11px] font-700 tracking-[0.06em] uppercase text-[var(--monari-ink-muted)] mb-1">
                      전국 또래 평균 용돈
                    </p>
                    <p className="text-[26px] font-900 tracking-[-0.03em] tabular-nums text-[var(--monari-hero)]">
                      {formatWon(peer.avgAllowance)}
                      <span className="ml-1.5 text-[13px] font-700 text-[var(--monari-ink-muted)]">/월</span>
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--monari-ink-muted)]">익명 표본 {peer.sampleSize}명</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-700 text-[var(--monari-ink-muted)] mb-1">우리 아이</p>
                    <p className="text-[20px] font-900 tabular-nums text-[var(--monari-ink)]">
                      {formatWon(primary.monthReport.totalAllowance)}
                    </p>
                    <p className={`text-[11px] font-800 mt-0.5 ${primary.monthReport.totalAllowance >= peer.avgAllowance ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>
                      {primary.monthReport.totalAllowance >= peer.avgAllowance ? "▲ 또래보다 높아요" : "▼ 또래 평균 이하"}
                    </p>
                  </div>
                </div>

                {/* 잠금 섹션들 */}
                <div className="space-y-3">
              <PremiumLockedCard
                isPremium={IS_PREMIUM}
                previewLabel="저축률 비교"
                previewValue={`또래 ${peer.savingsRate}% vs 우리 아이 ${saveRatio}%`}
              >
                <ComparisonBar label="또래 평균" value={peer.savingsRate} color="var(--monari-ink-muted)" />
                <ComparisonBar label={`${primary.child.name}`} value={saveRatio} color="var(--monari-hero)" />
              </PremiumLockedCard>

              <PremiumLockedCard
                isPremium={IS_PREMIUM}
                previewLabel="행동 달성률 비교"
                previewValue={`또래 ${peer.behaviorRate}% vs 우리 아이 ${primary.monthReport.behaviorSuccessRate.toFixed(0)}%`}
              >
                <ComparisonBar label="또래 평균" value={peer.behaviorRate} color="var(--monari-ink-muted)" />
                <ComparisonBar label={`${primary.child.name}`} value={Math.round(primary.monthReport.behaviorSuccessRate)} color="#10b981" />
              </PremiumLockedCard>

                  {peer.spendBreakdown.length > 0 && (
                    <PremiumLockedCard
                      isPremium={IS_PREMIUM}
                      previewLabel="또래 지출 카테고리"
                      previewValue={`1위 ${peer.spendBreakdown[0].label} ${peer.spendBreakdown[0].pct}%`}
                    >
                      <div className="space-y-2">
                        {peer.spendBreakdown.map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-[12px] mb-1">
                              <span className="text-[var(--monari-ink-soft)]">{item.label}</span>
                              <span className="font-700 text-[var(--monari-ink)]">{item.pct}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[var(--monari-surface-soft)]">
                              <div className="h-2 rounded-full bg-[var(--monari-hero)]" style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </PremiumLockedCard>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Report generate */}
          <section className="mb-4">
            <SectionTitle>리포트 생성</SectionTitle>
            <div className="monari-card mt-3 p-5">
              <MonthlyReportQuickForm childOptions={bundle.children} />
            </div>
          </section>

          {allChildren.length > 1 && (
            <section className="mb-4">
              <SectionTitle>아이 비교</SectionTitle>
              <div className="mt-3 space-y-2">
                {allChildren.map((c) => {
                  const ratio = Math.round((c.monthReport.totalSave / Math.max(c.monthReport.totalAllowance, 1)) * 100);
                  const behRate = Math.round(c.monthReport.behaviorSuccessRate);
                  return (
                    <Link key={c.child.id} href={`/reports?child=${c.child.id}`} className="monari-card block p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[14px] font-800 text-[var(--monari-ink)]">{String(c.child.name)}</p>
                        <span className="text-[12px] font-700 text-[var(--monari-hero)]">약속 {behRate}%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="monari-meta text-[10px]">용돈</p>
                          <p className="text-[13px] font-700 text-[var(--monari-ink)]">{formatWon(c.monthReport.totalAllowance)}</p>
                        </div>
                        <div>
                          <p className="monari-meta text-[10px]">저축률</p>
                          <p className="text-[13px] font-700 text-[var(--monari-hero)]">{ratio}%</p>
                        </div>
                        <div>
                          <p className="monari-meta text-[10px]">지출</p>
                          <p className="text-[13px] font-700 text-[var(--monari-ink)]">{formatWon(c.monthReport.totalSpend)}</p>
                        </div>
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
  // RPC 대신 테이블 직접 쿼리 (get_peer_stats 함수 미배포 시 대비)
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

// ── 컴포넌트 ────────────────────────────────────────────────

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-white/10 border border-white/15 px-2 py-2 gap-0.5">
      <p className="text-[11px] font-600 text-white/70">{label}</p>
      <p className="text-[14px] font-800 text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="monari-card p-4">
      <p className="monari-meta">{label}</p>
      <p className="monari-kpi-value mt-1">{value}</p>
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="monari-card p-5">
      <p className="text-[15px] font-800 text-[var(--monari-ink)]">{title}</p>
      <p className="text-[13px] leading-5 text-[var(--monari-ink-soft)] mt-2">{body}</p>
    </div>
  );
}

function ComparisonBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-[var(--monari-ink-soft)]">{label}</span>
        <span className="font-800" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--monari-surface-soft)]">
        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function PremiumLockedCard({
  isPremium,
  previewLabel,
  previewValue,
  children,
}: {
  isPremium: boolean;
  previewLabel: string;
  previewValue: string;
  children: React.ReactNode;
}) {
  if (isPremium) {
    return (
      <div className="monari-card p-4">
        <p className="text-[13px] font-700 text-[var(--monari-ink)] mb-3">{previewLabel}</p>
        {children}
      </div>
    );
  }

  return (
    <div className="relative rounded-[20px] overflow-hidden">
      {/* 맛보기 힌트 — 잠금 전 헤더 */}
      <div className="monari-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-700 text-[var(--monari-ink)]">{previewLabel}</p>
          <span className="flex items-center gap-1 rounded-full bg-[var(--monari-hero-lo)] px-2 py-0.5 text-[10px] font-800 text-[var(--monari-hero)]">
            <Lock size={9} strokeWidth={3} /> 플러스
          </span>
        </div>
        {/* 흐린 미리보기 */}
        <p className="text-[12px] text-[var(--monari-ink-muted)] mb-3">
          힌트: <span className="font-700 text-[var(--monari-ink-soft)]">{previewValue}</span>
        </p>
        <div className="pointer-events-none select-none" style={{ filter: "blur(5px)", opacity: 0.5 }}>
          {children}
        </div>
      </div>
      {/* 잠금 오버레이 */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-4 pt-12"
        style={{ background: "linear-gradient(to top, var(--monari-surface) 60%, transparent)" }}
      >
        <Link
          href="/settings/subscription"
          className="flex items-center gap-2 rounded-[14px] bg-[var(--monari-hero)] px-5 py-2.5 text-[13px] font-800 text-white shadow-[0_4px_16px_rgba(109,40,217,0.35)] transition active:scale-[0.97]"
        >
          <Lock size={13} strokeWidth={3} /> 전체 보기 — 모나리 플러스
        </Link>
      </div>
    </div>
  );
}
