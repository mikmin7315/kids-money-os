import { BehaviorRuleCreateForm } from "@/components/finance/management-forms";
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
      <div className="mb-4 rounded-[20px] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-[#f3f4f6]">
          <StatItem label="전체 약속" value={activeRules.length} unit="개" color="#7c3aed" />
          <StatItem label="자동 완료" value={autoRules} unit="개" color="#059669" />
          <StatItem label="확인 필요" value={reviewRules} unit="개" color="#d97706" />
        </div>
      </div>

      {/* Active rules */}
      <section className="mb-4">
        <SectionTitle>현재 약속 목록</SectionTitle>
        {activeRules.length === 0 ? (
          <div className="monari-card mt-3 px-4 py-5 text-center">
            <p className="text-[14px] font-700 text-[var(--monari-ink)]">첫 약속을 만들어 보세요</p>
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

      {recentLogs.some((log) => log.status === "pending") && (
        <Link href="/approvals" className="monari-btn-primary w-full">
          확인 대기 약속 처리하기
        </Link>
      )}
    </MobileAppShell>
  );
}

function StatItem({ label, value, unit = "건", color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div className="flex flex-col items-center py-5 gap-1.5">
      <p style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af" }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{value}{unit}</p>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#f5f3ff] p-3">
      <p className="text-[12px] text-[#6d28d9]/60" style={{ fontWeight: 600 }}>{label}</p>
      <p className="mt-1 text-[#4c1d95]" style={{ fontSize: 15, fontWeight: 800 }}>{value}</p>
    </div>
  );
}
