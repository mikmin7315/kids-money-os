import { notFound, redirect } from "next/navigation";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";
import type { BehaviorLog } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  approved: "승인됨",
  completed: "완료",
  pending: "확인 중",
  rejected: "반려",
};
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  approved:  { bg: "#d1fae5", text: "#065f46" },
  completed: { bg: "#dbeafe", text: "#1e40af" },
  pending:   { bg: "#fef3c7", text: "#92400e" },
  rejected:  { bg: "#fee2e2", text: "#991b1b" },
};

export default async function ChildHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([getChildModeContext(), getAppDataBundle()]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  const logs = bundle.behaviorLogs
    .filter((l) => l.childId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // 날짜별 그룹핑
  const grouped = logs.reduce<Record<string, BehaviorLog[]>>((acc, log) => {
    (acc[log.date] ??= []).push(log);
    return acc;
  }, {});

  const totalDone = logs.filter((l) => l.status === "approved" || l.status === "completed").length;
  const streak = computeStreak(logs, bundle.behaviorRules.filter((r) => r.isActive).map((r) => r.id));

  return (
    <main className="px-4 pb-36 pt-8">
      <div className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>행동 기록</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          📋 내 약속 기록
        </h1>
      </div>

      {/* 요약 배너 */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] p-4" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>총 달성</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{totalDone}번</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>약속을 지켰어요!</p>
        </div>
        <div className="rounded-[20px] bg-[#fef3c7] p-4">
          <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>연속 달성</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#b45309", letterSpacing: "-0.03em" }}>🔥 {streak}일</p>
          <p style={{ fontSize: 12, color: "#b45309", opacity: 0.7, marginTop: 2 }}>계속해봐요!</p>
        </div>
      </div>

      {/* 날짜별 로그 */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-[24px] bg-white p-10 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <p style={{ fontSize: 48, marginBottom: 12 }}>🌱</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--monari-ink)" }}>아직 기록이 없어요</p>
          <p style={{ fontSize: 14, color: "var(--monari-ink-muted)", marginTop: 6 }}>약속 탭에서 오늘 약속을 체크해봐요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", marginBottom: 8 }}>
                {date.slice(5).replace("-", "월 ")}일
              </p>
              <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                {dayLogs.map((log, i) => {
                  const rule = bundle.behaviorRules.find((r) => r.id === log.behaviorRuleId);
                  const style = STATUS_STYLE[log.status] ?? STATUS_STYLE.pending;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-lg"
                        style={{ background: style.bg }}
                      >
                        {log.status === "approved" || log.status === "completed" ? "⭐" : log.status === "pending" ? "⏳" : "💭"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)" }} className="truncate">
                          {rule?.title ?? "약속"}
                        </p>
                        {log.memo && (
                          <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", marginTop: 2 }} className="truncate">
                            {log.memo}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className="inline-block rounded-[8px] px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {STATUS_LABEL[log.status] ?? log.status}
                        </span>
                        {rule?.rewardAmount && (rule.rewardAmount > 0) && (
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginTop: 3 }}>
                            +{formatWon(rule.rewardAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function computeStreak(logs: BehaviorLog[], activeRuleIds: string[]): number {
  if (activeRuleIds.length === 0) return 0;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  let streak = 0;
  const d = new Date(today);
  while (true) {
    const dateStr = d.toISOString().slice(0, 10);
    const approved = logs
      .filter((l) => l.date === dateStr && (l.status === "approved" || l.status === "completed"))
      .map((l) => l.behaviorRuleId);
    if (!activeRuleIds.every((id) => approved.includes(id))) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
