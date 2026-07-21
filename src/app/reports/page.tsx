import Link from "next/link";
import { MonthlyReportQuickForm } from "@/components/finance/action-forms";
import { ReportBarGroup, SpendVsSaveSplit, BehaviorRing } from "@/components/finance/report-visuals";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  await requireParentSession();
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
      ? {
          title: "저축 습관을 잘 만들고 있어요",
          body: `이번달 용돈의 ${saveRatio}%를 저축했어요. 저축 목표와 이자를 함께 이야기해 보세요.`,
        }
      : spendRatio >= 80
        ? {
            title: "소비 계획을 함께 점검해 보세요",
            body: `이번달 용돈의 ${spendRatio}%를 사용했어요. 다음 구매 전 필요한 것과 원하는 것을 나눠보면 좋아요.`,
          }
        : {
            title: "돈의 균형을 함께 살펴보세요",
            body: "지출과 저축 기록을 보며 다음달에 유지할 습관 하나를 정해 보세요.",
          };

  return (
    <MobileAppShell title="이번달 리포트" subtitle="리포트">
      {/* 아이 전환 탭 (P-27: 다중 아이 비교) */}
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
              <InsightCard
                title={coachingInsight!.title}
                body={coachingInsight!.body}
              />
              <InsightCard
                title="미리쓰기는 목적 중심으로"
                body="미리쓰기 이유를 아이가 직접 쓰게 하면 충동 구매보다 계획 소비로 전환하기 쉽습니다."
              />
            </div>
          </section>

          {/* Report generate */}
          <section className="mb-4">
            <SectionTitle>리포트 생성</SectionTitle>
            <div className="monari-card mt-3 p-5">
              <MonthlyReportQuickForm childOptions={bundle.children} />
            </div>
          </section>

          {/* P-27: 아이 비교 (다중 아이인 경우) */}
          {allChildren.length > 1 && (
            <section className="mb-4">
              <SectionTitle>아이 비교 (P-27)</SectionTitle>
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

          {/* P-28/29: 분석 상세 */}
          <section className="mb-4">
            <SectionTitle>분석 상세 (P-28/29)</SectionTitle>
            <div className="mt-3 space-y-3">
              <div className="monari-card p-4">
                <p className="text-[13px] font-700 text-[var(--monari-ink)] mb-3">월별 저축 목표 달성도</p>
                {[
                  { label: "저축 비중", value: saveRatio, color: "bg-[var(--monari-done)]" },
                  { label: "지출 비중", value: spendRatio, color: "bg-[var(--monari-minus)]" },
                  { label: "약속 달성", value: Math.round(primary.monthReport.behaviorSuccessRate), color: "bg-[var(--monari-hero)]" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="mb-2">
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-[var(--monari-ink-muted)]">{label}</span>
                      <span className="font-700 text-[var(--monari-ink)]">{value}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--monari-surface-soft)]">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="monari-card p-4">
                <p className="text-[13px] font-700 text-[var(--monari-ink)] mb-2">이번달 요약</p>
                <ul className="space-y-1.5 text-[12px] leading-5 text-[var(--monari-ink-soft)]">
                  <li>• 총 용돈 {formatWon(primary.monthReport.totalAllowance)} 중 지출 {formatWon(primary.monthReport.totalSpend)}</li>
                  <li>• 저축 {formatWon(primary.monthReport.totalSave)} · 미리쓰기 {formatWon(primary.monthReport.totalBorrowed)}</li>
                  <li>• 행동 약속 달성률 {primary.monthReport.behaviorSuccessRate.toFixed(1)}%</li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </MobileAppShell>
  );
}

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
