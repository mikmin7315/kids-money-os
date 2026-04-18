import {
  InlineBehaviorDecisionForm,
  InlineBorrowDecisionForm,
} from "@/components/finance/action-forms";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge, MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";

export default async function ApprovalsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const pendingBehaviorLogs = bundle.behaviorLogs.filter((item) => item.status === "pending");
  const pendingBorrows = bundle.borrowRequests.filter((item) => item.status === "pending");
  const activeBorrows = bundle.borrowRequests.filter((item) => item.status !== "pending");

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="승인함" title="부모 승인 센터" right={<HeaderActions />} />

        <Section title="대기 중인 행동" description="부모 승인이 필요한 약속을 하나씩 처리합니다.">
          {pendingBehaviorLogs.length === 0 ? (
            <Surface>
              <p className="text-sm text-[var(--color-muted)]">대기 중인 행동 기록이 없습니다.</p>
            </Surface>
          ) : (
            <div className="space-y-3">
              {pendingBehaviorLogs.map((log) => {
                const child = bundle.children.find((item) => item.id === log.childId);
                const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
                return (
                  <Surface key={log.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{child?.name}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{rule?.title}</p>
                        {log.memo ? (
                          <p className="mt-1 text-sm text-[var(--color-soft)]">메모: {log.memo}</p>
                        ) : null}
                      </div>
                      <Badge tone="amber">대기 중</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniInfo label="보상" value={formatWon(rule?.rewardAmount ?? 0)} />
                      <MiniInfo label="이자율 변화" value={`${rule?.interestDelta ?? 0}%`} />
                    </div>
                    <div className="mt-4">
                      <InlineBehaviorDecisionForm behaviorLogId={log.id} />
                    </div>
                  </Surface>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="대기 중인 미리쓰기" description="미리쓰기 승인은 하나의 신뢰 큐에서 처리합니다.">
          {pendingBorrows.length === 0 ? (
            <Surface>
              <p className="text-sm text-[var(--color-muted)]">대기 중인 미리쓰기 요청이 없습니다.</p>
            </Surface>
          ) : (
            <div className="space-y-3">
              {pendingBorrows.map((request) => {
                const child = bundle.children.find((item) => item.id === request.childId);
                return (
                  <Surface key={request.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{child?.name}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{request.purpose}</p>
                      </div>
                      <Badge tone="amber">대기 중</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniInfo label="요청 금액" value={formatWon(request.requestedAmount)} />
                      <MiniInfo
                        label="상환 방식"
                        value={request.repaymentMode === "next_allowance" ? "다음 용돈" : "분할 상환"}
                      />
                    </div>
                    <div className="mt-4">
                      <InlineBorrowDecisionForm borrowRequestId={request.id} />
                    </div>
                  </Surface>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="진행 중인 미리쓰기" description="승인 후 상환 진행 현황을 부모가 볼 수 있습니다.">
          {activeBorrows.length === 0 ? (
            <Surface>
              <p className="text-sm text-[var(--color-muted)]">진행 중인 미리쓰기가 없습니다.</p>
            </Surface>
          ) : (
            <div className="space-y-3">
              {activeBorrows.map((request) => {
                const schedules = bundle.borrowRepayments.filter((item) => item.borrowRequestId === request.id);
                return (
                  <Surface key={request.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{request.purpose}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{formatWon(request.requestedAmount)}</p>
                      </div>
                      <Badge tone={request.status === "partial" ? "amber" : "emerald"}>
                        {request.status === "partial" ? "부분 상환" : "완료"}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      {schedules.map((repayment) => (
                        <div key={repayment.id} className="rounded-3xl bg-[var(--color-card)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">만기일 {repayment.dueDate}</p>
                            <p className="text-sm font-semibold">
                              {formatWon(repayment.paidAmount)} / {formatWon(repayment.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Surface>
                );
              })}
            </div>
          )}
        </Section>
      </MobileShell>
      <BottomNav pathname="/approvals" />
    </PageContainer>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-[var(--color-card)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
