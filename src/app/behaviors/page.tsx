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
        <AppHeader eyebrow="행동 규칙" title="행동 약속 관리" right={<HeaderActions />} />

        <Section title="이 시스템의 원리" description="보상과 이자율 변동이 연결되어 행동이 금융에 직접 영향을 줍니다.">
          <Surface>
            <ul className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
              <li>행동 약속은 현금 보상, 이자율 변동, 또는 둘 다에 영향을 줄 수 있습니다.</li>
              <li>부모 확인은 선택 사항으로 설정할 수 있어 신뢰 우선 또는 확인 우선 방식을 모두 지원합니다.</li>
              <li>이 구조는 미션, 배지, AI 코칭으로 자연스럽게 확장될 수 있습니다.</li>
            </ul>
          </Surface>
        </Section>

        <Section title="행동 규칙 목록" description="부모가 설정한 행동 약속 규칙 목록입니다.">
          <div className="space-y-3">
            {bundle.behaviorRules.map((rule) => (
              <Surface key={rule.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{rule.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{rule.description}</p>
                  </div>
                  <Badge tone={rule.requiresParentApproval ? "amber" : "emerald"}>
                    {rule.requiresParentApproval ? "부모 확인 필요" : "자동 적용"}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <RuleMetric label="보상" value={formatWon(rule.rewardAmount)} />
                  <RuleMetric label="이자율 변동" value={formatPercent(rule.interestDelta)} />
                </div>
              </Surface>
            ))}
          </div>
        </Section>

        <Section title="새 규칙 만들기" description="앱을 벗어나지 않고 새 행동 약속을 추가하세요.">
          <BehaviorRuleCreateForm />
        </Section>

        <Section title="행동 기록 테스트" description="행동 기록 흐름을 확인할 수 있는 테스트 폼입니다.">
          <BehaviorLogQuickForm childOptions={bundle.children} behaviorRules={bundle.behaviorRules} />
        </Section>

        <Section title="최근 기록" description="아이의 최근 행동 체크인과 부모 승인 상태입니다.">
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
                    <Badge tone={toneForStatus(log.status)}>{statusLabel(log.status)}</Badge>
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

function statusLabel(status: string) {
  if (status === "pending") return "대기";
  if (status === "approved") return "승인";
  if (status === "completed") return "완료";
  if (status === "rejected") return "반려";
  return status;
}
