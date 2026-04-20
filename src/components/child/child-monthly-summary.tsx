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
      className="rounded-[24px] bg-white px-5 py-5 mb-4"
      style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}
    >
      <p className="text-[16px] font-700 text-[#2B2B2B] mb-4">이번 달 요약</p>
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
      className={`flex flex-col gap-1.5 px-3 py-1 ${center ? "items-center text-center border-x border-[rgba(43,43,43,0.08)]" : right ? "items-end text-right" : "items-start"}`}
    >
      <p className="text-[12px] font-500 text-[rgba(43,43,43,0.55)]">{label}</p>
      <p className="text-[18px] font-700 leading-tight tracking-tight tabular-nums text-[#2B2B2B]">
        {value}
      </p>
    </div>
  );
}
