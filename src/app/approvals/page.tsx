import {
  InlineBehaviorDecisionForm,
  InlineBorrowDecisionForm,
} from "@/components/finance/action-forms";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
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

  const total = pendingBehaviorLogs.length + pendingBorrows.length;
  const headline = total > 0 ? `아이가 기다리고 있어요 ${total}건` : "지금은 확인할 내용이 없어요";

  return (
    <MobileAppShell title={headline} subtitle="승인 센터">
      {/* Hero */}
      <div className="monari-hero mb-4">
        <div className="grid grid-cols-3 gap-2">
          <HeroPill label="약속 대기" value={`${pendingBehaviorLogs.length}건`} />
          <HeroPill label="미리쓰기" value={`${pendingBorrows.length}건`} />
          <HeroPill label="상환 중" value={`${activeBorrows.length}건`} />
        </div>
      </div>

      {/* Behavior approvals */}
      <section className="mb-4">
        <SectionTitle>약속 확인 대기</SectionTitle>
        {pendingBehaviorLogs.length === 0 ? (
          <div className="monari-card mt-3 px-4 py-5 text-center">
            <p className="text-[14px] font-600 text-[var(--monari-ink-muted)]">대기 중인 약속이 없어요</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {pendingBehaviorLogs.map((log) => {
              const child = bundle.children.find((item) => item.id === log.childId);
              const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
              return (
                <div key={log.id} className="monari-card p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[12px] font-700 text-[var(--monari-primary)] mb-1">{child?.name}</p>
                      <p className="text-[17px] font-800 text-[var(--monari-ink)] leading-tight">{rule?.title}</p>
                      {rule?.description && (
                        <p className="mt-1 text-[13px] text-[var(--monari-ink-soft)]">{rule.description}</p>
                      )}
                      {log.memo && (
                        <p className="mt-2 rounded-[14px] bg-[rgba(43,43,43,0.04)] px-3 py-2 text-[13px] italic text-[var(--monari-ink-soft)]">
                          "{log.memo}"
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 inline-flex h-[26px] items-center rounded-[10px] px-[10px] text-[12px] font-700 bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]">
                      확인 대기
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <MetricBox label="보상 금액" value={formatWon(rule?.rewardAmount ?? 0)} />
                    <MetricBox label="이자율 변화" value={`+${rule?.interestDelta ?? 0}%`} />
                  </div>

                  <div className="border-t border-[var(--monari-line)] pt-4">
                    <InlineBehaviorDecisionForm behaviorLogId={log.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Borrow approvals */}
      <section className="mb-4">
        <SectionTitle>미리쓰기 확인 대기</SectionTitle>
        {pendingBorrows.length === 0 ? (
          <div className="monari-card mt-3 px-4 py-5 text-center">
            <p className="text-[14px] font-600 text-[var(--monari-ink-muted)]">대기 중인 미리쓰기 요청이 없어요</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {pendingBorrows.map((request) => {
              const child = bundle.children.find((item) => item.id === request.childId);
              return (
                <div key={request.id} className="monari-card p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[12px] font-700 text-[var(--monari-primary)] mb-1">{child?.name}</p>
                      <p className="text-[17px] font-800 text-[var(--monari-ink)] leading-tight">
                        {formatWon(request.requestedAmount)} 미리 쓰고 싶어요
                      </p>
                      {request.purpose && (
                        <p className="mt-2 rounded-[14px] bg-[rgba(43,43,43,0.04)] px-3 py-2 text-[13px] italic text-[var(--monari-ink-soft)]">
                          "{request.purpose}"
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 inline-flex h-[26px] items-center rounded-[10px] px-[10px] text-[12px] font-700 bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]">
                      확인 대기
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <MetricBox label="요청 금액" value={formatWon(request.requestedAmount)} />
                    <MetricBox
                      label="상환 방식"
                      value={request.repaymentMode === "next_allowance" ? "다음 용돈" : "분할 상환"}
                    />
                  </div>

                  <div className="border-t border-[var(--monari-line)] pt-4">
                    <InlineBorrowDecisionForm borrowRequestId={request.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Active borrows */}
      {activeBorrows.length > 0 && (
        <section className="mb-4">
          <SectionTitle>상환 진행 중</SectionTitle>
          <div className="space-y-3 mt-3">
            {activeBorrows.map((request) => {
              const child = bundle.children.find((item) => item.id === request.childId);
              const schedules = bundle.borrowRepayments.filter((item) => item.borrowRequestId === request.id);
              const paidCount = schedules.filter((s) => s.status === "paid").length;
              const progress = schedules.length > 0 ? (paidCount / schedules.length) * 100 : 0;
              return (
                <div key={request.id} className="monari-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[12px] font-700 text-[var(--monari-primary)]">{child?.name}</p>
                      <p className="text-[15px] font-700 text-[var(--monari-ink)] mt-0.5">{request.purpose}</p>
                      <p className="monari-meta">{formatWon(request.requestedAmount)}</p>
                    </div>
                    <span className={`inline-flex h-[26px] items-center rounded-[10px] px-[10px] text-[12px] font-700 ${request.status === "partial" ? "bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]" : "bg-[var(--monari-done-bg)] text-[var(--monari-done)]"}`}>
                      {request.status === "partial" ? "상환 중" : "완료"}
                    </span>
                  </div>
                  {schedules.length > 0 && (
                    <>
                      <div className="flex justify-between text-[12px] text-[var(--monari-ink-muted)] mb-1.5">
                        <span>상환 진행</span>
                        <span>{paidCount}/{schedules.length}회</span>
                      </div>
                      <div className="monari-progress-track">
                        <div className="monari-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
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

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--monari-line)] bg-[rgba(43,43,43,0.03)] p-3">
      <p className="monari-meta">{label}</p>
      <p className="text-[15px] font-800 text-[var(--monari-ink)] mt-1">{value}</p>
    </div>
  );
}
