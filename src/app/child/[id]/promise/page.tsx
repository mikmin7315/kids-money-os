import { notFound, redirect } from "next/navigation";
import { ChildBehaviorCheckForm } from "@/components/finance/action-forms";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import type { BehaviorLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChildPromisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([getChildModeContext(), getAppDataBundle()]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const activeRules = bundle.behaviorRules.filter((r) => r.isActive);
  const allChildLogs = bundle.behaviorLogs.filter((l) => l.childId === id);
  const childLogs = allChildLogs.filter((l) => l.date === today);
  const doneTodayRuleIds = childLogs
    .filter((l) => l.status === "approved" || l.status === "completed")
    .map((l) => l.behaviorRuleId);
  const pendingTodayRuleIds = childLogs
    .filter((l) => l.status === "pending")
    .map((l) => l.behaviorRuleId);

  const todayDone = doneTodayRuleIds.length;
  const todayTotal = activeRules.length;
  const allDone = todayTotal > 0 && todayDone >= todayTotal;

  // 주간 달성 기록 (최근 7일)
  const activeRuleIds = activeRules.map((r) => r.id);
  const week = buildWeek(allChildLogs, activeRuleIds, today);

  // 연속 달성 streak
  const streak = computeStreak(allChildLogs, activeRuleIds, today);

  // 이번 달 총 보상 예정액
  const totalReward = activeRules.reduce((sum, r) => sum + (r.rewardAmount ?? 0), 0);

  return (
    <main className="px-4 pb-36 pt-8">
      {/* 헤더 */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>
            {today.slice(5).replace("-", ".")} 오늘
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
            ✅ 오늘 약속 체크
          </h1>
        </div>
        <a
          href={`/child/${id}/history`}
          style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-hero)", marginTop: 6, whiteSpace: "nowrap" }}
        >
          기록 보기 →
        </a>
      </div>

      {/* 상태 배너 */}
      {todayTotal > 0 && (
        <div
          className="mb-5 rounded-[24px] p-4"
          style={{ background: allDone ? "linear-gradient(135deg,#a7f3d0,#6ee7b7)" : "linear-gradient(135deg,#ede9fe,#ddd6fe)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: allDone ? "var(--status-success-solid-text)" : "var(--monari-hero)", opacity: 0.7 }}>
                {allDone ? "오늘 모두 완료! 🎉" : "오늘 약속"}
              </p>
              <p style={{ fontSize: 26, fontWeight: 900, color: allDone ? "#064e3b" : "var(--monari-hero)", letterSpacing: "-0.03em" }}>
                {todayDone}/{todayTotal}개 완료
              </p>
              {streak > 0 && (
                <p className="mt-1" style={{ fontSize: 13, fontWeight: 700, color: allDone ? "var(--status-success-solid-text)" : "var(--monari-hero)" }}>
                  🔥 {streak}일 연속 달성 중!
                </p>
              )}
            </div>
            <span style={{ fontSize: 52 }}>{allDone ? "🏆" : "💪"}</span>
          </div>
        </div>
      )}

      {/* 주간 달성 캘린더 */}
      <div className="mb-5 rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-lift)]">
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink-muted)", marginBottom: 12 }}>이번 주 기록</p>
        <div className="grid grid-cols-7 gap-1">
          {week.map(({ label, done, isToday }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span style={{ fontSize: 11, fontWeight: 600, color: isToday ? "var(--monari-hero)" : "#d1d5db" }}>
                {["일", "월", "화", "수", "목", "금", "토"][new Date(
                  // label은 날짜 숫자(day)
                  today.slice(0, 8) + String(label).padStart(2, "0")
                ).getDay()] ?? ""}
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: done ? "linear-gradient(145deg,#7c3aed,#a855f7)" : isToday ? "#f3f0ff" : "#f9fafb",
                  fontSize: 18,
                  border: isToday && !done ? "2px solid #c4b5fd" : "none",
                }}
              >
                {done ? "⭐" : isToday ? "👀" : <span style={{ fontSize: 12, color: "var(--monari-ink-muted)" }}>{label}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 약속 목록 */}
      {activeRules.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-[var(--monari-shadow-lift)]">
          <p style={{ fontSize: 48, marginBottom: 12 }}>🌱</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--monari-ink)" }}>약속이 없어요</p>
          <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>부모님과 함께 새로운 약속을 만들어봐요!</p>
        </div>
      ) : (
        <>
          <div className="rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-lift)]">
            <ChildBehaviorCheckForm
              childId={id}
              behaviorRules={activeRules}
              doneRuleIds={doneTodayRuleIds}
              pendingRuleIds={pendingTodayRuleIds}
            />
          </div>

          {/* 오늘 다 하면 받을 수 있는 보상 */}
          {totalReward > 0 && !allDone && (
            <div className="mt-4 rounded-[24px] bg-[var(--status-pending-solid)] p-4">
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--status-pending-solid-text)" }}>오늘 약속 다 하면</p>
              <p className="mt-1" style={{ fontSize: 20, fontWeight: 900, color: "var(--monari-pending)" }}>
                💰 최대 {totalReward.toLocaleString()}원 보상!
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function buildWeek(logs: BehaviorLog[], activeRuleIds: string[], today: string) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayApproved = logs
      .filter((l) => l.date === dateStr && (l.status === "approved" || l.status === "completed"))
      .map((l) => l.behaviorRuleId);
    const done = activeRuleIds.length > 0 && activeRuleIds.every((id) => dayApproved.includes(id));
    return { label: d.getDate(), done, isToday: dateStr === today, dateStr };
  });
}

function computeStreak(logs: BehaviorLog[], activeRuleIds: string[], today: string): number {
  let streak = 0;
  const d = new Date(today);
  while (true) {
    const dateStr = d.toISOString().slice(0, 10);
    const approved = logs
      .filter((l) => l.date === dateStr && (l.status === "approved" || l.status === "completed"))
      .map((l) => l.behaviorRuleId);
    if (activeRuleIds.length === 0 || !activeRuleIds.every((id) => approved.includes(id))) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
