"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { syncCardTransactionsAction } from "@/actions/card-sync";

type State = { ok: boolean; message: string; count?: number };
const initial: State = { ok: false, message: "" };

export function CardSyncButton({ cardId, childName }: { cardId: string; childName: string }) {
  const [state, formAction, pending] = useActionState(
    (_prev: State, fd: FormData) => syncCardTransactionsAction(String(fd.get("card_id"))),
    initial,
  );

  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="card_id" value={cardId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-[10px] border border-[var(--monari-line)] bg-[var(--monari-surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--monari-ink-soft)] transition active:scale-[0.97] disabled:opacity-50"
      >
        <RefreshCw size={12} className={pending ? "animate-spin" : ""} />
        {pending ? "동기화 중..." : `${childName} 동기화`}
      </button>
      {state.message && (
        <p className={`text-[11px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
