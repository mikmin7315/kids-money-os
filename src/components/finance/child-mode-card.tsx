import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatWon } from "@/lib/format";
import { ChildSummary } from "@/lib/types";

export function ChildModeCard({ summary }: { summary: ChildSummary }) {
  return (
    <Link
      href={`/child-pin/${summary.child.id}`}
      className="block rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))] p-5 shadow-[0_18px_48px_rgba(48,36,24,0.10)] transition hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold">{summary.child.name}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            PIN 입력 후 아이 전용 화면으로 이동합니다.
          </p>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 text-[var(--color-soft)]" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat label="잔액" value={formatWon(summary.wallet.balance)} />
        <MiniStat label="저축" value={formatWon(summary.wallet.savingsBalance)} />
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-white/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-3 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
