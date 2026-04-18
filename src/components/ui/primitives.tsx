import Link from "next/link";
import { clsx } from "clsx";
import { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">{children}</main>;
}

export function MobileShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28">{children}</div>;
}

export function Section(props: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">{props.title}</h2>
          {props.description ? (
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">{props.description}</p>
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
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5",
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
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-[var(--color-accent)] text-white"
          : "bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-accent)] hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      <p className="text-xs font-medium text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">{value}</p>
      <p className="mt-1.5 text-xs text-[var(--color-soft)]">{hint}</p>
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
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        tone === "neutral" && "bg-zinc-100 text-zinc-600",
        tone === "sky" && "bg-indigo-50 text-indigo-700",
        tone === "emerald" && "bg-emerald-50 text-emerald-700",
        tone === "amber" && "bg-amber-50 text-amber-700",
        tone === "rose" && "bg-rose-50 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}
