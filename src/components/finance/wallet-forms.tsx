"use client";

import { useActionState } from "react";
import {
  chargeParentWalletAction,
  saveParentBankAccountAction,
} from "@/actions/parent-wallet";

const QUICK_AMOUNTS = [10000, 30000, 50000, 100000];

export function WalletChargeForm() {
  const [state, action, pending] = useActionState(chargeParentWalletAction, { ok: false, message: "" });

  if (state.ok) {
    return (
      <div className="py-6 text-center">
        <p style={{ fontSize: 40, marginBottom: 10 }}>💸</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#1a0533" }}>충전 요청 완료!</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#6b7280", marginTop: 6 }}>{state.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 w-full rounded-[14px] bg-[var(--monari-hero)] py-3.5 text-sm font-extrabold text-white"
        >
          확인
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {/* 빠른 금액 */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>빠른 선택</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              className="rounded-[12px] bg-[var(--monari-hero-lo)] py-2.5 text-center text-sm font-bold text-[var(--monari-hero)] transition active:scale-[0.95]"
              onClick={() => {
                const el = document.getElementById("charge-amount") as HTMLInputElement;
                if (el) el.value = String(amt);
              }}
            >
              {(amt / 10000).toFixed(0)}만원
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
          충전 금액
        </label>
        <div className="relative">
          <input
            id="charge-amount"
            name="amount"
            type="number"
            min="1000"
            max="1000000"
            step="1000"
            placeholder="0"
            required
            className="monari-input pr-10 text-right tabular-nums"
            style={{ fontSize: 20, fontWeight: 800 }}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9ca3af]">원</span>
        </div>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>최소 1,000원 · 최대 100만 원</p>
      </div>

      {state.message && !state.ok && (
        <p style={{ fontSize: 14, color: "#dc2626", fontWeight: 600 }}>{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="monari-btn-primary w-full"
      >
        {pending ? "처리 중..." : "충전 요청"}
      </button>
    </form>
  );
}

export function BankAccountForm({
  defaultBankName,
  defaultAccountNumber,
  defaultAccountHolder,
}: {
  defaultBankName: string;
  defaultAccountNumber: string;
  defaultAccountHolder: string;
}) {
  const [state, action, pending] = useActionState(saveParentBankAccountAction, { ok: false, message: "" });

  if (state.ok) {
    return (
      <p style={{ fontSize: 15, fontWeight: 700, color: "#059669", padding: "12px 0" }}>
        ✅ {state.message}
      </p>
    );
  }

  const BANKS = ["카카오뱅크", "토스뱅크", "케이뱅크", "국민은행", "신한은행", "우리은행", "하나은행", "농협", "기업은행", "SC제일은행"];

  return (
    <form action={action} className="space-y-3">
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
          은행
        </label>
        <select name="bankName" defaultValue={defaultBankName} required className="monari-input">
          <option value="">은행 선택</option>
          {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
          계좌번호
        </label>
        <input
          name="accountNumber"
          type="text"
          defaultValue={defaultAccountNumber}
          placeholder="숫자만 입력"
          inputMode="numeric"
          required
          className="monari-input"
        />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
          예금주
        </label>
        <input
          name="accountHolder"
          type="text"
          defaultValue={defaultAccountHolder}
          placeholder="예금주 이름"
          required
          className="monari-input"
        />
      </div>

      {state.message && !state.ok && (
        <p style={{ fontSize: 14, color: "#dc2626", fontWeight: 600 }}>{state.message}</p>
      )}

      <button type="submit" disabled={pending} className="monari-btn-primary w-full">
        {pending ? "저장 중..." : "계좌 저장"}
      </button>
    </form>
  );
}
