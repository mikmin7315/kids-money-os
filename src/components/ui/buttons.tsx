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
        "transition-[opacity,transform] duration-[var(--transition-fast)]",
        "hover:opacity-90 active:scale-[0.98]",
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
        "active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-accent-strong)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
