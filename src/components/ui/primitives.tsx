import Link from "next/link";
import { clsx } from "clsx";
import { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">{children}</main>;
}

export function MobileShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-24">{children}</div>;
}

export function Section(props: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{props.title}</h2>
          {props.description ? <p className="mt-1 text-sm text-[var(--color-muted)]">{props.description}</p> : null}
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
        "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[0_18px_48px_rgba(48,36,24,0.10)]",
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
        active ? "bg-[var(--color-text)] text-[var(--color-bg)]" : "bg-white/70 text-[var(--color-text)] hover:bg-white",
      )}
    >
      {label}
    </Link>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Surface className="p-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-[var(--color-soft)]">{hint}</p>
    </Surface>
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
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-stone-200 text-stone-700",
        tone === "sky" && "bg-sky-100 text-sky-700",
        tone === "emerald" && "bg-emerald-100 text-emerald-700",
        tone === "amber" && "bg-amber-100 text-amber-700",
        tone === "rose" && "bg-rose-100 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}
