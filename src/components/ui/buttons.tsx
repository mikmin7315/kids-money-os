import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; className?: string };

/** Parent-mode primary — pill, calm hover */
export function PrimaryButton({ children, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-11 items-center justify-center rounded-[var(--radius-pill)]",
        "bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-fg)]",
        "shadow-[0_6px_16px_rgba(79,63,240,0.20)] transition-[opacity,transform,box-shadow] duration-[var(--transition-fast)]",
        "hover:-translate-y-0.5 hover:shadow-[0_9px_20px_rgba(79,63,240,0.25)] active:translate-y-0 active:scale-[0.98]",
        "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-accent)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Parent-mode secondary — outlined pill */
export function SecondaryButton({ children, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-11 items-center justify-center rounded-[var(--radius-pill)]",
        "border border-[var(--color-border)] bg-[var(--color-panel)]",
        "px-6 text-sm font-semibold text-[var(--color-text)]",
        "transition-[border-color,color] duration-[var(--transition-fast)]",
        "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
        "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-accent)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Child-mode CTA — thick, bright, tactile press shadow */
export function PlayButton({ children, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)]",
        "bg-[var(--color-accent)] px-6 text-base font-extrabold tracking-wide text-[var(--color-accent-fg)]",
        "shadow-[0_4px_0_var(--color-accent-strong)]",
        "transition-[transform,box-shadow] duration-[var(--transition-fast)]",
        "hover:brightness-105",
        "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-accent)]",
        "active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-accent-strong)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
