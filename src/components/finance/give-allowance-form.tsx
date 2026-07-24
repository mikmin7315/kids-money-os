"use client";

import { useActionState, useState } from "react";
import { giveAllowanceForm } from "@/actions/finance";
import { MoneyInput } from "@/components/ui/money-input";

const QUICK_AMOUNTS = [1000, 3000, 5000, 10000];

const initialState = { ok: false, message: "" };

export function GiveAllowanceForm({
  childId,
  childName,
  parentWalletBalance,
}: {
  childId: string;
  childName: string;
  parentWalletBalance?: number;
}) {
  const [state, action, pending] = useActionState(giveAllowanceForm, initialState);
  const [amount, setAmount] = useState("");
  const numAmount = Math.floor(Number(amount.replace(/,/g, "")));
  const insufficient = parentWalletBalance !== undefined && numAmount > 0 && numAmount > parentWalletBalance;

  if (state.ok) {
    return (
      <div className="rounded-[24px] bg-white p-8 text-center shadow-[var(--monari-shadow-md)]">
        <p style={{ fontSize: 52 }}>🎉</p>
        <p className="mt-3 text-lg font-black text-[var(--monari-ink)]">용돈을 줬어요!</p>
        <p className="mt-1 text-sm text-[var(--monari-ink-muted)]">{state.message}</p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-5 w-full rounded-[14px] bg-[var(--monari-hero)] py-3 text-sm font-extrabold text-white"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="childId" value={childId} />

      <div className="rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
        <label className="mb-2 block text-sm font-extrabold text-[var(--monari-ink)]">
          얼마나 줄까요?
        </label>

        {/* 빠른 금액 버튼 */}
        <div className="mb-3 grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(q.toLocaleString("ko-KR"))}
              className="rounded-[12px] py-2.5 text-xs font-bold transition-colors"
              style={{
                background: amount === String(q) ? "var(--monari-hero)" : "#f3f0ff",
                color: amount === String(q) ? "#fff" : "var(--monari-hero)",
              }}
            >
              {q.toLocaleString()}
            </button>
          ))}
        </div>

        <MoneyInput
          name="amount"
          min={1}
          max={100000000}
          value={amount}
          onChange={setAmount}
          placeholder="직접 입력 (원)"
          className="w-full rounded-[14px] border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] px-4 py-3 text-base font-extrabold text-[var(--monari-ink)] outline-none focus:border-[var(--monari-hero)]"
          required
        />
      </div>

      <div className="rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
        <label className="mb-2 block text-sm font-extrabold text-[var(--monari-ink)]">
          메모 (선택)
        </label>
        <input
          name="memo"
          type="text"
          placeholder={`${childName}에게 한마디`}
          maxLength={50}
          className="w-full rounded-[14px] border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] px-4 py-3 text-sm text-[var(--monari-ink)] outline-none focus:border-[var(--monari-hero)]"
        />
      </div>

      {state.message && !state.ok && (
        <p className="rounded-[14px] bg-[var(--status-pending-solid)] px-4 py-3 text-sm font-bold text-[var(--status-pending-solid-text)]">
          {state.message}
        </p>
      )}

      {insufficient && (
        <p className="rounded-[14px] bg-[#fef2f2] px-4 py-3 text-sm font-bold text-[var(--monari-minus)]">
          내 지갑 잔액({parentWalletBalance!.toLocaleString()}원)이 부족해요.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !amount || insufficient}
        className="w-full rounded-[16px] py-4 text-base font-extrabold text-white transition-opacity disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#3B0764,#6C3FE8)" }}
      >
        {pending ? "처리 중..." : `💰 ${childName}에게 바로 주기`}
      </button>
    </form>
  );
}
