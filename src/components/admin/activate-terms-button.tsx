"use client";

import { useActionState } from "react";
import { activateTermsAction } from "@/actions/terms";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function ActivateTermsButton({ id, type }: { id: string; type: string }) {
  const [state, formAction, pending] = useActionState(activateTermsAction, initial);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="type" value={type} />
      {state.message && (
        <p className={`mb-1 text-[11px] font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-[8px] border border-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-50"
      >
        {pending ? "처리 중" : "활성화"}
      </button>
    </form>
  );
}
