"use client";

import { useActionState, useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  chargeParentWalletAction,
  saveParentBankAccountAction,
} from "@/actions/parent-wallet";
import { MoneyInput } from "@/components/ui/money-input";

function FormMessage({ state }: { state: { ok: boolean; message: string } }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (!state.ok || !state.message) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [state]);

  if (!state.message || !visible) return null;

  return (
    <div
      role={state.ok ? "status" : "alert"}
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-[14px] px-3.5 py-3 text-[13px] font-semibold ${
        state.ok
          ? "bg-[var(--monari-done-bg)] text-[var(--monari-done)]"
          : "bg-[var(--monari-minus-bg)] text-[var(--monari-minus)]"
      }`}
    >
      {state.ok
        ? <CheckCircle2 size={16} className="mt-px shrink-0" aria-hidden="true" />
        : <AlertCircle size={16} className="mt-px shrink-0" aria-hidden="true" />}
      <span className="flex-1">{state.message}</span>
      {!state.ok && (
        <button type="button" onClick={() => setVisible(false)} className="ml-1 shrink-0 opacity-60 hover:opacity-100" aria-label="닫기">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

const QUICK_AMOUNTS = [10000, 30000, 50000, 100000];

export function WalletChargeForm() {
  const [state, action, pending] = useActionState(chargeParentWalletAction, { ok: false, message: "" });
  const [amount, setAmount] = useState(0);

  if (state.ok) {
    return (
      <div className="py-6 text-center">
        <p style={{ fontSize: 40, marginBottom: 10 }}>💸</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: "var(--monari-ink)" }}>충전 요청 완료!</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--monari-ink-muted)", marginTop: 6 }}>{state.message}</p>
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
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-soft)", marginBottom: 8 }}>빠른 선택</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              className={`rounded-[12px] py-2.5 text-center text-sm font-bold transition active:scale-[0.95] ${amount === amt ? "bg-[var(--monari-hero)] text-white" : "bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]"}`}
              onClick={() => setAmount(amt)}
            >
              {(amt / 10000).toFixed(0)}만원
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-soft)", display: "block", marginBottom: 6 }}>
          충전 금액
        </label>
        <div className="relative">
          <MoneyInput
            name="amount"
            value={amount || undefined}
            onChange={(raw) => setAmount(Number(raw) || 0)}
            min={1000}
            max={1000000}
            placeholder="0"
            required
            className="monari-input pr-10 text-right tabular-nums"
            style={{ fontSize: 20, fontWeight: 800 }}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--monari-ink-muted)]">원</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", marginTop: 6 }}>최소 1,000원 · 최대 100만 원</p>
      </div>

      <FormMessage state={state} />

      <button
        type="submit"
        disabled={pending || amount < 1000}
        className="monari-btn-primary w-full disabled:opacity-50"
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
      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-done)", padding: "12px 0" }}>
        ✅ {state.message}
      </p>
    );
  }

  const BANKS = ["카카오뱅크", "토스뱅크", "케이뱅크", "국민은행", "신한은행", "우리은행", "하나은행", "농협", "기업은행", "SC제일은행"];

  return (
    <form action={action} className="space-y-3">
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-soft)", display: "block", marginBottom: 6 }}>
          은행
        </label>
        <select name="bankName" defaultValue={defaultBankName} required className="monari-input">
          <option value="">은행 선택</option>
          {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-soft)", display: "block", marginBottom: 6 }}>
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
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-soft)", display: "block", marginBottom: 6 }}>
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

      <FormMessage state={state} />

      <button type="submit" disabled={pending} className="monari-btn-primary w-full">
        {pending ? "저장 중..." : "계좌 저장"}
      </button>
    </form>
  );
}
