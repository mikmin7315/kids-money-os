import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireParentSession } from "@/lib/auth";
import { getParentWalletAction } from "@/actions/parent-wallet";
import { WalletChargeForm, BankAccountForm } from "@/components/finance/wallet-forms";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { formatWon, maskAccountNumber } from "@/lib/format";
import { SectionTitle } from "@/components/monari/ui";

export const dynamic = "force-dynamic";

export default async function ParentWalletPage() {
  await requireParentSession();
  const wallet = await getParentWalletAction();

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">금융 설정</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">부모 지갑</h1>
        <div className="mt-4 flex items-end gap-2">
          <p className="text-[40px] font-black leading-none tracking-tight text-white">
            {formatWon(wallet.balance)}
          </p>
        </div>
        {wallet.bankName && (
          <p className="mt-2 text-[13px] text-white/60">
            {wallet.bankName} {maskAccountNumber(wallet.accountNumber)}
          </p>
        )}
      </PageHero>

      <PageContent className="pt-5">

        {/* 충전하기 */}
        <section className="mb-5">
          <SectionTitle>충전하기</SectionTitle>
          <div className="monari-card mt-3 p-5">
            <WalletChargeForm />
          </div>
        </section>

        {/* 연결 계좌 */}
        <section className="mb-5">
          <SectionTitle>연결 계좌</SectionTitle>
          <div className="monari-card mt-3 p-5">
            <p className="mb-4 text-[13px] text-[var(--monari-ink-muted)]">
              이체 확인 등 연락이 필요할 때 사용해요
            </p>
            <BankAccountForm
              defaultBankName={wallet.bankName ?? ""}
              defaultAccountNumber={wallet.accountNumber ?? ""}
              defaultAccountHolder={wallet.accountHolder ?? ""}
            />
          </div>
        </section>

        {/* 충전 안내 */}
        <div className="mb-6 rounded-[16px] bg-[var(--monari-hero-lo)] px-4 py-4">
          <p className="text-[13px] font-bold text-[var(--monari-hero)] mb-1.5">충전 방법</p>
          <p className="text-[13px] leading-relaxed text-[var(--monari-hero)]">
            아래 계좌로 이체 후 금액을 입력하고 충전 요청 버튼을 눌러주세요.<br />
            <strong>카카오뱅크 3333-01-0000000 (모나리)</strong><br />
            이체 메모에 가입 이메일을 적어주시면 빠르게 확인돼요.
          </p>
        </div>

      </PageContent>
    </AppNavShell>
  );
}
