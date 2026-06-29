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
      {state.message && <p className={`mb-1 text-[11px] font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[#d1fae5] px-3 py-1.5 text-xs font-bold text-[#065f46] disabled:opacity-50">
        {pending ? "..." : "해제"}
      </button>
    </form>
  );
}
