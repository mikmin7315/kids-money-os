import { formatWon } from "@/lib/format";

interface ChildQuickStatsProps {
  todayPromises: number;
  pendingCount: number;
  savingGoalProgress: number;
  recentSpend: number;
}

export function ChildQuickStats({
  todayPromises,
  pendingCount,
  savingGoalProgress,
  recentSpend,
}: ChildQuickStatsProps) {
  return (
    <section>
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="오늘 약속"
          value={`${todayPromises}개`}
          accent={todayPromises > 0}
        />
        <StatTile
          label="대기 중"
          value={`${pendingCount}건`}
          accent={pendingCount > 0}
        />
        <StatTile
          label="저축 목표"
          value={`${savingGoalProgress}%`}
        />
        <StatTile
          label="최근 사용"
          value={formatWon(recentSpend)}
        />
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-[20px] bg-white px-4 py-4"
      style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}
    >
      <p className="text-[12px] font-medium text-[rgba(43,43,43,0.55)]">{label}</p>
      <p
        className={`mt-2 text-[22px] font-bold leading-tight tracking-tight tabular-nums ${
          accent ? "text-[#C66B3D]" : "text-[#2B2B2B]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
