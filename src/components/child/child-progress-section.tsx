interface ChildProgressSectionProps {
  promiseTotal: number;
  promiseDone: number;
  savingGoalProgress: number;
}

export function ChildProgressSection({
  promiseTotal,
  promiseDone,
  savingGoalProgress,
}: ChildProgressSectionProps) {
  const promisePercent =
    promiseTotal > 0 ? Math.min(Math.round((promiseDone / promiseTotal) * 100), 100) : 0;

  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold text-[#2B2B2B]">진행 상황</h2>
      <div className="space-y-3">
        <ProgressCard
          title="약속 진행"
          valueLine={
            promiseTotal > 0
              ? `${promiseTotal}개 중 ${promiseDone}개 완료`
              : "오늘 약속이 없어요"
          }
          progress={promisePercent}
          helperText={promiseTotal > 0 ? `${promisePercent}% 달성 중` : undefined}
        />
        <ProgressCard
          title="저축 진행"
          valueLine={`목표까지 ${savingGoalProgress}%`}
          progress={savingGoalProgress}
          helperText={
            savingGoalProgress >= 100
              ? "목표 달성!"
              : `${100 - savingGoalProgress}% 남았어`
          }
        />
      </div>
    </section>
  );
}

function ProgressCard({
  title,
  valueLine,
  progress,
  helperText,
}: {
  title: string;
  valueLine: string;
  progress: number;
  helperText?: string;
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div
      className="rounded-[22px] bg-white px-5 py-4"
      style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[14px] font-bold text-[#2B2B2B]">{title}</p>
        <p className="text-[13px] font-semibold text-[rgba(43,43,43,0.72)]">{valueLine}</p>
      </div>

      <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-[rgba(43,43,43,0.08)]">
        <div
          className="h-full rounded-full bg-[#C66B3D] transition-all duration-500"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {helperText && (
        <p className="mt-2 text-[12px] font-medium text-[rgba(43,43,43,0.55)]">{helperText}</p>
      )}
    </div>
  );
}
