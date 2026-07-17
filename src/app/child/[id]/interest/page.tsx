import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatPercent, formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ChildInterestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle, dashboard] = await Promise.all([
    getChildModeContext(),
    getAppDataBundle(),
    getDashboardView(),
  ]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  const summary = dashboard.children.find((c) => c.child.id === id);
  if (!child || !summary) notFound();

  const policy = bundle.interestPolicies.find((p) => p.childId === id);
  const estimated = policy ? estimateInterest(summary.wallet, policy) : 0;
  const balance = summary.wallet.balance;
  const rate = summary.wallet.currentInterestRate;

  // 이번 달 받은 이자 내역
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const monthKey = today.slice(0, 7);
  const interestTx = bundle.moneyTransactions
    .filter((t) => t.childId === id && t.type === "interest" && t.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalReceivedThisMonth = interestTx.reduce((s, t) => s + t.amount, 0);

  // 행동 약속 기여 계산
  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);
  const childLogs = bundle.behaviorLogs.filter(
    (l) => l.childId === id && l.date.startsWith(monthKey) && (l.status === "approved" || l.status === "completed"),
  );
  const behaviorBonus = activeRules.reduce((sum, rule) => {
    const done = childLogs.some((l) => l.behaviorRuleId === rule.id);
    return done ? sum + rule.interestDelta : sum;
  }, 0);

  return (
    <div data-theme="child-mint" style={{ background: "#F0FEFA", minHeight: "100dvh" }}>
    <main className="px-4 pb-36 pt-8">
      <div className="mb-5 flex items-start justify-between gap-2">
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>이자</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
            📈 이자 미리보기
          </h1>
        </div>
        <Link
          href={`/child/${id}/interest-received`}
          className="mt-1 shrink-0 rounded-[12px] bg-[var(--monari-hero-lo)] px-3 py-2 text-xs font-bold text-[var(--monari-hero)]"
        >
          받은 이자 내역 →
        </Link>
      </div>

      {/* 이자 미리보기 히어로 */}
      <div
        className="mb-5 overflow-hidden rounded-[24px] p-5 text-white"
        style={{ background: "linear-gradient(145deg, #065F46 0%, #059669 45%, #10B981 80%, #34D399 100%)" }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
          이번 달 이대로면
        </p>
        <p
          className="tabular-nums"
          style={{ fontSize: 48, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1, marginTop: 4 }}
        >
          +{formatWon(estimated)}
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>이자가 더 생겨요!</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "남긴 돈", value: formatWon(balance) },
            { label: "이자율", value: formatPercent(rate) },
            { label: "정산일", value: "매월 1일" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[14px] bg-white/15 px-3 py-2.5 text-center">
              <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginTop: 2 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 이자 계산 설명 */}
      <div className="mb-5 rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>어떻게 계산돼요?</p>
        <div className="space-y-3">
          <CalcRow
            label="기본 이자율"
            value={policy ? formatPercent(policy.baseInterestRate) : "설정 전"}
            desc="부모님이 정해준 기본값"
            color="var(--monari-hero)"
          />
          {behaviorBonus > 0 && (
            <CalcRow
              label="약속 달성 보너스"
              value={`+${formatPercent(behaviorBonus)}`}
              desc={`${childLogs.length}개 약속 달성`}
              color="var(--monari-done)"
            />
          )}
          <div className="border-t border-[var(--monari-line)] pt-3">
            <CalcRow
              label="현재 이자율"
              value={formatPercent(rate)}
              desc="남긴 돈에 적용되는 이자율"
              color="var(--monari-ink)"
              bold
            />
          </div>
          <div className="rounded-[14px] bg-[var(--monari-hero-lo)] px-4 py-3">
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--monari-hero)" }}>
              💡 약속을 더 지키면 이자율이 최대 {policy ? formatPercent(policy.maxInterestRate) : "—"}까지 올라가요!
            </p>
          </div>
        </div>
      </div>

      {/* 행동 약속 기여 */}
      {activeRules.length > 0 && (
        <div className="mb-5 rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 12 }}>약속별 이자 기여</p>
          <div className="space-y-2">
            {activeRules.map((rule) => {
              const done = childLogs.some((l) => l.behaviorRuleId === rule.id);
              return (
                <div key={rule.id} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-base"
                    style={{ background: done ? "var(--status-success-solid)" : "var(--monari-surface-soft)" }}
                  >
                    {done ? "⭐" : "○"}
                  </span>
                  <p style={{ fontSize: 14, fontWeight: 600, color: done ? "var(--monari-ink)" : "var(--monari-ink-muted)", flex: 1 }} className="truncate">
                    {rule.title}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: done ? "var(--monari-done)" : "var(--monari-ink-muted)" }}>
                    {rule.interestDelta > 0 ? `+${formatPercent(rule.interestDelta)}` : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 이번 달 받은 이자 */}
      {interestTx.length > 0 && (
        <div className="rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
          <div className="mb-3 flex items-center justify-between">
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)" }}>이번 달 받은 이자</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: "var(--monari-done)" }}>+{formatWon(totalReceivedThisMonth)}</p>
          </div>
          <div className="space-y-2">
            {interestTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <p style={{ fontSize: 13, color: "var(--monari-ink-muted)" }}>{tx.date.slice(5).replace("-", "월 ")}일</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-done)" }}>+{formatWon(tx.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
    </div>
  );
}

function CalcRow({
  label, value, desc, color, bold,
}: {
  label: string; value: string; desc: string; color: string; bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p style={{ fontSize: 13, fontWeight: bold ? 800 : 600, color: bold ? "var(--monari-ink)" : "var(--monari-ink-muted)" }}>{label}</p>
        <p style={{ fontSize: 11, color: "#6EE7B7", marginTop: 1 }}>{desc}</p>
      </div>
      <p style={{ fontSize: 16, fontWeight: 800, color }}>{value}</p>
    </div>
  );
}
