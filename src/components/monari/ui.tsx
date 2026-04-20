import type { ReactNode } from "react";

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="monari-section-title">{children}</h2>
      {action && (
        <span className="text-[13px] font-600 text-[rgba(43,43,43,0.54)]">{action}</span>
      )}
    </div>
  );
}

type Tone = "done" | "pending" | "plus" | "minus" | "neutral";

const toneStyles: Record<Tone, { pill: string; value: string }> = {
  done: {
    pill: "bg-[var(--monari-done-bg)] text-[var(--monari-done)]",
    value: "text-[var(--monari-done)]",
  },
  pending: {
    pill: "bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]",
    value: "text-[var(--monari-pending)]",
  },
  plus: {
    pill: "bg-[var(--monari-plus-bg)] text-[var(--monari-plus)]",
    value: "text-[var(--monari-plus)]",
  },
  minus: {
    pill: "bg-[var(--monari-minus-bg)] text-[var(--monari-minus)]",
    value: "text-[var(--monari-minus)]",
  },
  neutral: {
    pill: "bg-[rgba(43,43,43,0.06)] text-[rgba(43,43,43,0.58)]",
    value: "text-[rgba(43,43,43,0.58)]",
  },
};

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex h-[26px] items-center rounded-[10px] px-[10px] text-[12px] font-700 ${toneStyles[tone].pill}`}
    >
      {label}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="monari-card flex flex-col gap-1 p-4">
      <p className="monari-meta">{label}</p>
      <p className="monari-kpi-value">{value}</p>
      {sub && <p className="monari-meta">{sub}</p>}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="monari-progress-track">
      <div
        className="monari-progress-fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export function ProgressCard({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value: number;
  valueLabel: string;
}) {
  return (
    <div className="monari-card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-700 text-[var(--monari-ink)]">{label}</p>
        <p className="text-[14px] font-800 text-[var(--monari-hero)]">{valueLabel}</p>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

export function ListRow({
  title,
  sub,
  right,
  tone = "neutral",
}: {
  title: string;
  sub?: string;
  right: string;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-[14px]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-600 text-[var(--monari-ink)]">{title}</p>
        {sub && <p className="mt-[2px] text-[12px] font-500 text-[var(--monari-ink-muted)]">{sub}</p>}
      </div>
      <span className={`shrink-0 text-[13px] font-700 ${toneStyles[tone].value}`}>{right}</span>
    </div>
  );
}
