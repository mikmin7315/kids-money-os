import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Lock } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatPercent, formatWon } from "@/lib/format";
import { estimateInterest } from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function ChildPromiseMonthPage({ params }: { params: Promise<{ id: string }> }) {
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
  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);
  const estimated = policy ? estimateInterest(summary.wallet, policy) : 0;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const monthKey = today.slice(0, 7);
  const childLogs = bundle.behaviorLogs.filter(
    (l) => l.childId === id && l.date.startsWith(monthKey),
  );

  const rate = summary.wallet.currentInterestRate;
  const baseRate = policy?.baseInterestRate ?? 0;

  return (
    <main className="px-4 pb-36 pt-8">
      <Link
        href={`/child/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#7c3aed]"
      >
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      {/* 헤더 */}
      <div className="mb-5">
        <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>
          {monthKey.replace("-", "년 ")}월 약속
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.03em" }}>
          🤝 이번 달 약속
        </h1>
      </div>

      {/* 약속 요약 카드 */}
      <div
        className="mb-5 overflow-hidden rounded-[24px] p-5 text-white"
        style={{ background: "linear-gradient(145deg,#5b21b6 0%,#7c3aed 55%,#a855f7 100%)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Lock size={14} className="text-white/70" />
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
            이번 달에는 바뀌지 않아요
          </p>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>현재 이자율</p>
        <p
          className="tabular-nums"
          style={{ fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1 }}
        >
          {formatPercent(rate)}
        </p>
        <p className="mt-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
          이대로면 이번 달 이자 +{formatWon(estimated)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] bg-white/15 px-3 py-2.5 text-center">
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>기본 이자</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 2 }}>{formatPercent(baseRate)}</p>
          </div>
          <div className="rounded-[14px] bg-white/15 px-3 py-2.5 text-center">
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>약속 보너스</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 2 }}>
              +{formatPercent(Math.max(0, rate - baseRate))}
            </p>
          </div>
        </div>
      </div>

      {/* 행동 약속 리스트 */}
      {activeRules.length > 0 ? (
        <div className="mb-5 rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p style={{ fontSize: 15, fontWeight: 800, color: "#1a0533", marginBottom: 12 }}>
            이번 달 행동 약속
          </p>
          <div className="space-y-3">
            {activeRules.map((rule) => {
              const thisMonthLogs = childLogs.filter((l) => l.behaviorRuleId === rule.id);
              const approved = thisMonthLogs.filter((l) => l.status === "approved" || l.status === "completed");
              const pending = thisMonthLogs.filter((l) => l.status === "pending");
              const isDone = approved.length > 0;
              const isWaiting = !isDone && pending.length > 0;

              return (
                <div key={rule.id} className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                    style={{ background: isDone ? "#d1fae5" : isWaiting ? "#fef3c7" : "#f3f4f6" }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : isWaiting ? (
                      <Clock size={18} color="#d97706" />
                    ) : (
                      <span style={{ fontSize: 16 }}>○</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1a0533" }} className="truncate">
                      {rule.title}
                    </p>
                    <p style={{ fontSize: 12, color: isDone ? "#059669" : isWaiting ? "#d97706" : "#9ca3af", marginTop: 2 }}>
                      {isDone ? "달성! 이자에 반영돼요 🎉" : isWaiting ? "부모님이 확인 중이에요" : "아직 기회가 있어요"}
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: isDone ? "#059669" : "#d1d5db" }}>
                    +{formatPercent(rule.interestDelta)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-[20px] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p style={{ fontSize: 40, marginBottom: 10 }}>🌱</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#1a0533" }}>행동 약속이 없어요</p>
          <p className="mt-2" style={{ fontSize: 13, color: "#9ca3af" }}>
            부모님과 함께 약속을 정하면 이자율이 올라가요!
          </p>
        </div>
      )}

      {/* 약속 설명 */}
      <div className="rounded-[20px] bg-[#f5f3ff] p-4">
        <p style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6", marginBottom: 6 }}>📌 약속이란?</p>
        <p style={{ fontSize: 13, color: "#7c3aed", lineHeight: 1.7 }}>
          부모님과 함께 정한 행동 약속을 지키면 이자율이 올라가요.
          이자율이 높을수록 남긴 돈에서 더 많은 이자가 생겨요.
        </p>
        <Link
          href={`/child/${id}/promise`}
          className="mt-3 inline-block text-sm font-bold text-[#7c3aed]"
        >
          오늘 약속 체크하러 가기 →
        </Link>
      </div>
    </main>
  );
}
