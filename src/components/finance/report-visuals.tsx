import { formatWon } from "@/lib/format";

export function ReportBarGroup({
  allowance,
  spend,
  save,
  borrowed,
}: {
  allowance: number;
  spend: number;
  save: number;
  borrowed: number;
}) {
  const max = Math.max(allowance, spend, save, borrowed, 1);

  return (
    <div className="space-y-5" role="img" aria-label="용돈, 지출, 저축, 빌린 돈 항목별 비교">
      <div>
        <p className="text-[15px] font-800 text-[var(--monari-ink)]">돈의 흐름 비교</p>
        <p className="monari-meta mt-1">가장 큰 항목을 기준으로 비교해요</p>
      </div>
      <MetricBar label="용돈" value={allowance} max={max} tone="sky" />
      <MetricBar label="지출" value={spend} max={max} tone="rose" />
      <MetricBar label="저축" value={save} max={max} tone="emerald" />
      <MetricBar label="빌린 돈" value={borrowed} max={max} tone="amber" />
    </div>
  );
}

export function SpendVsSaveSplit({ spend, save }: { spend: number; save: number }) {
  const total = Math.max(spend + save, 1);
  const spendWidth = (spend / total) * 100;
  const saveWidth = (save / total) * 100;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[15px] font-800 text-[var(--monari-ink)]">지출과 저축 비율</p>
        <p className="monari-meta mt-1">사용한 돈과 남긴 돈의 균형이에요</p>
      </div>
      <div className="overflow-hidden rounded-full bg-[var(--monari-line)]" role="img" aria-label={`지출 ${spendWidth.toFixed(0)}%, 저축 ${saveWidth.toFixed(0)}%`}>
        <div className="flex h-3">
          <div className="bg-[var(--monari-minus)]" style={{ width: `${spendWidth}%` }} />
          <div className="bg-[var(--monari-done)]" style={{ width: `${saveWidth}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LegendBox label="지출" value={formatWon(spend)} tone="rose" />
        <LegendBox label="저축" value={formatWon(save)} tone="emerald" />
      </div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "sky" | "rose" | "emerald" | "amber";
}) {
  const width = `${(value / max) * 100}%`;
  const barClass =
    tone === "rose"
      ? "bg-[var(--monari-minus)]"
      : tone === "emerald"
        ? "bg-[var(--monari-done)]"
        : tone === "amber"
          ? "bg-[var(--monari-pending)]"
          : "bg-[var(--monari-plus)]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-600 text-[var(--monari-ink-soft)]">{label}</span>
        <span className="font-800 text-[var(--monari-ink)]">{formatWon(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--monari-line)]">
        <div className={`h-full rounded-full ${barClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function LegendBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "rose" | "emerald";
}) {
  return (
    <div className="rounded-[16px] border border-[var(--monari-line)] bg-[var(--monari-bg)] p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${tone === "rose" ? "bg-[var(--monari-minus)]" : "bg-[var(--monari-done)]"}`} />
        <p className="text-[11px] font-700 text-[var(--monari-ink-muted)]">{label}</p>
      </div>
      <p className="mt-2 text-[17px] font-800 text-[var(--monari-ink)]">{value}</p>
    </div>
  );
}
