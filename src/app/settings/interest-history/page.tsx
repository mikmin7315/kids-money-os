import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InterestHistoryPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();

  const interestTxs = bundle.moneyTransactions
    .filter((t) => t.type === "interest")
    .sort((a, b) => b.date.localeCompare(a.date));

  const grouped = interestTxs.reduce<Record<string, typeof interestTxs>>((acc, tx) => {
    const key = `${tx.childId}__${tx.date.slice(0, 7)}`;
    (acc[key] ??= []).push(tx);
    return acc;
  }, {});

  const rows = Object.entries(grouped)
    .map(([key, txs]) => {
      const [childId, month] = key.split("__");
      const child = bundle.children.find((c) => c.id === childId);
      const total = txs.reduce((s, t) => s + t.amount, 0);
      const policy = bundle.interestPolicies.find((p) => p.childId === childId);
      return { child, month, total, txs, rate: policy?.baseInterestRate };
    })
    .sort((a, b) => b.month.localeCompare(a.month));

  const totalAllTime = rows.reduce((s, r) => s + r.total, 0);

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">설정 · 금융</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">이자 지급 내역</h1>
        {rows.length > 0 && (
          <div className="mt-3">
            <p className="text-[12px] font-semibold text-white/60 mb-0.5">누적 이자 총액</p>
            <p className="text-[28px] font-black tabular-nums text-white leading-none">
              +{formatWon(totalAllTime)}
            </p>
            <p className="mt-1 text-[12px] text-white/55">{rows.length}회 지급 완료</p>
          </div>
        )}
      </PageHero>

      <PageContent className="pt-5">
        {rows.length === 0 ? (
          <div className="monari-card px-5 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
              <TrendingUp size={26} />
            </span>
            <p className="mt-4 text-[16px] font-extrabold text-[var(--monari-ink)]">아직 이자 기록이 없어요</p>
            <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">매달 1일 정산 후 여기서 확인할 수 있어요.</p>
          </div>
        ) : (
          <>
            <section className="mb-5">
              <SectionTitle>월별 이자 내역</SectionTitle>
              <div className="mt-3 space-y-3">
                {rows.map(({ child, month, total, txs: monthTxs, rate }) => (
                  <div key={`${child?.id}-${month}`} className="monari-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--monari-ink-muted)]">
                          {child?.name} · {month.replace("-", "년 ")}월
                        </p>
                        <p className="mt-0.5 text-[22px] font-black tabular-nums text-[var(--monari-done)]">
                          +{formatWon(total)}
                        </p>
                      </div>
                      {rate !== undefined && (
                        <span className="rounded-full bg-[var(--monari-done-bg)] px-3 py-1 text-[12px] font-bold text-[var(--monari-done)]">
                          {formatPercent(rate)}
                        </span>
                      )}
                    </div>
                    {monthTxs.length > 1 && (
                      <div className="divide-y divide-[var(--monari-line)] border-t border-[var(--monari-line)] px-4">
                        {monthTxs.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between py-3">
                            <p className="text-[13px] text-[var(--monari-ink-muted)]">
                              {tx.date.slice(5).replace("-", "월 ")}일
                            </p>
                            <p className="text-[14px] font-bold text-[var(--monari-done)]">
                              +{formatWon(tx.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-[14px] bg-[var(--monari-hero-lo)] px-4 py-3.5 mb-6">
              <p className="text-[12px] font-bold text-[var(--monari-hero)] mb-0.5">💡 이자 계산 방식</p>
              <p className="text-[12px] text-[var(--monari-hero)]/70 leading-relaxed">
                매달 1일 — 지난 달 평균 잔액 × 확정 이자율 ÷ 12 로 계산돼요. 행동 약속을 지킬수록 이자율이 높아져요.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </AppNavShell>
  );
}
