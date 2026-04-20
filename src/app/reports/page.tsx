import { MonthlyReportQuickForm } from "@/components/finance/action-forms";
import { ReportBarGroup, SpendVsSaveSplit } from "@/components/finance/report-visuals";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle, ProgressBar } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export default async function ReportsPage() {
  await requireParentSession();
  const [dashboard, bundle] = await Promise.all([getDashboardView(), getAppDataBundle()]);
  const primary = dashboard.children[0];
  const spendRatio = primary
    ? Math.round((primary.monthReport.totalSpend / Math.max(primary.monthReport.totalAllowance, 1)) * 100)
    : 0;
  const saveRatio = primary
    ? Math.round((primary.monthReport.totalSave / Math.max(primary.monthReport.totalAllowance, 1)) * 100)
    : 0;

  return (
    <MobileAppShell title="이번달 리포트" subtitle="리포트">
      {!primary && (
        <div className="monari-card p-5 text-center">
          <p className="text-[15px] font-700 text-[var(--monari-ink)] mb-1">아이를 먼저 등록해주세요</p>
          <p className="monari-meta mb-4">리포트를 보려면 아이 프로필이 필요합니다.</p>
          <a href="/settings" className="monari-btn-primary px-5">아이 등록하기 →</a>
        </div>
      )}

      {primary && (
        <>
          {/* Hero */}
          <div className="monari-hero mb-4">
            <p className="text-[13px] font-700 text-white/70 mb-2">{primary.child.name}</p>
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
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <p className="monari-meta mb-1">이번달 약속 이행</p>
                  <p className="text-[36px] font-800 leading-none tracking-tight text-[var(--monari-hero)]">
                    {primary.monthReport.behaviorSuccessRate.toFixed(1)}%
                  </p>
                </div>
                <p className="text-[12px] leading-5 text-[var(--monari-ink-soft)] text-right max-w-[18ch]">
                  약속 이행률이 높을수록 이자 설명과 저축 대화가 쉬워집니다.
                </p>
              </div>
              <ProgressBar value={primary.monthReport.behaviorSuccessRate} />
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

          {/* Coaching insights */}
          <section className="mb-4">
            <SectionTitle>코칭 메모</SectionTitle>
            <div className="space-y-3 mt-3">
              <InsightCard
                title="저축 습관이 안정적이에요"
                body="이번달 저축이 지출의 절반 이상입니다. 이자 개념을 짧고 반복적으로 연결해 주세요."
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
