import { formatWon } from "@/lib/format";

interface ChildMonthlySummaryProps {
  monthlyAllowance: number;
  monthlySpend: number;
  monthlySaved: number;
}

export function ChildMonthlySummary({
  monthlyAllowance,
  monthlySpend,
  monthlySaved,
}: ChildMonthlySummaryProps) {
  return (
    <section
      className="rounded-[24px] bg-[var(--monari-surface)] px-5 py-5 mb-4"
      style={{ boxShadow: "var(--monari-shadow-lg)" }}
    >
      <p className="text-[16px] font-bold text-[var(--monari-ink)] mb-4">이번 달 요약</p>
      <div className="grid grid-cols-3">
        <SummaryCol label="받은 용돈" value={formatWon(monthlyAllowance)} />
        <SummaryCol label="지출 합계" value={formatWon(monthlySpend)} center />
        <SummaryCol label="저축 금액" value={formatWon(monthlySaved)} right />
      </div>
    </section>
  );
}

function SummaryCol({
  label,
  value,
  center,
  right,
}: {
  label: string;
  value: string;
  center?: boolean;
  right?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 px-3 py-1 ${center ? "items-center text-center border-x border-[var(--monari-line)]" : right ? "items-end text-right" : "items-start"}`}
    >
      <p className="text-[12px] font-500 text-[var(--monari-ink-soft)]">{label}</p>
      <p className="text-[18px] font-bold leading-tight tracking-tight tabular-nums text-[var(--monari-ink)]">
        {value}
      </p>
    </div>
  );
}
