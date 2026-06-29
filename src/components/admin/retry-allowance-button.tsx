"use client";

import { useActionState } from "react";
import { retryAllowanceBatchAction } from "@/actions/admin-ops";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function RetryAllowanceButton({ scheduledDate }: { scheduledDate: string }) {
  const [state, formAction, pending] = useActionState(retryAllowanceBatchAction, initial);
  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="scheduled_date" value={scheduledDate} />
      {state.message && (
        <p className={`mb-1 text-[10px] font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[#fee2e2] px-2.5 py-1 text-[11px] font-bold text-[#991b1b] disabled:opacity-50">
        {pending ? "재처리 중..." : "재처리"}
      </button>
    </form>
  );
}
