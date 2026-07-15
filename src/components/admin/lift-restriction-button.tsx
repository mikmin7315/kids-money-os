"use client";

import { useActionState } from "react";
import { liftRestrictionAction } from "@/actions/admin-policy";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function LiftRestrictionButton({ restrictionId }: { restrictionId: string }) {
  const [state, formAction, pending] = useActionState(liftRestrictionAction, initial);
  return (
    <form action={formAction}>
      <input type="hidden" name="restriction_id" value={restrictionId} />
      {state.message && <p className={`mb-1 text-[11px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[var(--status-success-solid)] px-3 py-1.5 text-xs font-bold text-[var(--status-success-solid-text)] disabled:opacity-50">
        {pending ? "..." : "해제"}
      </button>
    </form>
  );
}
