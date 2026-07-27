import { formatWon } from "@/lib/format";

interface ChildQuickStatsProps {
  weekSpend: number;
  topCategory: string;
  savingGoalProgress: number;
  remainingChallenges: number;
}

export function ChildQuickStats({
  weekSpend,
  topCategory,
  savingGoalProgress,
  remainingChallenges,
}: ChildQuickStatsProps) {
  return (
    <section
      className="rounded-[24px] bg-[var(--monari-surface)] overflow-hidden mb-4"
      style={{ boxShadow: "var(--monari-shadow-lg)" }}
    >
      <div className="grid grid-cols-2 divide-x divide-[var(--monari-line)]">
        {/* 이번 주 지출 */}
        <div className="px-4 py-4 border-b border-[var(--monari-line)]">
          <div className="flex items-center gap-2 mb-2">
            <IconCircle>
              <BarChartIcon />
            </IconCircle>
            <p className="text-[12px] font-500 text-[var(--monari-ink-soft)]">이번 주 지출</p>
          </div>
          <p className="text-[20px] font-bold tracking-tight tabular-nums text-[var(--monari-ink)]">
            {formatWon(weekSpend)}
          </p>
        </div>

        {/* 가장 많이 쓴 곳 */}
        <div className="px-4 py-4 border-b border-[var(--monari-line)]">
          <div className="flex items-center gap-2 mb-2">
            <IconCircle>
              <StoreIcon />
            </IconCircle>
            <p className="text-[12px] font-500 text-[var(--monari-ink-soft)]">가장 많이 쓴 곳</p>
          </div>
          <p className="text-[20px] font-bold text-[var(--monari-ink)] truncate">{topCategory}</p>
        </div>

        {/* 저축 목표 달성률 */}
        <div className="px-4 py-4">
          <p className="text-[12px] font-500 text-[var(--monari-ink-soft)] mb-3">저축 목표 달성률</p>
          <div className="h-2 rounded-full bg-[var(--monari-line)] overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-[var(--child-save)]"
              style={{ width: `${Math.min(100, savingGoalProgress)}%` }}
            />
          </div>
          <p className="text-[20px] font-bold text-[var(--monari-ink)]">{savingGoalProgress}%</p>
        </div>

        {/* 남은 챌린지 */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <IconCircle>
              <ListIcon />
            </IconCircle>
            <p className="text-[12px] font-500 text-[var(--monari-ink-soft)]">남은 챌린지</p>
          </div>
          <p className="text-[20px] font-bold text-[var(--monari-ink)]">{remainingChallenges}개</p>
        </div>
      </div>
    </section>
  );
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-6 w-6 rounded-full bg-[var(--child-save)]/10 flex items-center justify-center shrink-0 text-[var(--child-save)]">
      {children}
    </div>
  );
}

function BarChartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="0" y="6" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="4.5" y="3" width="3" height="9" rx="1" fill="currentColor" />
      <rect x="9" y="0" width="3" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 5h10v6a1 1 0 01-1 1H2a1 1 0 01-1-1V5z" fill="currentColor" opacity="0.6"/>
      <path d="M0 3l1 2h10l1-2-1-2H1L0 3z" fill="currentColor"/>
      <rect x="4.5" y="7" width="3" height="4" rx="0.5" fill="white" opacity="0.9"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="3" y="1.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="3" y="5.25" width="9" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="3" y="9" width="9" height="1.5" rx="0.75" fill="currentColor"/>
      <circle cx="1" cy="2.25" r="1" fill="currentColor"/>
      <circle cx="1" cy="6" r="1" fill="currentColor"/>
      <circle cx="1" cy="9.75" r="1" fill="currentColor"/>
    </svg>
  );
}
