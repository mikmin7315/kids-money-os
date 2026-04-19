import Link from "next/link";
import { clsx } from "clsx";
import { ReactNode } from "react";

/** Full-bleed hero card — deep navy for parent pages */
export function PageHero({
  eyebrow,
  title,
  description,
  stats,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  stats?: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="relative overflow-hidden rounded-[30px] bg-[var(--hero-parent-bg)] px-6 py-7">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">{eyebrow}</p>
          <h2 className="mt-4 font-display text-[1.9rem] font-semibold leading-[1.07] tracking-tight text-white">{title}</h2>
          {description && (
            <p className="mt-3 max-w-[31ch] text-sm leading-6 text-white/65">{description}</p>
          )}
          {stats && <div className="mt-5">{stats}</div>}
        </div>
      </div>
    </section>
  );
}

/** Stat pill used inside PageHero — styled for dark navy background */
export function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">{label}</p>
      <p className="mt-2 font-display text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

/** Empty state card — guides to next action */
export function EmptyState({
  message,
  hint,
  action,
}: {
  message: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--bg-surface)] px-5 py-8 text-center shadow-[var(--shadow-soft)]">
      <p className="text-sm font-medium text-[var(--text-secondary)]">{message}</p>
      {hint && <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-transparent text-[var(--text-primary)]">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

export function MobileShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-36 pt-5">{children}</div>;
}

export function Section(props: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">{props.title}</h2>
          {props.description ? (
            <p className="mt-1 max-w-[34ch] text-sm leading-6 text-[var(--text-secondary)]">{props.description}</p>
          ) : null}
        </div>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

export function Surface({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-[30px] border border-[var(--border-soft)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center rounded-full border px-4 py-2.5 text-sm font-medium transition",
        active
          ? "border-transparent bg-[var(--brand-primary)] text-white"
          : "border-[var(--border-soft)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]",
      )}
    >
      {label}
    </Link>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-soft)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 font-display text-[1.7rem] font-semibold leading-none tracking-tight text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{hint}</p>
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "sky" | "emerald" | "amber" | "rose";
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase",
        tone === "neutral" && "border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral)]",
        tone === "sky"     && "border-[var(--status-review-border)]  bg-[var(--status-review-bg)]  text-[var(--status-review)]",
        tone === "emerald" && "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
        tone === "amber"   && "border-[var(--status-pending-border)] bg-[var(--status-pending-bg)] text-[var(--status-pending)]",
        tone === "rose"    && "border-[var(--status-danger-border)]  bg-[var(--status-danger-bg)]  text-[var(--status-danger)]",
      )}
    >
      {children}
    </span>
  );
}
