import { BehaviorLogQuickForm } from "@/components/finance/action-forms";
import { BehaviorRuleCreateForm } from "@/components/finance/management-forms";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge, MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatPercent, formatWon } from "@/lib/format";

export default async function BehaviorsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Behavior Rules" title="Behavior system" right={<HeaderActions />} />

        <Section title="Why this model" description="Reward and interest shifts live together so behavior affects finance directly.">
          <Surface>
            <ul className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
              <li>A behavior can change cash reward, interest rate, or both.</li>
              <li>Parent approval stays optional so the app can support both trust-first and check-first homes.</li>
              <li>This structure scales cleanly into missions, badges, and AI coaching later.</li>
            </ul>
          </Surface>
        </Section>

        <Section title="Rule list" description="Parent-owned rule catalog for the MVP.">
          <div className="space-y-3">
            {bundle.behaviorRules.map((rule) => (
              <Surface key={rule.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{rule.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{rule.description}</p>
                  </div>
                  <Badge tone={rule.requiresParentApproval ? "amber" : "emerald"}>
                    {rule.requiresParentApproval ? "Needs approval" : "Auto apply"}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <RuleMetric label="Reward" value={formatWon(rule.rewardAmount)} />
                  <RuleMetric label="Rate delta" value={formatPercent(rule.interestDelta)} />
                </div>
              </Surface>
            ))}
          </div>
        </Section>

        <Section title="Create new rule" description="Use this when parents want to add a new household behavior without leaving the app.">
          <BehaviorRuleCreateForm />
        </Section>

        <Section title="Action test" description="This server action form lets you verify the behavior log flow without wiring a final design yet.">
          <BehaviorLogQuickForm childOptions={bundle.children} behaviorRules={bundle.behaviorRules} />
        </Section>

        <Section title="Recent logs" description="Latest child check-ins and parent approval state.">
          <div className="space-y-3">
            {bundle.behaviorLogs.map((log) => {
              const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
              return (
                <Surface key={log.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{rule?.title}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{log.date}</p>
                    </div>
                    <Badge tone={toneForStatus(log.status)}>{log.status}</Badge>
                  </div>
                </Surface>
              );
            })}
          </div>
        </Section>
      </MobileShell>
      <BottomNav pathname="/behaviors" />
    </PageContainer>
  );
}

function RuleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-[var(--color-card)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function toneForStatus(status: string) {
  if (status === "approved" || status === "completed") return "emerald" as const;
  if (status === "pending") return "amber" as const;
  return "rose" as const;
}
