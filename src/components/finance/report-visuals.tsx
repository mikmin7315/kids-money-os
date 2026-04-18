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
    <div className="space-y-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <p className="text-lg font-semibold">항목별 비교</p>
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
    <div className="space-y-3 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <p className="text-lg font-semibold">지출 vs 저축</p>
      <div className="overflow-hidden rounded-full bg-[var(--color-card)]">
        <div className="flex h-4">
          <div className="bg-rose-400" style={{ width: `${spendWidth}%` }} />
          <div className="bg-emerald-400" style={{ width: `${saveWidth}%` }} />
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
      ? "bg-rose-400"
      : tone === "emerald"
        ? "bg-emerald-400"
        : tone === "amber"
          ? "bg-amber-400"
          : "bg-sky-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--color-muted)]">{label}</span>
        <span className="font-semibold text-[var(--color-text)]">{formatWon(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[var(--color-card)]">
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
    <div className="rounded-3xl bg-[var(--color-card)] p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${tone === "rose" ? "bg-rose-400" : "bg-emerald-400"}`} />
        <p className="text-xs text-[var(--color-muted)]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
