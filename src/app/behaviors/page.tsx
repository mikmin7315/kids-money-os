import { BehaviorRuleCreateForm } from "@/components/finance/management-forms";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge, EmptyState, HeroPill, MobileShell, PageContainer, PageHero, Section } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatPercent, formatWon } from "@/lib/format";

export default async function BehaviorsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);
  const autoRules = activeRules.filter((r) => !r.requiresParentApproval).length;
  const reviewRules = activeRules.filter((r) => r.requiresParentApproval).length;
  const recentLogs = bundle.behaviorLogs.slice(0, 10);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="행동 약속" title="함께 정한 약속" right={<HeaderActions />} />

        <PageHero
          eyebrow="약속과 돈의 연결"
          title={<>행동이 이자를<br />만들어요</>}
          description="아이와 함께 정한 약속이 지켜지면 보상이 생기고, 쌓이면 이자율이 올라가요."
          stats={
            <div className="grid grid-cols-3 gap-3">
              <HeroPill label="전체 약속" value={`${activeRules.length}개`} />
              <HeroPill label="자동 완료" value={`${autoRules}개`} />
              <HeroPill label="확인 필요" value={`${reviewRules}개`} />
            </div>
          }
        />

        <Section title="현재 약속 목록" description="아이와 함께 정한 약속들이에요.">
          {activeRules.length === 0 ? (
            <EmptyState
              message="아직 정한 약속이 없어요."
              hint="아래에서 첫 번째 약속을 만들어보세요."
            />
          ) : (
            <div className="space-y-3">
              {activeRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-display text-lg font-semibold leading-tight">{rule.title}</p>
                      {rule.description && (
                        <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">{rule.description}</p>
                      )}
                    </div>
                    <Badge tone={rule.requiresParentApproval ? "amber" : "emerald"}>
                      {rule.requiresParentApproval ? "확인 후 반영" : "자동 반영"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <RuleMetric label="약속 보상" value={formatWon(rule.rewardAmount)} />
                    <RuleMetric label="이자율 변화" value={`+${formatPercent(rule.interestDelta)}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="새 약속 만들기" description="아이와 함께 이야기한 뒤 약속을 추가해보세요.">
          <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="mb-4 text-sm leading-6 text-[var(--color-muted)]">
              보상 금액과 이자율 변화를 같이 설정하면, 약속이 아이의 통장에 바로 연결돼요.
            </p>
            <BehaviorRuleCreateForm />
          </div>
        </Section>

        {recentLogs.length > 0 && (
          <Section title="최근 약속 기록" description="아이가 체크한 약속 기록이에요.">
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const rule = bundle.behaviorRules.find((r) => r.id === log.behaviorRuleId);
                const child = bundle.children.find((c) => c.id === log.childId);
                const statusMap: Record<string, { label: string; tone: "neutral" | "sky" | "emerald" | "amber" | "rose" }> = {
                  pending: { label: "확인 대기", tone: "amber" },
                  completed: { label: "완료", tone: "emerald" },
                  approved: { label: "확인됨", tone: "emerald" },
                  rejected: { label: "다시 도전", tone: "neutral" },
                };
                const display = statusMap[log.status] ?? { label: log.status, tone: "neutral" as const };
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-[20px] border border-[var(--border-soft)] bg-[var(--bg-surface-alt)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{rule?.title ?? "약속"}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {child?.name} · {log.date}
                      </p>
                    </div>
                    <Badge tone={display.tone}>{display.label}</Badge>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </MobileShell>
      <BottomNav pathname="/behaviors" />
    </PageContainer>
  );
}

function RuleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--bg-surface-alt)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-2.5 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
