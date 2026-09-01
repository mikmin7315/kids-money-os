"use client";

import { useState } from "react";
import { useActionState } from "react";
import { rechargeCardAction } from "@/actions/cards";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

const QUICK_AMOUNTS = [5000, 10000, 30000, 50000];

export function CardRechargeForm({ cardId, maxAmount }: {
  cardId: string;
  maxAmount: number;
}) {
  const [state, formAction, pending] = useActionState(rechargeCardAction, initial);
  const [amount, setAmount] = useState("");

  const displayValue = amount ? Number(amount).toLocaleString("ko-KR") : "";
  const numericAmount = Number(amount.replace(/,/g, "")) || 0;

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
    setAmount(raw);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="card_id" value={cardId} />
      <input type="hidden" name="amount" value={amount} />

      {state.message && (
        <p className={`text-sm font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>
          {state.message}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">
          충전 금액 (원)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInput}
          placeholder="0"
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2.5 text-sm"
        />
        <p className="mt-1 text-[11px] text-[var(--monari-ink-muted)]">
          최소 1,000원 · 최대 {Math.min(maxAmount, 1_000_000).toLocaleString("ko-KR")}원
        </p>
      </div>

      {/* 빠른 선택 */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_AMOUNTS.filter((v) => v <= maxAmount).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            className={`rounded-[10px] border py-2 text-[12px] font-bold transition active:scale-[0.97] ${
              numericAmount === v
                ? "border-[var(--monari-hero)] bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]"
                : "border-[var(--monari-line)] text-[var(--monari-ink-soft)]"
            }`}
          >
            {v >= 10000 ? `${v / 10000}만` : `${v / 1000}천`}원
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending || numericAmount < 1000 || numericAmount > maxAmount}
        className="w-full rounded-[10px] bg-[var(--monari-hero)] py-3 text-[14px] font-bold text-white disabled:opacity-50"
      >
        {pending
          ? "충전 중..."
          : numericAmount >= 1000
          ? `${numericAmount.toLocaleString("ko-KR")}원 충전`
          : "충전하기"}
      </button>
    </form>
  );
}
