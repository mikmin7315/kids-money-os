import { HeaderActions } from "@/components/layout/app-header";
import { formatWon } from "@/lib/format";

interface ChildHeroProps {
  childName: string;
  balance: number;
  savingsBalance: number;
  borrowedBalance: number;
  currentInterestRate: number;
  maxInterestRate: number;
  isParent: boolean;
}

export function ChildHero({
  childName,
  balance,
  savingsBalance,
  borrowedBalance,
  currentInterestRate,
  maxInterestRate,
  isParent,
}: ChildHeroProps) {
  const xpPct = Math.min((currentInterestRate / maxInterestRate) * 100, 100);

  return (
    <section className="bg-hero-gradient relative overflow-hidden pb-10 pt-safe">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/10" />

      <div className="relative flex items-center justify-between px-5 pt-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-hero-label)]">Monari</p>
          <p className="mt-0.5 text-base font-bold text-[var(--color-hero-text)]">{childName}의 통장 🏆</p>
        </div>
        {isParent && (
          <div className="[&_a]:border-white/30 [&_a]:bg-white/20 [&_a]:text-white [&_a:hover]:border-white [&_a:hover]:bg-white/30">
            <HeaderActions />
          </div>
        )}
      </div>

      <div className="relative mt-6 px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-hero-muted)]">지금 내 돈</p>
        <p className="mt-1 text-6xl font-black tracking-tight text-[var(--color-hero-text)] drop-shadow-sm">
          {formatWon(balance)}
        </p>
        <p className="mt-2 text-sm font-medium text-[var(--color-hero-subtext)]">
          저축 <strong className="text-[var(--color-hero-text)]">{formatWon(savingsBalance)}</strong>
          {borrowedBalance > 0 && (
            <> · 빌린 돈 <strong className="text-[var(--color-hero-text)]">{formatWon(borrowedBalance)}</strong></>
          )}
        </p>
      </div>

      <div className="relative mt-5 px-5">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-hero-subtext)]">
          <span>이자율 레벨 ⚡</span>
          <span className="text-[var(--color-hero-text)]">{currentInterestRate}% / {maxInterestRate}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${xpPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--color-hero-muted)]">
          약속을 지킬수록 이자율이 올라가요 🚀
        </p>
      </div>
    </section>
  );
}
