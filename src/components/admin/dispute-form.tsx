"use client";

import { useActionState } from "react";
import { openDisputeAction, resolveDisputeAction } from "@/actions/admin-card-disputes";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function OpenDisputeForm({ txId }: { txId: string }) {
  const [state, formAction, pending] = useActionState(openDisputeAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="tx_id" value={txId} />
      <textarea name="memo" placeholder="분쟁 사유 (선택)" rows={2}
        className="w-full rounded-[8px] border border-[var(--color-border)] px-2 py-1.5 text-xs" />
      {state.message && <p className={`text-[10px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>}
      <button type="submit" disabled={pending}
        className="rounded-[8px] bg-[var(--monari-minus)] py-2 text-xs font-bold text-white disabled:opacity-50">
        {pending ? "..." : "분쟁 개설"}
      </button>
    </form>
  );
}

export function ResolveDisputeForm({ txId }: { txId: string }) {
  const [state, formAction, pending] = useActionState(resolveDisputeAction, initial);
  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="tx_id" value={txId} />
      {state.message && <p className={`self-center text-[10px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>}
      <button type="submit" name="outcome" value="resolved" disabled={pending}
        className="flex-1 rounded-[8px] bg-[var(--monari-done)] py-1.5 text-xs font-bold text-white disabled:opacity-50">
        {pending ? "..." : "완료"}
      </button>
      <button type="submit" name="outcome" value="rejected" disabled={pending}
        className="flex-1 rounded-[8px] border border-[var(--color-border)] py-1.5 text-xs font-bold disabled:opacity-50">
        반려
      </button>
    </form>
  );
}
