import {
  InlineBehaviorDecisionForm,
  InlineBorrowDecisionForm,
  InlineCashSpendDecisionForm,
} from "@/components/finance/action-forms";
import Image from "next/image";
import Link from "next/link";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const pendingBehaviorLogs = bundle.behaviorLogs.filter((item) => item.status === "pending");
  const pendingBorrows = bundle.borrowRequests.filter((item) => item.status === "pending");
  const activeBorrows = bundle.borrowRequests.filter(
    (item) => item.status === "approved" || item.status === "partial"
  );

  const pendingCashRequests = bundle.cashSpendRequests.filter((r) => r.status === "pending");
  const total = pendingBehaviorLogs.length + pendingBorrows.length + pendingCashRequests.length;
  const headline = total > 0 ? `${total}건 확인이 필요해요` : "모두 확인 완료!";

  return (
    <MobileAppShell title={headline} subtitle="승인 센터">
      <div className="mb-4 rounded-[20px] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="grid grid-cols-4 divide-x divide-[#f3f4f6]">
          <StatItem label="약속 대기" value={pendingBehaviorLogs.length} color="#7c3aed" />
          <StatItem label="현금 대기" value={pendingCashRequests.length} color="#dc2626" />
          <StatItem label="미리쓰기" value={pendingBorrows.length} color="#d97706" />
          <StatItem label="상환 중" value={activeBorrows.length} color="#059669" />
        </div>
      </div>

      {/* Behavior approvals */}
      <section className="mb-4">
        <SectionTitle>약속 확인 대기</SectionTitle>
        {pendingBehaviorLogs.length === 0 ? (
          <div className="monari-card mt-3 px-5 py-6 text-center">
            <p className="text-[17px] font-700 text-[var(--monari-ink)]">확인할 약속이 없어요</p>
            <p className="monari-meta mt-1">아이의 다음 약속 활동을 기다리고 있어요.</p>
            <Link href="/behaviors" className="monari-btn-ghost mt-4 h-11 px-5 text-[15px]">약속 관리하기</Link>
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
                      <p className="text-[14px] font-700 text-[var(--monari-primary)] mb-1">{child?.name}</p>
                      <p className="text-[19px] font-800 text-[var(--monari-ink)] leading-tight">{rule?.title}</p>
                      {rule?.description && (
                        <p className="mt-1 text-[15px] text-[var(--monari-ink-soft)]">{rule.description}</p>
                      )}
                      {log.memo && (
                        <p className="mt-2 rounded-[14px] bg-[rgba(43,43,43,0.04)] px-3 py-2 text-[15px] italic text-[var(--monari-ink-soft)]">
                          &ldquo;{log.memo}&rdquo;
                        </p>
                      )}
                      {(log as { photo_url?: string; photo_taken_at?: string }).photo_url && (
                        <div className="mt-3 overflow-hidden rounded-[14px]">
                          <div className="relative">
                            <Image
                              src={(log as { photo_url?: string }).photo_url!}
                              alt="약속 인증 사진"
                              width={800}
                              height={448}
                              unoptimized
                              className="w-full max-h-56 object-cover"
                            />
                            {(log as { photo_taken_at?: string }).photo_taken_at && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5 text-[11px] font-700 text-white">
                                📅 {new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date((log as { photo_taken_at?: string }).photo_taken_at!))}
                              </div>
                            )}
                          </div>
                        </div>
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

      {/* Cash spend approvals */}
      <section className="mb-4">
        <SectionTitle>현금 사용 확인 대기</SectionTitle>
        {pendingCashRequests.length === 0 ? (
          <div className="monari-card mt-3 px-5 py-6 text-center">
            <p className="text-[17px] font-700 text-[var(--monari-ink)]">확인할 현금 사용이 없어요</p>
            <p className="monari-meta mt-1">아이가 현금을 쓰면 여기서 확인할 수 있어요.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {pendingCashRequests.map((req) => {
              const child = bundle.children.find((c) => c.id === req.childId);
              return (
                <div key={req.id} className="monari-card p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[14px] font-700 text-[var(--monari-primary)] mb-1">{child?.name}</p>
                      <p className="text-[19px] font-800 text-[var(--monari-ink)] leading-tight">
                        {formatWon(req.amount)} 현금 썼어요
                      </p>
                      {req.memo && (
                        <p className="mt-2 rounded-[14px] bg-[rgba(43,43,43,0.04)] px-3 py-2 text-[15px] italic text-[var(--monari-ink-soft)]">
                          &ldquo;{req.memo}&rdquo;
                        </p>
                      )}
                      <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">{req.spendDate}</p>
                    </div>
                    <span className="shrink-0 inline-flex h-[26px] items-center rounded-[10px] px-[10px] text-[12px] font-700 bg-[#fff1f2] text-[#be123c]">
                      확인 대기
                    </span>
                  </div>
                  <div className="border-t border-[var(--monari-line)] pt-4">
                    <InlineCashSpendDecisionForm requestId={req.id} />
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
          <div className="monari-card mt-3 px-5 py-6 text-center">
            <p className="text-[17px] font-700 text-[var(--monari-ink)]">미리쓰기 요청이 없어요</p>
            <p className="monari-meta mt-1">새 요청이 오면 사용 목적과 상환 조건을 확인할 수 있어요.</p>
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
                        <p className="mt-2 rounded-[14px] bg-[rgba(43,43,43,0.04)] px-3 py-2 text-[15px] italic text-[var(--monari-ink-soft)]">
                          &ldquo;{request.purpose}&rdquo;
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
                    <span className="inline-flex h-[26px] items-center rounded-[10px] bg-[var(--monari-pending-bg)] px-[10px] text-[12px] font-700 text-[var(--monari-pending)]">
                      상환 진행
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

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center py-5 gap-1.5">
      <p style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af" }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{value}건</p>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#f5f3ff] p-4">
      <p className="text-[12px] text-[#6d28d9]/60" style={{ fontWeight: 600 }}>{label}</p>
      <p className="mt-1 text-[#4c1d95]" style={{ fontSize: 18, fontWeight: 800 }}>{value}</p>
    </div>
  );
}
