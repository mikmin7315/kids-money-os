import { BehaviorRuleCreateForm } from "@/components/finance/management-forms";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
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
    <MobileAppShell title="함께 정한 약속" subtitle="약속">
      {/* Hero */}
      <div className="monari-hero mb-4">
        <p className="text-[13px] font-700 text-white/70 mb-2">행동이 이자를 만들어요</p>
        <div className="grid grid-cols-3 gap-2">
          <HeroPill label="전체 약속" value={`${activeRules.length}개`} />
          <HeroPill label="자동 완료" value={`${autoRules}개`} />
          <HeroPill label="확인 필요" value={`${reviewRules}개`} />
        </div>
      </div>

      {/* Active rules */}
      <section className="mb-4">
        <SectionTitle>현재 약속 목록</SectionTitle>
        {activeRules.length === 0 ? (
          <div className="monari-card mt-3 px-4 py-5 text-center">
            <p className="text-[14px] font-600 text-[var(--monari-ink-muted)]">아직 정한 약속이 없어요</p>
            <p className="monari-meta mt-1">아래에서 첫 번째 약속을 만들어보세요</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {activeRules.map((rule) => (
              <div key={rule.id} className="monari-card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <p className="text-[16px] font-800 text-[var(--monari-ink)] leading-tight">{rule.title}</p>
                    {rule.description && (
                      <p className="mt-1.5 text-[13px] text-[var(--monari-ink-soft)]">{rule.description}</p>
                    )}
                  </div>
                  <span className={`shrink-0 inline-flex h-[26px] items-center rounded-[10px] px-[10px] text-[12px] font-700 ${rule.requiresParentApproval ? "bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]" : "bg-[var(--monari-done-bg)] text-[var(--monari-done)]"}`}>
                    {rule.requiresParentApproval ? "확인 후 반영" : "자동 반영"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricBox label="약속 보상" value={formatWon(rule.rewardAmount)} />
                  <MetricBox label="이자율 변화" value={`+${formatPercent(rule.interestDelta)}`} />
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
