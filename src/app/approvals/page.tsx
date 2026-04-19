import {
  InlineBehaviorDecisionForm,
  InlineBorrowDecisionForm,
} from "@/components/finance/action-forms";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge, EmptyState, HeroPill, MobileShell, PageContainer, PageHero, Section } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";

export default async function ApprovalsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const pendingBehaviorLogs = bundle.behaviorLogs.filter((item) => item.status === "pending");
  const pendingBorrows = bundle.borrowRequests.filter((item) => item.status === "pending");
  const activeBorrows = bundle.borrowRequests.filter(
    (item) => item.status === "approved" || item.status === "partial"
  );

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="확인 센터" title="확인할 내용" right={<HeaderActions />} />

        <PageHero
          eyebrow="함께 정한 약속"
          title={
            pendingBehaviorLogs.length + pendingBorrows.length > 0 ? (
              <>아이가 기다리고<br />있어요</>
            ) : (
              <>지금은 확인할<br />내용이 없어요</>
            )
          }
          description="아이가 요청한 내용이나 약속을 확인하는 공간이에요. 빠를수록 아이가 덜 기다려요."
          stats={
            <div className="grid grid-cols-3 gap-3">
              <HeroPill label="약속 대기" value={`${pendingBehaviorLogs.length}`} />
              <HeroPill label="미리쓰기 대기" value={`${pendingBorrows.length}`} />
              <HeroPill label="상환 진행 중" value={`${activeBorrows.length}`} />
            </div>
          }
        />

        <Section title="약속 확인 대기" description="아이가 약속을 지켰다고 알려왔어요. 확인해주세요.">
          {pendingBehaviorLogs.length === 0 ? (
            <EmptyState
              message="대기 중인 약속 확인이 없어요."
              hint="아이가 약속을 체크하면 여기에 나타나요."
            />
          ) : (
            <div className="space-y-3">
              {pendingBehaviorLogs.map((log) => {
                const child = bundle.children.find((item) => item.id === log.childId);
                const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
                return (
                  <div
                    key={log.id}
                    className="rounded-[28px] border border-[rgba(87,70,49,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))] p-5"
                  >
                    {/* 누가 / 무엇을 */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                          {child?.name}
                        </p>
                        <p className="mt-2 font-display text-xl font-semibold leading-tight">{rule?.title}</p>
                        {rule?.description && (
                          <p className="mt-1 text-sm text-[var(--color-muted)]">{rule.description}</p>
                        )}
                        {log.memo && (
                          <p className="mt-2 rounded-xl bg-[rgba(87,70,49,0.05)] px-3 py-2 text-sm italic text-[var(--color-muted)]">
                            "{log.memo}"
                          </p>
                        )}
                      </div>
                      <Badge tone="amber">확인 대기</Badge>
                    </div>

                    {/* 반영되면 어떻게 달라지는지 */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <ContextBox label="확인하면 보상" value={formatWon(rule?.rewardAmount ?? 0)} />
                      <ContextBox label="이자율 변화" value={`+${rule?.interestDelta ?? 0}%`} />
                    </div>

                    <div className="mt-4 border-t border-[rgba(87,70,49,0.06)] pt-4">
                      <InlineBehaviorDecisionForm behaviorLogId={log.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="미리쓰기 확인 대기" description="아이가 미리 쓸 수 있도록 요청했어요. 이유를 보고 결정해주세요.">
          {pendingBorrows.length === 0 ? (
            <EmptyState
              message="대기 중인 미리쓰기 요청이 없어요."
              hint="아이가 미리쓰기를 요청하면 여기에 나타나요."
            />
          ) : (
            <div className="space-y-3">
              {pendingBorrows.map((request) => {
                const child = bundle.children.find((item) => item.id === request.childId);
                return (
                  <div
                    key={request.id}
                    className="rounded-[28px] border border-[rgba(87,70,49,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(239,228,210,0.92))] p-5"
                  >
                    {/* 누가 / 무엇을 / 왜 */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                          {child?.name}
                        </p>
                        <p className="mt-2 font-display text-xl font-semibold leading-tight">
                          {formatWon(request.requestedAmount)} 미리 쓰고 싶어요
                        </p>
                        {request.purpose && (
                          <p className="mt-2 rounded-xl bg-[rgba(87,70,49,0.05)] px-3 py-2 text-sm italic text-[var(--color-muted)]">
                            "{request.purpose}"
                          </p>
                        )}
                      </div>
                      <Badge tone="amber">확인 대기</Badge>
                    </div>

                    {/* 반영 조건 */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <ContextBox label="요청 금액" value={formatWon(request.requestedAmount)} />
                      <ContextBox
                        label="상환 방식"
                        value={request.repaymentMode === "next_allowance" ? "다음 용돈에서" : "분할 상환"}
                      />
                    </div>

                    <div className="mt-4 border-t border-[rgba(87,70,49,0.06)] pt-4">
                      <InlineBorrowDecisionForm borrowRequestId={request.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {activeBorrows.length > 0 && (
          <Section title="상환 진행 중" description="허락한 미리쓰기가 잘 갚아지고 있어요.">
            <div className="space-y-3">
              {activeBorrows.map((request) => {
                const child = bundle.children.find((item) => item.id === request.childId);
                const schedules = bundle.borrowRepayments.filter((item) => item.borrowRequestId === request.id);
                const paidCount = schedules.filter((s) => s.status === "paid").length;
                return (
                  <div
                    key={request.id}
                    className="rounded-[28px] border border-[rgba(87,70,49,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                          {child?.name}
                        </p>
                        <p className="mt-1 font-display text-lg font-semibold">{request.purpose}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{formatWon(request.requestedAmount)}</p>
                      </div>
                      <Badge tone={request.status === "partial" ? "amber" : "emerald"}>
                        {request.status === "partial" ? "상환 중" : "정산 완료"}
                      </Badge>
                    </div>
                    {schedules.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-muted)]">
                          <span>상환 진행</span>
                          <span>{paidCount}/{schedules.length}회</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[rgba(87,70,49,0.10)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                            style={{ width: `${(paidCount / schedules.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </MobileShell>
      <BottomNav pathname="/approvals" />
    </PageContainer>
  );
}

function ContextBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[rgba(87,70,49,0.08)] bg-white/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-2.5 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
