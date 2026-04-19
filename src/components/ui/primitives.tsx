import Link from "next/link";
import { clsx } from "clsx";
import { ReactNode } from "react";

/** Full-bleed hero card used at the top of every parent page */
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
      <div className="relative overflow-hidden rounded-[30px] border border-[rgba(87,70,49,0.10)] bg-[linear-gradient(135deg,rgba(255,248,236,0.98),rgba(232,244,240,0.92))] px-6 py-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[rgba(15,139,124,0.08)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 -translate-x-8 translate-y-8 rounded-full border border-[rgba(200,122,34,0.14)]" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">{eyebrow}</p>
          <h2 className="mt-4 font-display text-[1.9rem] font-semibold leading-[1.07] tracking-tight">{title}</h2>
          {description && (
            <p className="mt-3 max-w-[31ch] text-sm leading-6 text-[var(--color-muted)]">{description}</p>
          )}
          {stats && <div className="mt-5">{stats}</div>}
        </div>
      </div>
    </section>
  );
}

/** Stat pill used inside PageHero stats grid */
export function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(87,70,49,0.08)] bg-white/70 p-3 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-2 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}

/** Empty state card — guides to next action instead of just saying "nothing here" */
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
    <div className="rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))] px-5 py-6 text-center">
      <p className="text-sm font-medium text-[var(--color-muted)]">{message}</p>
      {hint && <p className="mt-1.5 text-xs text-[var(--color-soft)]">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-transparent text-[var(--color-text)]">
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
          <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--color-text)]">{props.title}</h2>
          {props.description ? (
            <p className="mt-1 max-w-[34ch] text-sm leading-6 text-[var(--color-muted)]">{props.description}</p>
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
        "rounded-[30px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-md",
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
          ? "border-transparent bg-[var(--color-accent)] text-white"
          : "border-[var(--color-border)] bg-white/60 text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
      )}
    >
      {label}
    </Link>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[var(--shadow-soft)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-3 font-display text-[1.7rem] font-semibold leading-none tracking-tight text-[var(--color-text)]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">{hint}</p>
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
        tone === "neutral" && "border-zinc-200 bg-zinc-50 text-zinc-600",
        tone === "sky" && "border-teal-200 bg-teal-50 text-teal-700",
        tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}
