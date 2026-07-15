"use client";

import { useActionState } from "react";
import { processDeletionAction } from "@/actions/admin-policy";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function DeletionProcessForm({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(processDeletionAction, initial);
  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="request_id" value={requestId} />
      {state.message && <p className={`mr-2 self-center text-xs font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>}
      <button type="submit" name="action" value="complete" disabled={pending}
        className="flex-1 rounded-[8px] bg-[var(--monari-minus)] py-2 text-xs font-bold text-white disabled:opacity-50">
        삭제 완료
      </button>
      <button type="submit" name="action" value="reject" disabled={pending}
        className="flex-1 rounded-[8px] border border-[var(--color-border)] py-2 text-xs font-bold disabled:opacity-50">
        반려
      </button>
    </form>
  );
}
