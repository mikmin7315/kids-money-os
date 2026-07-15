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
        <p className={`mb-1 text-[10px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[var(--status-danger-solid)] px-2.5 py-1 text-[11px] font-bold text-[var(--status-danger-solid-text)] disabled:opacity-50">
        {pending ? "재처리 중..." : "재처리"}
      </button>
    </form>
  );
}
