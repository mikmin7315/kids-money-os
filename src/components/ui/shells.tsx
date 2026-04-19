import { ReactNode } from "react";
import { clsx } from "clsx";

export function ParentShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-theme="parent" className={clsx("min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]", className)}>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28">
        {children}
      </div>
    </div>
  );
}

export function ChildShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-theme="child"
      className={clsx(
        "min-h-screen text-[var(--color-text)]",
        "[background:radial-gradient(ellipse_80%_40%_at_50%_0%,#fff3d4_0%,#fff8ec_60%,#fff8ec_100%)]",
        className,
      )}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28">
        {children}
      </div>
    </div>
  );
}
