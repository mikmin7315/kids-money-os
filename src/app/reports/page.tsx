import { MonthlyReportQuickForm } from "@/components/finance/action-forms";
import { ReportBarGroup, SpendVsSaveSplit } from "@/components/finance/report-visuals";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { InfoCard } from "@/components/ui/cards";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export default async function ReportsPage() {
  await requireParentSession();
  const [dashboard, bundle] = await Promise.all([getDashboardView(), getAppDataBundle()]);
  const primary = dashboard.children[0];
  const spendRatio = primary ? Math.round((primary.monthReport.totalSpend / Math.max(primary.monthReport.totalAllowance, 1)) * 100) : 0;
  const saveRatio = primary ? Math.round((primary.monthReport.totalSave / Math.max(primary.monthReport.totalAllowance, 1)) * 100) : 0;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="월간 리포트" title="이번달 리포트" right={<HeaderActions />} />

        {!primary && (
          <Section title="아이를 먼저 등록해주세요" description="리포트를 보려면 아이 프로필이 필요합니다.">
            <Surface>
              <a href="/settings" className="inline-flex h-11 items-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-bold text-white">
                아이 등록하러 가기 →
              </a>
            </Surface>
          </Section>
        )}
        {primary && (
          <>
            <section className="mt-6">
              <Surface className="relative overflow-hidden border-[rgba(87,70,49,0.1)] bg-[linear-gradient(135deg,rgba(255,248,236,0.98),rgba(232,244,240,0.92))] px-6 py-6">
                <div className="pointer-events-none absolute -left-10 top-2 h-28 w-28 rounded-full border border-[rgba(200,122,34,0.18)]" />
                <div className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-[rgba(15,139,124,0.08)] blur-2xl" />
                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">{primary.child.name}</p>
                  <h2 className="mt-4 font-display text-[2rem] font-semibold leading-[1.06] tracking-tight">
                    이번달 돈의 흐름과
                    <br />
                    행동 성과를 같이 봅니다.
                  </h2>
                  <p className="mt-4 max-w-[30ch] text-sm leading-6 text-[var(--color-muted)]">
                    용돈 대비 지출과 저축 비중, 행동 성공률을 한 번에 읽을 수 있게 요약했습니다.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <HeroPill label="지출 비중" value={`${spendRatio}%`} />
                    <HeroPill label="저축 비중" value={`${saveRatio}%`} />
                    <HeroPill label="행동 성공률" value={`${primary.monthReport.behaviorSuccessRate.toFixed(0)}%`} />
                  </div>
                </div>
              </Surface>
            </section>

            <Section title="핵심 수치" description="이번달의 기준 숫자를 먼저 고정해서 보도록 정리했습니다.">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="용돈" value={formatWon(primary.monthReport.totalAllowance)} />
                <Metric label="지출" value={formatWon(primary.monthReport.totalSpend)} />
                <Metric label="저축" value={formatWon(primary.monthReport.totalSave)} />
                <Metric label="빌린 돈" value={formatWon(primary.monthReport.totalBorrowed)} />
              </div>
            </Section>

            <Section title="행동 성공률" description="행동 데이터는 금융 습관의 선행 지표로 해석합니다.">
              <InfoCard className="border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.66),rgba(249,243,234,0.94))]">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-soft)]">Behavior</p>
                    <p className="mt-3 font-display text-4xl font-semibold leading-none">
                      {primary.monthReport.behaviorSuccessRate.toFixed(1)}%
                    </p>
                  </div>
                  <p className="max-w-[18ch] text-right text-xs leading-5 text-[var(--color-muted)]">
                    약속 이행률이 높을수록 이자 설명과 저축 대화가 쉬워집니다.
                  </p>
                </div>
                <div className="mt-5 h-4 overflow-hidden rounded-full bg-[rgba(160,143,122,0.16)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#d7a553,#0f8b7c)]"
                    style={{ width: `${primary.monthReport.behaviorSuccessRate}%` }}
                  />
                </div>
              </InfoCard>
            </Section>

            <Section title="시각화" description="비교 차트와 비중 차트를 같은 온도로 묶었습니다.">
              <div className="space-y-3">
                <ReportBarGroup
                  allowance={primary.monthReport.totalAllowance}
                  spend={primary.monthReport.totalSpend}
                  save={primary.monthReport.totalSave}
                  borrowed={primary.monthReport.totalBorrowed}
                />
                <SpendVsSaveSplit spend={primary.monthReport.totalSpend} save={primary.monthReport.totalSave} />
              </div>
            </Section>

            <Section title="리포트 생성" description="이번달 요약 데이터를 저장하거나 다시 생성합니다.">
              <MonthlyReportQuickForm childOptions={bundle.children} />
            </Section>

            <Section title="코칭 메모" description="아이와 대화할 때 바로 꺼내 쓸 수 있는 문장입니다.">
              <div className="space-y-3">
                <InsightCard
                  title="저축 습관이 안정적이에요"
                  body="이번달 저축이 지출의 절반 이상입니다. 이자 개념을 짧고 반복적으로 연결해 주세요."
                />
                <InsightCard
                  title="미리쓰기는 목적 중심으로"
                  body="미리쓰기 이유를 아이가 직접 쓰게 하면 충동 구매보다 계획 소비로 전환하기 쉽습니다."
                />
              </div>
            </Section>
          </>
        )}
      </MobileShell>
      <BottomNav pathname="/reports" />
    </PageContainer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <InfoCard className="border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(239,228,210,0.9))] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
    </InfoCard>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <InfoCard className="border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(249,243,234,0.94))]">
      <p className="font-display text-xl font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
    </InfoCard>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(87,70,49,0.08)] bg-white/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-2 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
