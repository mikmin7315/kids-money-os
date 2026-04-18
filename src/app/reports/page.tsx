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
        <AppHeader eyebrow="Monthly Report" title="Monthly report" right={<HeaderActions />} />

        <Section title="Core numbers" description="Show the most trusted parent-facing numbers first.">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Allowance" value={formatWon(primary.monthReport.totalAllowance)} />
            <Metric label="Spend" value={formatWon(primary.monthReport.totalSpend)} />
            <Metric label="Save" value={formatWon(primary.monthReport.totalSave)} />
            <Metric label="Borrowed" value={formatWon(primary.monthReport.totalBorrowed)} />
          </div>
        </Section>

        <Section title="Behavior rate" description="Behavior data acts as the leading indicator for money habits.">
          <Surface>
            <div className="h-4 overflow-hidden rounded-full bg-[var(--color-card)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#f97316)]"
                style={{ width: `${primary.monthReport.behaviorSuccessRate}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              This month behavior success rate is {primary.monthReport.behaviorSuccessRate.toFixed(1)}%.
            </p>
          </Surface>
        </Section>

        <Section title="Visuals" description="Simple chart blocks make the MVP feel more like a real finance product.">
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

        <Section title="Report action" description="This writes the monthly summary row through the server action layer.">
          <MonthlyReportQuickForm childOptions={bundle.children} />
        </Section>

        <Section title="Coaching notes" description="Text insights are enough for the MVP.">
          <div className="space-y-3">
            <InsightCard
              title="Savings habit looks stable"
              body="Savings is more than half of spend this month. Pair the number with a simple interest explanation."
            />
            <InsightCard
              title="Borrowing should stay purpose-driven"
              body="Ask the child to write the reason for borrowing so it feels planned, not impulsive."
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
