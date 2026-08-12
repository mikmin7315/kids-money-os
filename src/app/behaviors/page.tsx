import { BehaviorRuleCreateForm } from "@/components/finance/management-forms";
import { DeleteBehaviorRuleButton, ToggleBehaviorRuleButton } from "@/components/finance/delete-rule-button";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import Link from "next/link";
import { ClipboardList, Pencil } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatPercent, formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BehaviorsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);
  const autoRules = activeRules.filter((r) => !r.requiresParentApproval).length;
  const reviewRules = activeRules.filter((r) => r.requiresParentApproval).length;
  const recentLogs = bundle.behaviorLogs.slice(0, 10);
  const pendingCount = bundle.behaviorLogs.filter((l) => l.status === "pending").length;

  // 이자율 시뮬레이션 — 이번 달 달성률 기반 다음 달 이자율 예측
  const todayKST = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const monthKey = todayKST.slice(0, 7);
  const daysElapsed = new Date(todayKST).getDate();

  const simulations = bundle.children.map((child) => {
    const policy = bundle.interestPolicies.find((p) => p.childId === child.id);
    const baseRate = policy?.baseInterestRate ?? 0;
    const childLogs = bundle.behaviorLogs.filter((l) => l.childId === child.id && l.date.startsWith(monthKey));

    const ruleResults = activeRules
      .filter((r) => r.interestDelta !== 0)
      .map((rule) => {
        const ruleLogs = childLogs.filter((l) => l.behaviorRuleId === rule.id && (l.status === "approved" || l.status === "completed"));
        let willApply = false;
        let currentPct = 0;
        if (rule.ruleCategory === "monthly_goal") {
          willApply = ruleLogs.length > 0;
          currentPct = willApply ? 100 : 0;
        } else {
          currentPct = daysElapsed > 0 ? Math.round((ruleLogs.length / daysElapsed) * 100) : 0;
          willApply = currentPct >= (rule.monthlyTargetRate ?? 80);
        }
        return { rule, willApply, currentPct };
      });

    const projectedRate = baseRate + ruleResults.filter((r) => r.willApply).reduce((s, r) => s + r.rule.interestDelta, 0);
    return { child, baseRate, projectedRate, ruleResults };
  });

  return (
    <AppNavShell pendingCount={pendingCount}>
      <PageHero>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">행동 약속 관리</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-4">아이와 함께 정한 약속이에요</h1>
        <div className="grid grid-cols-3 gap-2">
          <HeroPill label="전체 약속" value={`${activeRules.length}개`} />
          <HeroPill label="자동 완료" value={`${autoRules}개`} />
          <HeroPill label="확인 필요" value={`${reviewRules}개`} />
        </div>
      </PageHero>
      <PageContent className="pt-4">
      {/* Active rules */}
      <section className="mb-4">
        <SectionTitle>현재 약속 목록</SectionTitle>
        {bundle.behaviorRules.length === 0 ? (
          <div className="monari-card mt-3 px-5 py-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
              <ClipboardList size={26} />
            </span>
            <p className="mt-4 text-[16px] font-extrabold text-[var(--monari-ink)]">아직 약속이 없어요</p>
            <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">아이와 함께 지킬 약속을 만들면 이자율이 올라가요.</p>
            <p className="mt-4 text-[12px] font-bold text-[var(--monari-hero)]">↓ 아래에서 약속 만들기</p>
          </div>
        ) : (
          <div className="space-y-2 mt-3">
            {bundle.behaviorRules.map((rule) => (
              <div
                key={rule.id}
                className="monari-card px-4 py-3.5"
                style={{
                  opacity: rule.isActive ? 1 : 0.6,
                  borderLeft: rule.isActive ? "3px solid var(--monari-hero)" : "3px solid var(--monari-line)",
                }}
              >
                {/* 상단: 제목 + 액션 버튼 */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-extrabold text-[var(--monari-ink)] leading-tight truncate">{rule.title}</p>
                    {rule.description && (
                      <p className="mt-0.5 text-[12px] text-[var(--monari-ink-muted)] truncate">{rule.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/behaviors/${rule.id}/edit`}
                      aria-label={`${rule.title} 수정`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)] active:scale-90 transition"
                    >
                      <Pencil size={13} />
                    </Link>
                    <ToggleBehaviorRuleButton ruleId={rule.id} isActive={rule.isActive} label={rule.title} />
                    <DeleteBehaviorRuleButton ruleId={rule.id} label={rule.title} />
                  </div>
                </div>

                {/* 중단: 배지 */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className={`inline-flex h-[22px] items-center rounded-[8px] px-[8px] text-[11px] font-bold ${rule.requiresParentApproval ? "bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]" : "bg-[var(--monari-done-bg)] text-[var(--monari-done)]"}`}>
                    {rule.requiresParentApproval ? "확인 후 반영" : "자동 반영"}
                  </span>
                  {!rule.isActive && (
                    <span className="inline-flex h-[22px] items-center rounded-[8px] px-[8px] text-[11px] font-bold bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]">
                      비활성
                    </span>
                  )}
                </div>

                {/* 하단: 보상 + 이자 인라인 */}
                <div className="flex items-center gap-3 text-[12px]">
                  <span className="font-semibold text-[var(--monari-ink-muted)]">보상</span>
                  <span className="font-extrabold text-[var(--monari-hero)]">{formatWon(rule.rewardAmount)}</span>
                  <span className="text-[var(--monari-line)]">·</span>
                  <span className="font-semibold text-[var(--monari-ink-muted)]">이자</span>
                  <span className="font-extrabold text-[var(--monari-done)]">
                    {rule.interestDelta !== 0 ? `+${formatPercent(rule.interestDelta)}` : "—"}
                  </span>
                  {rule.interestDelta !== 0 && (
                    <span className="text-[var(--monari-ink-muted)]">
                      ({rule.ruleCategory === "recurring" ? `${rule.monthlyTargetRate}% 달성 시` : "1회 달성"})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 다음 달 이자율 시뮬레이션 */}
      {simulations.length > 0 && simulations.some((s) => s.ruleResults.length > 0) && (
        <section className="mb-5">
          <p className="monari-eyebrow mb-1">이자율 예측</p>
          <p className="text-[16px] font-extrabold text-[var(--monari-ink)] mb-3">다음 달 이자율 시뮬레이션</p>
          <div className="space-y-3">
            {simulations.map(({ child, baseRate, projectedRate, ruleResults }) => (
              <div key={child.id} className="monari-card overflow-hidden">
                {/* 헤더: 아이 이름 + 예측 이자율 */}
                <div className="flex items-center justify-between px-5 py-4" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #4F7FFF 100%)" }}>
                  <div>
                    <p className="text-[11px] font-bold text-white/60 mb-0.5">{child.name}의 다음 달 예상</p>
                    <div className="flex items-end gap-1.5">
                      <p className="text-[32px] font-black text-white tabular-nums leading-none">{projectedRate}%</p>
                      {projectedRate > baseRate && (
                        <p className="mb-1 text-[13px] font-extrabold text-[#86efac]">+{projectedRate - baseRate}%p</p>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-white/55">기본 {baseRate}% + 약속 보너스</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[44px] leading-none">{projectedRate >= baseRate + 2 ? "🚀" : projectedRate > baseRate ? "📈" : "📊"}</p>
                  </div>
                </div>

                {/* 규칙별 달성 현황 */}
                {ruleResults.length > 0 && (
                  <div className="divide-y divide-[var(--monari-line)] px-5">
                    {ruleResults.map(({ rule, willApply, currentPct }) => (
                      <div key={rule.id} className="flex items-center gap-3 py-3.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${willApply ? "bg-[var(--monari-done)]" : "bg-[var(--monari-minus)]"}`} />
                            <p className="text-[13px] font-bold text-[var(--monari-ink)] truncate">{rule.title}</p>
                          </div>
                          {rule.ruleCategory === "monthly_goal" ? (
                            <p className="text-[11px] font-semibold text-[var(--monari-ink-muted)]">
                              1회 달성 기준 · {willApply ? "이번 달 달성 ✓" : "아직 미달성"}
                            </p>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="h-1.5 flex-1 rounded-full bg-[var(--monari-surface-soft)] overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${willApply ? "bg-[var(--monari-done)]" : "bg-[var(--monari-pending)]"}`}
                                    style={{ width: `${Math.min(currentPct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-extrabold tabular-nums text-[var(--monari-ink-muted)] w-[32px] text-right">{currentPct}%</span>
                              </div>
                              <p className="text-[11px] font-semibold text-[var(--monari-ink-muted)]">
                                목표 {rule.monthlyTargetRate ?? 80}% · {willApply ? "달성 중 ✓" : `${(rule.monthlyTargetRate ?? 80) - currentPct}%p 부족`}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className={`shrink-0 rounded-[10px] px-2.5 py-1.5 text-center ${willApply ? "bg-[var(--monari-done-bg)]" : "bg-[var(--monari-surface-soft)]"}`}>
                          <p className={`text-[11px] font-extrabold ${willApply ? "text-[var(--monari-done)]" : "text-[var(--monari-ink-muted)]"}`}>
                            {willApply ? "+" : ""}{rule.interestDelta}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[var(--monari-ink-muted)] text-right">※ 이번 달 현재까지의 달성률 기준 예측이에요</p>
        </section>
      )}

      {/* Create form */}
      <section className="mb-4">
        <SectionTitle>새 약속 만들기</SectionTitle>
        <div className="monari-card mt-3 p-5">
          <p className="text-[13px] text-[var(--monari-ink-soft)] mb-4">
            보상 금액과 이자율 변화를 같이 설정하면, 약속이 아이의 통장에 바로 연결돼요.
          </p>
          <BehaviorRuleCreateForm />
        </div>
      </section>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <section className="mb-4">
          <SectionTitle>최근 약속 기록</SectionTitle>
          <div className="monari-card mt-3 px-4 divide-y divide-[var(--monari-line)]">
            {recentLogs.map((log) => {
              const rule = bundle.behaviorRules.find((r) => r.id === log.behaviorRuleId);
              const child = bundle.children.find((c) => c.id === log.childId);
              const statusMap: Record<string, { label: string; cls: string }> = {
                pending: { label: "확인 대기", cls: "text-[var(--monari-pending)]" },
                completed: { label: "완료", cls: "text-[var(--monari-done)]" },
                approved: { label: "확인됨", cls: "text-[var(--monari-done)]" },
                rejected: { label: "다시 도전", cls: "text-[var(--monari-ink-muted)]" },
              };
              const display = statusMap[log.status] ?? { label: log.status, cls: "text-[var(--monari-ink-muted)]" };
              return (
                <div key={log.id} className="flex items-center justify-between py-[14px]">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--monari-ink)]">{rule?.title ?? "약속"}</p>
                    <p className="monari-meta mt-[2px]">{child?.name} · {log.date.slice(5).replace("-", ".")}</p>
                  </div>
                  <span className={`text-[13px] font-bold ${display.cls}`}>{display.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {recentLogs.some((log) => log.status === "pending") && (
        <Link href="/approvals" className="monari-btn-outline w-full">
          확인 대기 약속 처리하기
        </Link>
      )}
      </PageContent>
    </AppNavShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-center"><p className="text-[10px] font-semibold text-white/70">{label}</p><p className="mt-0.5 text-sm font-black text-white">{value}</p></div>;
}

