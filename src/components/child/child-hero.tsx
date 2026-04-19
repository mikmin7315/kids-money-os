import Link from "next/link";
import { formatWon } from "@/lib/format";

interface ChildHeroProps {
  childId: string;
  childName: string;
  balance: number;
  savingsBalance: number;
  pendingCount: number;
  todayPromiseCount: number;
}

export function ChildHero({
  childId,
  childName,
  balance,
  savingsBalance,
  pendingCount,
  todayPromiseCount,
}: ChildHeroProps) {
  const statusLine =
    pendingCount > 0
      ? `확인 기다리는 약속이 ${pendingCount}개 있어`
      : todayPromiseCount > 0
        ? `오늘 약속 ${todayPromiseCount}개, 같이 확인해봐`
        : "오늘은 약속이 없어. 잘하고 있어!";

  return (
    <section className="px-4 pt-5">
      <div
        className="relative overflow-hidden rounded-[28px] bg-[#10367D] px-6 py-7"
        style={{ boxShadow: "0 12px 36px rgba(16,54,125,0.22)" }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/[0.04]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/[0.04]" />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Monari
          </p>

          <p className="mt-4 text-[15px] font-semibold text-white/85">{childName}아</p>
          <p className="mt-1 text-[38px] font-extrabold leading-none tracking-tight text-white tabular-nums">
            {formatWon(balance)}
          </p>
          <p className="mt-2 text-[13px] font-medium text-white/65">
            저축 중 {formatWon(savingsBalance)}
          </p>

          <p className="mt-5 text-[14px] font-medium leading-snug text-white/80">
            {statusLine}
          </p>

          <div className="mt-5 flex gap-3">
            <Link
              href={`#today-promises`}
              className="inline-flex h-11 min-w-0 items-center justify-center rounded-2xl bg-[#C66B3D] px-5 text-[14px] font-bold text-white transition hover:bg-[#A85930] active:scale-[0.98]"
            >
              오늘 약속 보기
            </Link>
            <Link
              href="/records"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 text-[14px] font-semibold text-white transition hover:bg-white/[0.18]"
            >
              기록 확인
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
