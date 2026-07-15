"use client";

import { useActionState } from "react";
import { cancelBorrowRequestAction } from "@/actions/finance";

type FormState = { ok: boolean; message: string };
const initial: FormState = { ok: false, message: "" };

export function CancelBorrowButton({ borrowRequestId }: { borrowRequestId: string }) {
  const [state, formAction, pending] = useActionState(cancelBorrowRequestAction, initial);

  if (state.ok) {
    return (
      <p className="mt-3 text-center text-sm font-bold text-[var(--monari-ink-muted)]">✅ 취소됐어요</p>
    );
  }

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="borrowRequestId" value={borrowRequestId} />
      {state.message && !state.ok && (
        <p className="mb-2 text-center text-xs text-[#dc2626]">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[12px] border border-[#d97706] bg-transparent py-2.5 text-sm font-bold text-[#92400e] transition active:scale-[0.97] disabled:opacity-50"
      >
        {pending ? "취소 중..." : "요청 취소하기"}
      </button>
    </form>
  );
}
