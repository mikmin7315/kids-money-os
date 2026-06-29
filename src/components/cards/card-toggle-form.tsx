"use client";

import { useActionState } from "react";
import { toggleCardAction } from "@/actions/cards";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function CardToggleForm({ cardId, isEnabled }: { cardId: string; isEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(toggleCardAction, initial);
  const nextEnabled = !isEnabled;

  return (
    <form action={formAction}>
      <input type="hidden" name="card_id" value={cardId} />
      <input type="hidden" name="is_enabled" value={String(nextEnabled)} />
      {state.message && (
        <p className={`mb-2 text-xs font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`w-full rounded-[10px] py-2.5 text-sm font-bold transition disabled:opacity-50 ${
          isEnabled
            ? "bg-[#fef3c7] text-[#92400e]"
            : "bg-[#d1fae5] text-[#065f46]"
        }`}
      >
        {pending ? "처리 중..." : isEnabled ? "카드 일시 정지" : "카드 활성화"}
      </button>
    </form>
  );
}
