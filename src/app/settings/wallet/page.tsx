import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireParentSession } from "@/lib/auth";
import { getParentWalletAction } from "@/actions/parent-wallet";
import { WalletChargeForm, BankAccountForm } from "@/components/finance/wallet-forms";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { formatWon, maskAccountNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ParentWalletPage() {
  await requireParentSession();
  const wallet = await getParentWalletAction();

  return (
    <MobileAppShell title="부모 지갑" subtitle="잔액 및 충전 관리">
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
      >
        <ArrowLeft size={16} /> 설정으로
      </Link>

      {/* 히어로 — 잔액 */}
      <section
        className="relative mb-6 overflow-hidden rounded-[24px] p-6 text-white"
        style={{
          background: "linear-gradient(145deg,#5b21b6 0%,#7c3aed 55%,#a855f7 100%)",
          boxShadow: "0 16px 40px rgba(109,40,217,0.35)",
        }}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-[13px] font-semibold text-white/70">현재 잔액</p>
          <p className="mt-1 text-[44px] font-black leading-none tracking-tight">
            {formatWon(wallet.balance)}
          </p>
          {wallet.bankName && (
            <p className="mt-2 text-sm text-white/60">
              {wallet.bankName} {maskAccountNumber(wallet.accountNumber)}
            </p>
          )}
        </div>
      </section>

      {/* 충전 폼 */}
      <div className="mb-4 rounded-[22px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
        <p className="mb-4 text-[11px] font-extrabold uppercase tracking-widest text-[var(--monari-hero)]">
          충전하기
        </p>
        <hr className="mb-4 border-[var(--monari-line)]" />
        <WalletChargeForm />
      </div>

      {/* 계좌 연결 */}
      <div className="mb-4 rounded-[22px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-[var(--monari-hero)]">
          연결 계좌
        </p>
        <p className="mb-4 text-[14px] font-medium text-[var(--monari-ink-muted)]">
          이체 확인 등 연락이 필요할 때 사용해요
        </p>
        <hr className="mb-4 border-[var(--monari-line)]" />
        <BankAccountForm
          defaultBankName={wallet.bankName ?? ""}
          defaultAccountNumber={wallet.accountNumber ?? ""}
          defaultAccountHolder={wallet.accountHolder ?? ""}
        />
      </div>

      {/* 안내 */}
      <div className="rounded-[18px] bg-[var(--monari-hero-lo)] px-4 py-4">
        <p className="text-[14px] font-extrabold text-[var(--monari-hero)]">💡 충전 방법</p>
        <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-[var(--monari-hero)]">
          아래 계좌로 이체 후 금액을 입력하고 충전 요청 버튼을 눌러주세요.<br />
          <strong>카카오뱅크 3333-01-0000000 (모나리)</strong><br />
          이체 메모에 가입 이메일을 적어주시면 빠르게 확인돼요.
        </p>
      </div>
    </MobileAppShell>
  );
}
