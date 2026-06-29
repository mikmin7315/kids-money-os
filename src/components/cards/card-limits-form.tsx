"use client";

import { useActionState } from "react";
import { updateCardLimitsAction } from "@/actions/cards";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function CardLimitsForm({ cardId, dailyLimit, monthlyLimit }: {
  cardId: string; dailyLimit: number; monthlyLimit: number;
}) {
  const [state, formAction, pending] = useActionState(updateCardLimitsAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="card_id" value={cardId} />
      {state.message && (
        <p className={`text-sm font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>{state.message}</p>
      )}
      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">일 한도 (원)</label>
        <input
          name="daily_limit"
          type="number"
          defaultValue={dailyLimit}
          min={1000}
          step={1000}
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">월 한도 (원)</label>
        <input
          name="monthly_limit"
          type="number"
          defaultValue={monthlyLimit}
          min={1000}
          step={1000}
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[10px] bg-[var(--color-accent)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "저장 중..." : "한도 저장"}
      </button>
    </form>
  );
}
