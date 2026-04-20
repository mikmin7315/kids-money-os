import Link from "next/link";
import { formatWon } from "@/lib/format";

interface ChildHeroProps {
  childId: string;
  childName: string;
  balance: number;
  savingsBalance: number;
  pendingCount: number;
  recentAllowanceDate?: string;
}

export function ChildHero({
  childName,
  balance,
  pendingCount,
  recentAllowanceDate,
}: ChildHeroProps) {
  const subtitle =
    pendingCount > 0
      ? `확인 기다리는 약속이 ${pendingCount}개 있어요`
      : recentAllowanceDate
        ? "이번 주 용돈 지급 완료!"
        : "오늘도 잘 하고 있어요!";

  return (
    <section
      className="rounded-[24px] bg-[#10367D] px-6 py-7 mb-4"
      style={{ boxShadow: "0 12px 36px rgba(16,54,125,0.22)" }}
    >
      <p className="text-[15px] font-500 text-white/85 mb-2">
        안녕하세요, {childName}님
      </p>

      <p className="text-[40px] font-800 leading-none tracking-tight text-white tabular-nums mb-1">
        {formatWon(balance)}
      </p>
      <p className="text-[14px] text-white/65 mb-5">{subtitle}</p>

      <div className="flex gap-3">
        <Link
          href="#borrow-form"
          className="flex-1 flex h-12 items-center justify-center rounded-[16px] bg-[#C66B3D] text-[15px] font-700 text-white"
        >
          용돈 요청하기
        </Link>
        <Link
          href="#save-form"
          className="flex-1 flex h-12 items-center justify-center rounded-[16px] border border-white/30 bg-white text-[15px] font-700 text-[#10367D]"
        >
          저축하기
        </Link>
      </div>
    </section>
  );
}
