import Link from "next/link";
import { ArrowRight, Lock, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  const behRate = primary ? Math.round(primary.monthReport.behaviorSuccessRate) : 0;

  const primaryChild = primary ? bundle.children.find((c) => c.id === primary.child.id) : null;
  const ageGroup = getAgeGroup(primaryChild?.birthYear);
  const peer = primary ? await getPeerStats(ageGroup) : null;

  const coachingInsight = !primary
    ? null
    : saveRatio >= 30
      ? { title: "저축 습관이 자리잡고 있어요", body: `이번달 용돈의 ${saveRatio}%를 저축했어요. 저축 목표와 이자를 함께 이야기해 보세요.` }
      : spendRatio >= 80
        ? { title: "소비 계획을 함께 점검해 보세요", body: `이번달 용돈의 ${spendRatio}%를 사용했어요. 다음 구매 전 필요한 것과 원하는 것을 나눠보면 좋아요.` }
        : { title: "돈의 균형을 함께 살펴보세요", body: "지출과 저축 기록을 보며 다음달에 유지할 습관 하나를 정해 보세요." };

  return (
    <MobileAppShell title="이번달 리포트" subtitle="리포트">
      {/* 아이 선택 탭 */}
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
          {/* ── Hero ── */}
          <div className="monari-hero mb-5">
            <p className="text-[12px] font-700 uppercase tracking-widest text-white/60 mb-1">{primary.child.name}의 이달 리포트</p>
            <p className="text-[22px] font-900 leading-tight tracking-[-0.04em] text-white mb-5">
              {behRate >= 80
                ? "이번달 약속을\n아주 잘 지켰어요"
                : saveRatio >= 30
                  ? "저축 습관이\n자리잡고 있어요"
                  : "이번달 돈 습관을\n한눈에 확인해요"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <HeroPill label="저축률" value={`${saveRatio}%`} up={saveRatio >= 20} />
              <HeroPill label="약속 달성" value={`${behRate}%`} up={behRate >= 60} />
              <HeroPill label="지출 비중" value={`${spendRatio}%`} up={spendRatio <= 60} />
            </div>
          </div>

          {/* ── 핵심 수치 ── */}
          <section className="mb-5">
            <SectionTitle>핵심 수치</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <KpiCard label="이번달 용돈" value={formatWon(primary.monthReport.totalAllowance)} accent />
              <KpiCard label="저축한 금액" value={formatWon(primary.monthReport.totalSave)} />
              <KpiCard label="사용한 금액" value={formatWon(primary.monthReport.totalSpend)} />
              <KpiCard label="빌린 금액" value={formatWon(primary.monthReport.totalBorrowed)} muted />
            </div>
          </section>

          {/* ── 또래 비교 (수익 핵심 섹션) ── */}
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>또래 비교</SectionTitle>
              <span className="rounded-full bg-[var(--monari-hero-lo)] px-2.5 py-1 text-[11px] font-800 text-[var(--monari-hero)]">
                {ageGroup}세
              </span>
            </div>

            {!peer ? (
              <div className="monari-card p-5 text-center">
                <p className="text-[14px] font-700 text-[var(--monari-ink)]">아직 비교 데이터가 부족해요</p>
                <p className="monari-meta mt-1">같은 연령대 표본이 10명 이상 모이면 또래 통계를 보여드려요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 무료 카드 — 또래 평균 용돈 */}
                <div
                  className="rounded-[20px] p-5"
                  style={{
                    background: "linear-gradient(135deg,#7C3AED18,#7C3AED08)",
                    border: "1.5px solid var(--monari-hero-lo)",
                  }}
                >
                  <p className="text-[11px] font-700 tracking-widest uppercase text-[var(--monari-ink-muted)] mb-3">
                    전국 또래 평균 용돈
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[28px] font-900 tracking-[-0.03em] tabular-nums text-[var(--monari-hero)]">
                        {formatWon(peer.avgAllowance)}
                        <span className="ml-1 text-[13px] font-700 text-[var(--monari-ink-muted)]">/월</span>
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--monari-ink-muted)]">익명 표본 {peer.sampleSize}명</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-600 text-[var(--monari-ink-muted)] mb-0.5">우리 아이</p>
                      <p className="text-[22px] font-900 tabular-nums text-[var(--monari-ink)]">
                        {formatWon(primary.monthReport.totalAllowance)}
                      </p>
                      {primary.monthReport.totalAllowance > 0 && (
                        <AllowanceDiff
                          child={primary.monthReport.totalAllowance}
                          peer={peer.avgAllowance}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 잠금 섹션들 */}
                <PremiumLockedCard
                  isPremium={IS_PREMIUM}
                  previewLabel="저축률 비교"
                  previewValue={`또래 ${peer.savingsRate}% vs 우리 아이 ${saveRatio}%`}
                  hint={saveRatio >= peer.savingsRate ? "또래보다 저축을 더 많이 해요" : "또래 평균보다 저축이 적어요"}
                >
                  <ComparisonBar label="또래 평균" value={peer.savingsRate} color="var(--monari-ink-muted)" />
                  <ComparisonBar label={String(primary.child.name)} value={saveRatio} color="var(--monari-hero)" />
                </PremiumLockedCard>

                <PremiumLockedCard
                  isPremium={IS_PREMIUM}
                  previewLabel="행동 달성률 비교"
                  previewValue={`또래 ${peer.behaviorRate}% vs 우리 아이 ${behRate}%`}
                  hint={behRate >= peer.behaviorRate ? "약속 달성이 또래보다 높아요" : "약속 달성이 또래 평균 이하예요"}
                >
                  <ComparisonBar label="또래 평균" value={peer.behaviorRate} color="var(--monari-ink-muted)" />
                  <ComparisonBar label={String(primary.child.name)} value={behRate} color="#10b981" />
                </PremiumLockedCard>

                {peer.spendBreakdown.length > 0 && (
                  <PremiumLockedCard
                    isPremium={IS_PREMIUM}
                    previewLabel="또래 지출 카테고리"
                    previewValue={`1위 ${peer.spendBreakdown[0].label} ${peer.spendBreakdown[0].pct}%`}
                    hint={`같은 나이 아이들이 가장 많이 쓰는 곳은 ${peer.spendBreakdown[0].label}이에요`}
                  >
                    <div className="space-y-2.5">
                      {peer.spendBreakdown.map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-[12px] mb-1">
                            <span className="text-[var(--monari-ink-soft)]">{item.label}</span>
                            <span className="font-800 text-[var(--monari-ink)]">{item.pct}%</span>
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
            )}
          </section>

          {/* ── 약속 달성률 ── */}
          <section className="mb-5">
            <SectionTitle>약속 달성률</SectionTitle>
            <div className="monari-card mt-3 p-5">
              <BehaviorRing rate={primary.monthReport.behaviorSuccessRate} />
            </div>
          </section>

          {/* ── 차트 ── */}
          <section className="mb-5">
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

          {/* ── 코칭 포인트 ── */}
          <section className="mb-5">
            <SectionTitle>이번달 코칭 포인트</SectionTitle>
            <div className="space-y-3 mt-3">
              <CoachCard title={coachingInsight!.title} body={coachingInsight!.body} />
              <CoachCard
                title="미리쓰기는 목적 중심으로"
                body="미리쓰기 이유를 아이가 직접 쓰게 하면 충동 구매보다 계획 소비로 전환하기 쉽습니다."
              />
            </div>
          </section>

          {/* ── 리포트 생성 ── */}
          <section className="mb-5">
            <SectionTitle>리포트 생성</SectionTitle>
            <div className="monari-card mt-3 p-5">
              <MonthlyReportQuickForm childOptions={bundle.children} />
            </div>
          </section>

          {/* ── 아이 비교 (다자녀) ── */}
          {allChildren.length > 1 && (
            <section className="mb-5">
              <SectionTitle>아이 비교</SectionTitle>
              <div className="mt-3 space-y-2">
                {allChildren.map((c) => {
                  const ratio = Math.round((c.monthReport.totalSave / Math.max(c.monthReport.totalAllowance, 1)) * 100);
                  const bRate = Math.round(c.monthReport.behaviorSuccessRate);
                  return (
                    <Link key={c.child.id} href={`/reports?child=${c.child.id}`} className="monari-card block p-4 transition active:scale-[0.99]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[14px] font-800 text-[var(--monari-ink)]">{String(c.child.name)}</p>
                        <span className="text-[12px] font-700 text-[var(--monari-hero)]">약속 {bRate}%</span>
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

function HeroPill({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-white/10 border border-white/15 px-2 py-2.5 gap-0.5">
      <p className="text-[10px] font-600 text-white/60">{label}</p>
      <p className="text-[15px] font-900 text-white">{value}</p>
      {up !== undefined && (
        <span className={`text-[9px] font-700 ${up ? "text-emerald-300" : "text-rose-300"}`}>
          {up ? "▲ 좋음" : "▼ 확인"}
        </span>
      )}
    </div>
  );
}

function KpiCard({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div
      className="rounded-[18px] p-4"
      style={{
        background: accent
          ? "linear-gradient(135deg,var(--monari-hero-lo),transparent)"
          : "var(--monari-surface)",
        border: "1px solid var(--monari-line)",
      }}
    >
      <p className="text-[11px] font-600 text-[var(--monari-ink-muted)]">{label}</p>
      <p
        className="mt-1 text-[18px] font-900 tabular-nums tracking-[-0.02em]"
        style={{ color: muted ? "var(--monari-ink-muted)" : accent ? "var(--monari-hero)" : "var(--monari-ink)" }}
      >
        {value}
      </p>
    </div>
  );
}

function AllowanceDiff({ child, peer }: { child: number; peer: number }) {
  if (child === peer) return <span className="text-[11px] font-700 text-[var(--monari-ink-muted)] flex items-center gap-0.5"><Minus size={10} /> 또래와 같아요</span>;
  const above = child > peer;
  const diff = Math.abs(child - peer);
  const Icon = above ? TrendingUp : TrendingDown;
  return (
    <span className={`mt-0.5 flex items-center gap-0.5 text-[11px] font-800 ${above ? "text-emerald-500" : "text-rose-400"}`}>
      <Icon size={11} strokeWidth={2.5} />
      {above ? "▲" : "▼"} {formatWon(diff)} 차이
    </span>
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
  hint,
  children,
}: {
  isPremium: boolean;
  previewLabel: string;
  previewValue: string;
  hint: string;
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
    <div className="relative rounded-[20px] overflow-hidden" style={{ border: "1px solid var(--monari-line)" }}>
      <div className="p-4" style={{ background: "var(--monari-surface)" }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-700 text-[var(--monari-ink)]">{previewLabel}</p>
          <span className="flex items-center gap-1 rounded-full bg-[var(--monari-hero-lo)] px-2 py-0.5 text-[10px] font-800 text-[var(--monari-hero)]">
            <Sparkles size={9} strokeWidth={3} /> 플러스
          </span>
        </div>
        {/* 힌트 */}
        <p className="text-[11px] text-[var(--monari-ink-muted)] mb-3">
          힌트: <span className="font-700 text-[var(--monari-ink-soft)]">{hint}</span>
        </p>
        <p className="text-[11px] font-600 text-[var(--monari-ink-muted)] mb-3 italic">
          {previewValue}
        </p>
        {/* 블러 미리보기 */}
        <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.45 }}>
          {children}
        </div>
      </div>
      {/* 잠금 오버레이 */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-4 pt-14"
        style={{ background: "linear-gradient(to top, var(--monari-surface) 55%, transparent)" }}
      >
        <Link
          href="/settings/subscription"
          className="flex items-center gap-2 rounded-[14px] bg-[var(--monari-hero)] px-5 py-2.5 text-[13px] font-800 text-white shadow-[0_4px_20px_rgba(109,40,217,0.35)] transition active:scale-[0.97]"
        >
          <Lock size={12} strokeWidth={3} />
          전체 보기 — 모나리 플러스
          <ArrowRight size={12} strokeWidth={3} />
        </Link>
      </div>
    </div>
  );
}

function CoachCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-[20px] p-5"
      style={{ background: "var(--monari-surface)", border: "1px solid var(--monari-line)" }}
    >
      <p className="text-[14px] font-800 text-[var(--monari-ink)] mb-2">{title}</p>
      <p className="text-[13px] leading-[1.6] text-[var(--monari-ink-soft)]">{body}</p>
    </div>
  );
}
