import { MonthlyReportQuickForm } from "@/components/finance/action-forms";
import { ReportBarGroup, SpendVsSaveSplit } from "@/components/finance/report-visuals";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export default async function ReportsPage() {
  await requireParentSession();
  const [dashboard, bundle] = await Promise.all([getDashboardView(), getAppDataBundle()]);
  const primary = dashboard.children[0];

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="월간 리포트" title="이번달 리포트" right={<HeaderActions />} />

        <Section title="핵심 수치" description="이번달 가장 중요한 숫자를 먼저 확인하세요.">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="용돈" value={formatWon(primary.monthReport.totalAllowance)} />
            <Metric label="지출" value={formatWon(primary.monthReport.totalSpend)} />
            <Metric label="저축" value={formatWon(primary.monthReport.totalSave)} />
            <Metric label="빌린 돈" value={formatWon(primary.monthReport.totalBorrowed)} />
          </div>
        </Section>

        <Section title="행동 성공률" description="행동 데이터는 금융 습관의 선행 지표입니다.">
          <Surface>
            <div className="h-4 overflow-hidden rounded-full bg-[var(--color-card)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#f97316)]"
                style={{ width: `${primary.monthReport.behaviorSuccessRate}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              이번달 행동 성공률은 {primary.monthReport.behaviorSuccessRate.toFixed(1)}%입니다.
            </p>
          </Surface>
        </Section>

        <Section title="시각화" description="간단한 차트로 이번달 금융 현황을 한눈에 파악하세요.">
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

        <Section title="리포트 생성" description="이번달 요약 데이터를 저장합니다.">
          <MonthlyReportQuickForm childOptions={bundle.children} />
        </Section>

        <Section title="코칭 메모" description="아이와 함께 나눌 수 있는 인사이트입니다.">
          <div className="space-y-3">
            <InsightCard
              title="저축 습관이 안정적이에요"
              body="이번달 저축이 지출의 절반 이상입니다. 이자 개념을 간단하게 설명해주세요."
            />
            <InsightCard
              title="미리쓰기는 목적 중심으로"
              body="아이가 미리쓰기 이유를 직접 적게 하면 충동적 소비가 아닌 계획적 소비가 됩니다."
            />
          </div>
        </Section>
      </MobileShell>
      <BottomNav pathname="/reports" />
    </PageContainer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Surface className="p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </Surface>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <Surface>
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
    </Surface>
  );
}
