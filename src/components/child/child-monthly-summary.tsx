import { formatWon } from "@/lib/format";

interface ChildMonthlySummaryProps {
  monthlyAllowance: number;
  monthlySaved: number;
  balance: number;
}

export function ChildMonthlySummary({
  monthlyAllowance,
  monthlySaved,
  balance,
}: ChildMonthlySummaryProps) {
  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold text-[#2B2B2B]">이번 달 요약</h2>
      <div
        className="rounded-[24px] bg-white px-5 py-5"
        style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}
      >
        <div className="grid grid-cols-3">
          <SummaryCol label="받은 용돈" value={formatWon(monthlyAllowance)} align="left" />
          <SummaryCol label="저축한 금액" value={formatWon(monthlySaved)} align="center" />
          <SummaryCol label="남은 돈" value={formatWon(balance)} align="right" accent />
        </div>
      </div>
    </section>
  );
}

function SummaryCol({
  label,
  value,
  align,
  accent,
}: {
  label: string;
  value: string;
  align: "left" | "center" | "right";
  accent?: boolean;
}) {
  const alignClass =
    align === "center"
      ? "items-center text-center"
      : align === "right"
        ? "items-end text-right"
        : "items-start text-left";

  return (
    <div
      className={`flex flex-col gap-1.5 px-3 py-1 ${alignClass} ${
        align === "center"
          ? "border-x border-[rgba(43,43,43,0.08)]"
          : ""
      }`}
    >
      <p className="text-[12px] font-medium leading-none text-[rgba(43,43,43,0.55)]">{label}</p>
      <p
        className={`text-[20px] font-bold leading-tight tracking-tight tabular-nums ${
          accent ? "text-[#C66B3D]" : "text-[#2B2B2B]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
