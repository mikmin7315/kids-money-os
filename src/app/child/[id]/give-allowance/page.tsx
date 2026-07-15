import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { GiveAllowanceForm } from "@/components/finance/give-allowance-form";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { getParentWalletAction } from "@/actions/parent-wallet";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GiveAllowancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireParentSession();
  if (!auth.user) redirect("/login");

  const [bundle, dashboard, parentWallet] = await Promise.all([
    getAppDataBundle(),
    getDashboardView(),
    getParentWalletAction().catch(() => null),
  ]);
  const child = bundle.children.find((c) => c.id === id);
  const summary = dashboard.children.find((c) => c.child.id === id);
  if (!child || !summary) notFound();

  const balance = summary.wallet.balance;

  return (
    <div
      className="mx-auto min-h-screen max-w-[460px] bg-[#faf5ff]"
      style={{ boxShadow: "0 0 70px rgba(76,29,149,0.16)" }}
    >
      <div className="px-4 pb-12 pt-12">
        <Link
          href={`/child/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
        >
          <ArrowLeft size={16} /> {child.name} 통장으로
        </Link>

        {/* 히어로 */}
        <div
          className="relative mb-6 overflow-hidden rounded-[24px] p-6 text-white"
          style={{
            background: "linear-gradient(145deg,#059669 0%,#10b981 60%,#34d399 100%)",
            boxShadow: "0 16px 40px rgba(5,150,105,0.35)",
          }}
        >
          <div className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full bg-white/10" />
          <p className="relative text-[13px] font-semibold text-white/70">즉시 지급</p>
          <h1 className="relative mt-1 text-2xl font-black tracking-tight">{child.name}에게 용돈 주기</h1>
          <div className="relative mt-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-white/60">현재 남긴 돈</p>
              <p className="mt-0.5 text-lg font-black">{formatWon(balance)}</p>
            </div>
            <span style={{ fontSize: 40 }}>💰</span>
          </div>
        </div>

        {/* 부모 지갑 잔액 */}
        {parentWallet !== null && (
          <div className="mb-4 rounded-[16px] bg-white p-4 shadow-[var(--monari-shadow-md)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[var(--monari-hero)]" />
                <p className="text-sm font-bold text-[var(--monari-ink-soft)]">내 지갑 잔액</p>
              </div>
              <Link href="/settings/wallet" className="text-xs font-bold text-[var(--monari-hero)]">충전 →</Link>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums" style={{ color: parentWallet.balance === 0 ? "var(--monari-minus)" : "var(--monari-ink)" }}>
              {formatWon(parentWallet.balance)}
            </p>
            {parentWallet.balance === 0 && (
              <p className="mt-1 text-xs font-bold text-[var(--monari-minus)]">잔액이 없어요. 충전 후 용돈을 지급할 수 있어요.</p>
            )}
          </div>
        )}

        {/* 이번 달 현황 */}
        <div className="mb-6 rounded-[16px] bg-white p-4 shadow-[var(--monari-shadow-md)]">
          <p className="mb-3 text-xs font-bold text-[var(--monari-ink-muted)]">이번 달 지급 현황</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] bg-[var(--status-success-solid)] p-3">
              <p className="text-xs font-semibold text-[var(--monari-done)]">받은 용돈</p>
              <p className="mt-1 text-base font-black text-[var(--status-success-solid-text)]">
                {formatWon(summary.monthReport.totalAllowance)}
              </p>
            </div>
            <div className="rounded-[14px] bg-[var(--monari-hero-lo)] p-3">
              <p className="text-xs font-semibold text-[var(--monari-hero)]">이번 달 이자</p>
              <p className="mt-1 text-base font-black text-[var(--monari-hero)]">
                {formatWon(summary.monthReport.totalInterest)}
              </p>
            </div>
          </div>
        </div>

        {/* 지급 폼 */}
        <GiveAllowanceForm
          childId={id}
          childName={child.name}
          parentWalletBalance={parentWallet?.balance}
        />
      </div>
    </div>
  );
}
