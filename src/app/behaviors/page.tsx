import { BehaviorRuleCreateForm } from "@/components/finance/management-forms";
import { DeleteBehaviorRuleButton, ToggleBehaviorRuleButton } from "@/components/finance/delete-rule-button";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
import Link from "next/link";
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

  return (
    <MobileAppShell title="함께 정한 약속" subtitle="약속">
      <section className="monari-hero mb-6">
        <div className="relative z-10">
          <p className="text-sm font-bold text-white/75">행동 약속 현황</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">아이와 함께 정한 약속이에요</h2>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <HeroPill label="전체 약속" value={`${activeRules.length}개`} />
            <HeroPill label="자동 완료" value={`${autoRules}개`} />
            <HeroPill label="확인 필요" value={`${reviewRules}개`} />
          </div>
        </div>
      </section>
      {/* Active rules */}
      <section className="mb-4">
        <SectionTitle>현재 약속 목록</SectionTitle>
        {bundle.behaviorRules.length === 0 ? (
          <div className="monari-card mt-3 px-4 py-5 text-center">
            <p className="text-[14px] font-700 text-[var(--monari-ink)]">첫 약속을 만들어 보세요</p>
            <p className="monari-meta mt-1">아래에서 첫 번째 약속을 만들어보세요</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {bundle.behaviorRules.map((rule) => (
              <div key={rule.id} className="monari-card p-5" style={{ opacity: rule.isActive ? 1 : 0.55 }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <p className="text-[16px] font-800 text-[var(--monari-ink)] leading-tight">{rule.title}</p>
                    {rule.description && (
                      <p className="mt-1.5 text-[13px] text-[var(--monari-ink-soft)]">{rule.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ToggleBehaviorRuleButton ruleId={rule.id} isActive={rule.isActive} label={rule.title} />
                    <DeleteBehaviorRuleButton ruleId={rule.id} label={rule.title} />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`inline-flex h-[26px] items-center rounded-[10px] px-[10px] text-[12px] font-700 ${rule.requiresParentApproval ? "bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]" : "bg-[var(--monari-done-bg)] text-[var(--monari-done)]"}`}>
                    {rule.requiresParentApproval ? "확인 후 반영" : "자동 반영"}
                  </span>
                  {!rule.isActive && (
                    <span className="inline-flex h-[26px] items-center rounded-[10px] px-[10px] text-[12px] font-700 bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]">
                      비활성
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricBox label="약속 보상" value={formatWon(rule.rewardAmount)} />
                  <MetricBox
                    label="다음 달 이자율"
                    value={rule.interestDelta !== 0 ? `+${formatPercent(rule.interestDelta)}` : "—"}
                    sub={rule.ruleCategory === "recurring" ? `${rule.monthlyTargetRate}% 달성 시` : "한 번 달성 시"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
                    <p className="text-[14px] font-600 text-[var(--monari-ink)]">{rule?.title ?? "약속"}</p>
                    <p className="monari-meta mt-[2px]">{child?.name} · {log.date.slice(5).replace("-", ".")}</p>
                  </div>
                  <span className={`text-[13px] font-700 ${display.cls}`}>{display.label}</span>
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
    </MobileAppShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-center"><p className="text-[10px] font-semibold text-white/70">{label}</p><p className="mt-0.5 text-sm font-black text-white">{value}</p></div>;
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--monari-hero-lo)] p-3">
      <p className="text-[12px] text-[var(--monari-hero)]/60" style={{ fontWeight: 600 }}>{label}</p>
      <p className="mt-1 text-[var(--monari-hero)]" style={{ fontSize: 15, fontWeight: 800 }}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[var(--monari-hero)]/50">{sub}</p>}
    </div>
  );
}
