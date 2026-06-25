import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireParentSession } from "@/lib/auth";
import { getParentWalletAction } from "@/actions/parent-wallet";
import { WalletChargeForm, BankAccountForm } from "@/components/finance/wallet-forms";
import { formatWon, maskAccountNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ParentWalletPage() {
  await requireParentSession();
  const wallet = await getParentWalletAction();

  return (
    <div className="detail-shell">
      <Link href="/settings" className="detail-back">
        <ArrowLeft size={16} /> 설정으로
      </Link>

      <p className="detail-eyebrow">내 지갑</p>
      <h1 className="detail-title">💳 부모 지갑</h1>
      <p className="detail-subtitle">이체 확인 후 반영된 잔액으로 아이에게 용돈을 지급할 수 있어요</p>

      {/* 잔액 카드 */}
      <div className="detail-hero">
        <p className="detail-kpi-label">현재 잔액</p>
        <p className="detail-kpi">{formatWon(wallet.balance)}</p>
        {wallet.bankName && (
          <p className="detail-kpi-sub">
            {wallet.bankName} {maskAccountNumber(wallet.accountNumber)}
          </p>
        )}
      </div>

      {/* 충전 폼 */}
      <div className="detail-card">
        <div className="detail-card-head">
          <p className="detail-section-label">충전하기</p>
        </div>
        <hr className="detail-card-divider" />
        <div className="detail-card-body" style={{ paddingTop: 16 }}>
          <WalletChargeForm />
        </div>
      </div>

      {/* 계좌 연결 */}
      <div className="detail-card">
        <div className="detail-card-head">
          <p className="detail-section-label">연결 계좌</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#6b7280", marginTop: 4 }}>
            이체 확인 등 연락이 필요할 때 사용해요
          </p>
        </div>
        <hr className="detail-card-divider" />
        <div className="detail-card-body" style={{ paddingTop: 16 }}>
          <BankAccountForm
            defaultBankName={wallet.bankName ?? ""}
            defaultAccountNumber={wallet.accountNumber ?? ""}
            defaultAccountHolder={wallet.accountHolder ?? ""}
          />
        </div>
      </div>

      {/* 안내 */}
      <div className="detail-info-box">
        <p className="detail-info-title">💡 충전 방법</p>
        <p className="detail-info-body">
          아래 계좌로 이체 후 금액을 입력하고 충전 요청 버튼을 눌러주세요.<br />
          <strong style={{ color: "#5b21b6" }}>카카오뱅크 3333-01-0000000 (모나리)</strong><br />
          이체 메모에 가입 이메일을 적어주시면 빠르게 확인돼요.
        </p>
      </div>
    </div>
  );
}
