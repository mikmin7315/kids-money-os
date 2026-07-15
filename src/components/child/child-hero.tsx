import Link from "next/link";
import { formatWonParts } from "@/lib/format";

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

  const { amount } = formatWonParts(balance);

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(155deg,#4c1d95_0%,#7c3aed_58%,#3b0764_100%)] px-6 py-7 mb-4 shadow-[0_16px_40px_rgba(76,29,149,0.30)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[var(--monari-hero)]/20" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-[#f59e0b]/12" />

      <p className="relative text-[14px] font-600 text-white/60 mb-1">
        안녕하세요, {childName}님 👋
      </p>

      <div className="relative flex items-end gap-2 leading-none mb-1">
        <span className="text-[52px] font-900 tracking-[-0.04em] tabular-nums text-white">{amount}</span>
        <span className="mb-2 text-[22px] font-700 text-white/60">원</span>
      </div>
      <p className="relative text-[14px] text-white/55 mb-6">{subtitle}</p>

      <div className="relative flex gap-3">
        <Link
          href="#borrow-form"
          className="flex-1 flex h-14 items-center justify-center rounded-[18px] bg-[#f59e0b] text-[16px] font-700 text-white shadow-[0_6px_18px_rgba(245,158,11,0.35)]"
        >
          용돈 요청하기
        </Link>
        <Link
          href="#save-form"
          className="flex-1 flex h-14 items-center justify-center rounded-[18px] bg-white/18 border border-white/25 text-[16px] font-700 text-white backdrop-blur-sm"
        >
          저축하기
        </Link>
      </div>
    </section>
  );
}
