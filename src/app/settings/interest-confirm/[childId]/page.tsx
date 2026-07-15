import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatPercent, formatWon } from "@/lib/format";
import { InterestConfirmForm } from "@/components/finance/interest-confirm-form";

export const dynamic = "force-dynamic";

export default async function InterestConfirmPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  await requireParentSession();
  const [bundle, dashboard] = await Promise.all([getAppDataBundle(), getDashboardView()]);

  const child = bundle.children.find((c) => c.id === childId);
  const summary = dashboard.children.find((c) => c.child.id === childId);
  const policy = bundle.interestPolicies.find((p) => p.childId === childId);
  if (!child || !summary || !policy) notFound();

  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);
  const estimated = estimateInterest(summary.wallet, policy);
  const rate = summary.wallet.currentInterestRate;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const monthKey = today.slice(0, 7);
  const childLogs = bundle.behaviorLogs.filter(
    (l) => l.childId === childId && l.date.startsWith(monthKey) && (l.status === "approved" || l.status === "completed"),
  );

  return (
    <div className="mx-auto min-h-screen max-w-[460px] bg-[#faf5ff]" style={{ boxShadow: "0 0 70px rgba(76,29,149,0.16)" }}>
      <div className="px-4 pb-16 pt-12">
        <Link href="/settings" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
          <ArrowLeft size={16} /> 설정으로
        </Link>

        <div className="mb-2">
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)" }}>{child.name} · {monthKey.replace("-", "년 ")}월</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginTop: 4 }}>
            🔒 이자 약속 확정
          </h1>
          <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)", lineHeight: 1.7 }}>
            확정하면 이번 달에는 이자율이 바뀌지 않아요. 아이에게 약속을 지켜요.
          </p>
        </div>

        {/* 현재 이자율 요약 */}
        <div
          className="mb-5 mt-5 overflow-hidden rounded-[24px] p-5 text-white"
          style={{ background: "linear-gradient(145deg,#5b21b6 0%,#7c3aed 55%,#a855f7 100%)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock size={13} className="text-white/60" />
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>확정 후 이 달 변경 불가</p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>확정될 이자율</p>
          <p className="tabular-nums" style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            {formatPercent(rate)}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
            예상 이자: +{formatWon(estimated)} (남긴 돈 {formatWon(summary.wallet.balance)} 기준)
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <PillBox label="기본 이자율" value={formatPercent(policy.baseInterestRate)} />
            <PillBox label="약속 보너스" value={`+${formatPercent(Math.max(0, rate - policy.baseInterestRate))}`} />
          </div>
        </div>

        {/* 행동 약속 현황 */}
        {activeRules.length > 0 && (
          <div className="mb-5 rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>이번 달 행동 약속 현황</p>
            <div className="space-y-3">
              {activeRules.map((rule) => {
                const done = childLogs.some((l) => l.behaviorRuleId === rule.id);
                return (
                  <div key={rule.id} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-base"
                      style={{ background: done ? "var(--status-success-solid)" : "var(--monari-surface-soft)" }}
                    >
                      {done ? "✅" : "○"}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: done ? "var(--monari-ink)" : "var(--monari-ink-muted)", flex: 1 }} className="truncate">
                      {rule.title}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: done ? "var(--monari-done)" : "#d1d5db" }}>
                      +{formatPercent(rule.interestDelta)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 주의 안내 */}
        <div className="mb-5 rounded-[24px] bg-[var(--status-pending-solid)] p-4">
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--status-pending-solid-text)", marginBottom: 6 }}>⚠️ 확정 전에 확인하세요</p>
          <ul className="space-y-1" style={{ fontSize: 13, color: "var(--monari-pending)" }}>
            <li>• 확정 후 이번 달 이자율은 변경되지 않아요</li>
            <li>• 다음 달 설정은 월초에 새로 정할 수 있어요</li>
            <li>• 아이에게 이자율을 알려줘도 좋아요</li>
          </ul>
        </div>

        {/* 확정 폼 */}
        <InterestConfirmForm childId={childId} rate={rate} />
      </div>
    </div>
  );
}

function PillBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-white/15 px-3 py-2.5 text-center">
      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginTop: 2 }}>{value}</p>
    </div>
  );
}
