import { ReactNode } from "react";
import { clsx } from "clsx";

/** Parent-mode info card — calm, minimal border */
export function InfoCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-panel)] p-5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Child-mode story/growth card — warmer, slightly elevated */
export function StoryCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-panel)] p-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Child-mode action wrapper card — warm panel with accent border */
export function ActionCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--color-chip-border,var(--color-border))]",
        "bg-[var(--color-chip-bg,var(--color-panel))] p-4 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Large-number metric block for both themes */
export function MetricCard({
  label,
  value,
  sub,
  emoji,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  emoji?: string;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-[var(--radius-md)] bg-[var(--color-card)] p-4", className)}>
      {emoji && <p className="mb-2 text-2xl">{emoji}</p>}
      <p className="text-xs font-medium text-[var(--color-muted)]">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-text)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--color-soft)]">{sub}</p>}
    </div>
  );
}
