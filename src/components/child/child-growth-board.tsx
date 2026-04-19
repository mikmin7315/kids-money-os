import { formatWon } from "@/lib/format";
import { ChildSectionHeader } from "./child-section-header";

interface ChildGrowthBoardProps {
  totalSave: number;
  totalSpend: number;
  behaviorSuccessRate: number;
  expectedInterest: number;
  currentInterestRate: number;
}

export function ChildGrowthBoard({
  totalSave,
  totalSpend,
  behaviorSuccessRate,
  expectedInterest,
  currentInterestRate,
}: ChildGrowthBoardProps) {
  return (
    <section>
      <ChildSectionHeader title="이번달 성장 보드" />
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[ 
          { emoji: "🐷", label: "저축", value: formatWon(totalSave) },
          { emoji: "💸", label: "지출", value: formatWon(totalSpend) },
          { emoji: "🌟", label: "달성률", value: `${behaviorSuccessRate.toFixed(0)}%` },
          { emoji: "💰", label: "예상 이자", value: formatWon(expectedInterest) },
          { emoji: "📈", label: "이자율", value: `${currentInterestRate}%` },
        ].map((item) => (
          <StatChip key={item.label} {...item} />
        ))}
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--color-chip-border)]/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-hero-via)] to-[var(--color-hero-from)] transition-all duration-500"
          style={{ width: `${Math.min(behaviorSuccessRate, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs font-bold text-[var(--color-accent)]">
        {behaviorSuccessRate.toFixed(0)}% 달성 중
      </p>
    </section>
  );
}

function StatChip({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex min-w-[96px] shrink-0 flex-col items-center gap-1.5 rounded-[18px] border border-[var(--color-chip-border)] bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,242,203,0.88))] px-3 py-3 shadow-[var(--shadow-soft)]">
      <span className="text-xl">{emoji}</span>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</p>
      <p className="text-sm font-extrabold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
