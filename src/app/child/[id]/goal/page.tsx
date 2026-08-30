import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import type { GoalRow } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function GoalCard({ goal, childId, isParent, isChild }: { goal: GoalRow; childId: string; isParent: boolean; isChild: boolean }) {
  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const achieved = goal.status === "achieved";

  return (
    <div
      className="rounded-[24px] bg-white p-5 shadow-[0_4px_20px_rgba(14,165,233,0.10)]"
      style={{ border: achieved ? "2px solid #34d399" : "1.5px solid rgba(14,165,233,0.12)" }}
    >
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-[16px] text-2xl"
            style={{ background: achieved ? "linear-gradient(135deg,#d1fae5,#a7f3d0)" : "rgba(14,165,233,0.1)" }}
          >
            {goal.image_emoji}
          </span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0C4B78" }}>{goal.title}</p>
            {goal.deadline && (
              <p style={{ fontSize: 11, color: "#64B5D9", marginTop: 2 }}>
                목표일 {new Date(goal.deadline).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
        {achieved && (
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: "#d1fae5", color: "#065f46" }}
          >
            달성! 🎉
          </span>
        )}
      </div>

      {/* 진행 바 */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between">
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0EA5E9" }}>{pct}%</span>
          <span style={{ fontSize: 12, color: "#64B5D9" }}>{formatAmount(goal.current_amount)} / {formatAmount(goal.target_amount)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full" style={{ background: "rgba(14,165,233,0.12)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: achieved
                ? "linear-gradient(90deg,#34d399,#10b981)"
                : "linear-gradient(90deg,#0EA5E9,#38BDF8)",
            }}
          />
        </div>
      </div>

      {/* 남은 금액 */}
      {!achieved && (
        <p style={{ fontSize: 12, color: "#64B5D9" }}>
          <span style={{ fontWeight: 700, color: "#0C4B78" }}>{formatAmount(remaining)}</span> 더 모으면 달성!
        </p>
      )}

      {/* 버튼 영역 */}
      {!achieved && (
        <div className={`mt-4 ${isParent && isChild ? "grid grid-cols-2 gap-2" : ""}`}>
          {isChild && (
            <Link
              href={`/child/${childId}/goal/${goal.id}/save`}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] py-2.5 text-sm font-bold text-white transition active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg,#0EA5E9,#38BDF8)" }}
            >
              🐷 저금하기
            </Link>
          )}
          {isParent && (
            <Link
              href={`/child/${childId}/goal/${goal.id}/contribute`}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] py-2.5 text-sm font-bold transition active:scale-[0.97]"
              style={{
                background: isChild ? "rgba(14,165,233,0.08)" : "linear-gradient(135deg,#0EA5E9,#38BDF8)",
                color: isChild ? "#0EA5E9" : "#fff",
                border: isChild ? "1.5px solid rgba(14,165,233,0.3)" : "none",
              }}
            >
              🎁 응원하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default async function ChildGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([getChildModeContext(), getAppDataBundle()]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const isChild = isChildMode && !isParentOrAdmin;

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  const goals = bundle.goals.filter((g) => g.child_id === id);
  const activeGoals = goals.filter((g) => g.status === "active");
  const achievedGoals = goals.filter((g) => g.status === "achieved");

  return (
    <div style={{ background: "#E0F2FE", minHeight: "100dvh" }}>
      <main className="px-4 pb-36 pt-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#64B5D9", marginBottom: 4 }}>{child.name}</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0C4B78", letterSpacing: "-0.03em" }}>
              목표 저금통
            </h1>
            <p style={{ fontSize: 13, color: "#64B5D9", marginTop: 4 }}>꿈을 향해 차곡차곡!</p>
          </div>
          {/* 부모 전용: 목표 만들기 */}
          {isParentOrAdmin && (
            <Link
              href={`/child/${id}/goal/new`}
              className="flex items-center gap-1.5 rounded-[14px] px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg,#0EA5E9,#38BDF8)" }}
            >
              + 목표 추가
            </Link>
          )}
        </div>

        {/* 목표가 없을 때 */}
        {goals.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-[28px] bg-white px-6 py-12 shadow-[0_4px_20px_rgba(14,165,233,0.12)]"
            style={{ minHeight: 240 }}
          >
            <span style={{ fontSize: 56 }}>🎯</span>
            <div className="text-center">
              <p style={{ fontSize: 16, fontWeight: 800, color: "#0C4B78", marginBottom: 8 }}>
                아직 목표가 없어요
              </p>
              <p style={{ fontSize: 13, color: "#64B5D9", lineHeight: 1.6 }}>
                {isParentOrAdmin
                  ? "아이와 함께 첫 목표를 만들어보세요!"
                  : "부모님께 목표를 만들어 달라고 해보세요!"}
              </p>
            </div>
            {isParentOrAdmin && (
              <Link
                href={`/child/${id}/goal/new`}
                className="mt-2 rounded-[16px] px-6 py-3 text-[14px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #0EA5E9, #38BDF8)" }}
              >
                첫 목표 만들기 🎯
              </Link>
            )}
          </div>
        )}

        {/* 진행 중 목표 */}
        {activeGoals.length > 0 && (
          <div className="mb-6">
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", marginBottom: 12 }}>
              진행 중 {activeGoals.length}개
            </p>
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} childId={id} isParent={!!isParentOrAdmin} isChild={isChild} />
              ))}
            </div>
          </div>
        )}

        {/* 달성한 목표 */}
        {achievedGoals.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#64B5D9", marginBottom: 12 }}>
              달성 완료 {achievedGoals.length}개 🎉
            </p>
            <div className="space-y-4 opacity-70">
              {achievedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} childId={id} isParent={!!isParentOrAdmin} isChild={isChild} />
              ))}
            </div>
          </div>
        )}

        {/* 안내 카드 (목표 없을 때만 숨김) */}
        {goals.length === 0 && (
          <div
            className="mt-4 rounded-[20px] bg-white/70 px-5 py-4"
            style={{ border: "1.5px solid rgba(14,165,233,0.15)" }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0EA5E9", marginBottom: 8 }}>목표 저금통이란?</p>
            <ul className="space-y-2">
              {[
                { emoji: "💰", text: "원하는 것을 목표로 설정해요" },
                { emoji: "📈", text: "조금씩 저금해서 목표를 채워가요" },
                { emoji: "🎁", text: "가족이 함께 응원하고 선물할 수 있어요" },
              ].map(({ emoji, text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <span style={{ fontSize: 16 }}>{emoji}</span>
                  <span style={{ fontSize: 12, color: "#374151" }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
