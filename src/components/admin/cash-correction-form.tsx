"use client";

import { useActionState } from "react";
import { createCashCorrectionAction } from "@/actions/admin-ops";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function CashCorrectionForm({ childOptions }: { childOptions: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createCashCorrectionAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-[14px] border border-[var(--color-border)] p-4">
      <select name="child_id" className="w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm">
        <option value="">아이 선택</option>
        {childOptions.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        name="amount"
        type="number"
        placeholder="정정 금액 (+ 지급 / - 차감)"
        className="w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      <input
        name="reason"
        placeholder="정정 사유"
        className="w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      {state.message && (
        <p className={`text-[11px] font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[var(--color-accent)] py-2 text-sm font-bold text-white disabled:opacity-50">
        {pending ? "처리 중..." : "정정 처리"}
      </button>
    </form>
  );
}
