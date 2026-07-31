import {
  InlineBehaviorDecisionForm,
  InlineBorrowDecisionForm,
  InlineCashSpendDecisionForm,
  InlineRepayInstallmentForm,
} from "@/components/finance/action-forms";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

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
  const childrenWithPolicy = bundle.children.filter((c) => bundle.interestPolicies.some((p) => p.childId === c.id));
  const hasOngoing = activeBorrows.length > 0 || childrenWithPolicy.length > 0;
  const trulyEmpty = total === 0 && !hasOngoing;

  return (
    <AppNavShell pendingCount={total}>
      <PageHero>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">승인 센터</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-4">
          {total > 0 ? `${total}건 확인이 필요해요` : "모두 확인 완료!"}
        </h1>

        {/* 대기 항목만 3-col pill */}
        <div className="grid grid-cols-3 gap-2">
          <HeroPill label="약속 대기" value={`${pendingBehaviorLogs.length}건`} />
          <HeroPill label="현금 대기" value={`${pendingCashRequests.length}건`} />
          <HeroPill label="미리쓰기 대기" value={`${pendingBorrows.length}건`} />
        </div>

        {/* 상환 진행 중 — 대기와 성격이 달라 별도 표시 */}
        {activeBorrows.length > 0 && (
          <p className="mt-3 text-[12px] font-semibold text-white/55">
            상환 진행 중 {activeBorrows.length}건
          </p>
        )}
      </PageHero>

      <PageContent className="pt-4 space-y-4">

        {/* 진짜 완전 비어있을 때만 풀 empty state */}
        {trulyEmpty && (
          <div className="monari-card px-5 py-10 text-center">
            <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
            <p className="text-[17px] font-extrabold text-[var(--monari-ink)]">모두 확인 완료!</p>
            <p className="monari-meta mt-1 mb-4">대기 중인 항목이 없어요.</p>
            <Link href="/behaviors" className="monari-btn-ghost h-10 px-5 text-[14px]">약속 관리하기</Link>
          </div>
        )}

        {/* 대기 항목 없고 진행 중만 있을 때 인라인 안내 */}
        {total === 0 && hasOngoing && (
          <div className="rounded-[16px] border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] px-4 py-3 flex items-center gap-2">
            <span className="text-[18px]">✅</span>
            <p className="text-[13px] font-semibold text-[var(--monari-ink-soft)]">확인 대기 항목이 없어요. 아래 진행 중인 항목을 확인하세요.</p>
          </div>
        )}

        {/* ① 약속 확인 대기 */}
        {pendingBehaviorLogs.length > 0 && (
          <section className="mb-4">
            <SectionTitle>약속 확인 대기</SectionTitle>
            <div className="space-y-3 mt-3">
              {pendingBehaviorLogs.map((log) => {
                const child = bundle.children.find((item) => item.id === log.childId);
                const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
                return (
                  <div key={log.id} className="monari-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[var(--monari-primary)] mb-1">{child?.name}</p>
                        <p className="text-[19px] font-extrabold text-[var(--monari-ink)] leading-tight">{rule?.title}</p>
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
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5 text-[11px] font-bold text-white">
                                  📅 {new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date((log as { photo_taken_at?: string }).photo_taken_at!))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 날짜 — "확인 대기" 중복 배지 대신 */}
                      <span className="shrink-0 text-[12px] font-semibold text-[var(--monari-ink-muted)]">{formatShortDate(log.date)}</span>
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
          </section>
        )}

        {/* ② 현금 사용 확인 대기 */}
        {pendingCashRequests.length > 0 && (
          <section className="mb-4">
            <SectionTitle>현금 사용 확인 대기</SectionTitle>
            <div className="space-y-3 mt-3">
              {pendingCashRequests.map((req) => {
                const child = bundle.children.find((c) => c.id === req.childId);
                return (
                  <div key={req.id} className="monari-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[var(--monari-primary)] mb-1">{child?.name}</p>
                        <p className="text-[19px] font-extrabold text-[var(--monari-ink)] leading-tight">
                          {formatWon(req.amount)} 현금 썼어요
                        </p>
                        {req.memo && (
                          <p className="mt-2 rounded-[14px] bg-[rgba(43,43,43,0.04)] px-3 py-2 text-[15px] italic text-[var(--monari-ink-soft)]">
                            &ldquo;{req.memo}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[12px] font-semibold text-[var(--monari-ink-muted)]">{formatShortDate(req.spendDate)}</span>
                    </div>
                    <div className="border-t border-[var(--monari-line)] pt-4">
                      <InlineCashSpendDecisionForm requestId={req.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ③ 미리쓰기 확인 대기 */}
        {pendingBorrows.length > 0 && (
          <section className="mb-4">
            <SectionTitle>미리쓰기 확인 대기</SectionTitle>
            <div className="space-y-3 mt-3">
              {pendingBorrows.map((request) => {
                const child = bundle.children.find((item) => item.id === request.childId);
                return (
                  <div key={request.id} className="monari-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-[var(--monari-primary)] mb-1">{child?.name}</p>
                        <p className="text-[17px] font-extrabold text-[var(--monari-ink)] leading-tight">
                          {formatWon(request.requestedAmount)} 미리 쓰고 싶어요
                        </p>
                        {request.purpose && (
                          <p className="mt-2 rounded-[14px] bg-[rgba(43,43,43,0.04)] px-3 py-2 text-[15px] italic text-[var(--monari-ink-soft)]">
                            &ldquo;{request.purpose}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[12px] font-semibold text-[var(--monari-ink-muted)]">{formatShortDate(request.createdAt)}</span>
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
          </section>
        )}

        {/* 진행 중 구분선 */}
        {hasOngoing && (
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-[var(--monari-line)]" />
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-[var(--monari-ink-muted)]">진행 중</span>
            <div className="h-px flex-1 bg-[var(--monari-line)]" />
          </div>
        )}

        {/* ④ 상환 진행 중 */}
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
                        <p className="text-[12px] font-bold text-[var(--monari-primary)]">{child?.name}</p>
                        {request.purpose && (
                          <p className="text-[15px] font-bold text-[var(--monari-ink)] mt-0.5">{request.purpose}</p>
                        )}
                        <p className="monari-meta">{formatWon(request.requestedAmount)}</p>
                      </div>
                      <span className="inline-flex h-[26px] items-center rounded-[10px] bg-[var(--monari-pending-bg)] px-[10px] text-[12px] font-bold text-[var(--monari-pending)]">
                        상환 진행
                      </span>
                    </div>
                    {schedules.length > 0 && (
                      <>
                        <div className="flex justify-between text-[12px] text-[var(--monari-ink-muted)] mb-1.5">
                          <span>상환 진행</span>
                          <span>{paidCount}/{schedules.length}회</span>
                        </div>
                        <div className="monari-progress-track mb-3">
                          <div className="monari-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        {schedules.filter((s) => s.status !== "paid").slice(0, 1).map((s) => (
                          <div key={s.id} className="border-t border-[var(--monari-line)] pt-3">
                            <p className="text-[12px] text-[var(--monari-ink-muted)] mb-2">
                              다음 상환: {s.dueDate} · {formatWon(s.amount)}
                            </p>
                            <InlineRepayInstallmentForm repaymentId={s.id} amount={s.amount} />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ⑤ 이자 확정 */}
        {childrenWithPolicy.length > 0 && (
          <section className="mb-8">
            <SectionTitle>이자 확정</SectionTitle>
            <p className="mt-1 mb-3 text-[12px] text-[var(--monari-ink-muted)]">행동 달성률 기반 이자를 확정하고 지급해요.</p>
            <div className="space-y-2">
              {childrenWithPolicy.map((child) => (
                <Link
                  key={child.id}
                  href={`/settings/interest-confirm/${child.id}`}
                  className="monari-card flex items-center justify-between px-4 py-3.5 transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
                      <TrendingUp size={17} />
                    </span>
                    <div>
                      <p className="text-[14px] font-bold text-[var(--monari-ink)]">{child.name}</p>
                      <p className="text-[12px] text-[var(--monari-ink-muted)]">이자율 확정 및 지급 처리</p>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-[var(--monari-hero)]">확정하기 →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </PageContent>
    </AppNavShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-center">
      <p className="text-[10px] font-semibold text-white/70">{label}</p>
      <p className="mt-0.5 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--monari-hero-lo)] p-4">
      <p className="text-[12px] text-[var(--monari-hero)]/60" style={{ fontWeight: 600 }}>{label}</p>
      <p className="mt-1 text-[var(--monari-hero)]" style={{ fontSize: 18, fontWeight: 800 }}>{value}</p>
    </div>
  );
}
