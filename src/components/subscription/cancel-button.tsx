"use client";

import { useActionState, useState } from "react";
import { cancelSubscriptionAction } from "@/actions/subscription";

export function CancelSubscriptionButton() {
  const [state, action, pending] = useActionState(cancelSubscriptionAction, { ok: false, message: "" });
  const [confirming, setConfirming] = useState(false);

  if (state.ok) {
    return (
      <p className="py-2 text-[13px] font-semibold text-[var(--monari-done)]">✅ {state.message}</p>
    );
  }

  return (
    <div>
      {confirming ? (
        <div className="flex items-center gap-2">
          <form action={action}>
            <button
              type="submit"
              disabled={pending}
              className="h-10 rounded-[12px] bg-rose-500 px-5 text-[13px] font-bold text-white transition active:scale-90 disabled:opacity-60"
            >
              {pending ? "처리 중..." : "해지 확인"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-10 rounded-[12px] bg-[var(--monari-surface-soft)] px-5 text-[13px] font-bold text-[var(--monari-ink-muted)] transition active:scale-90"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full rounded-[12px] border border-red-200 bg-red-50 py-3 text-[13px] font-bold text-red-500 transition active:scale-[0.98]"
        >
          구독 해지 신청
        </button>
      )}
      {state.message && !state.ok && (
        <p className="mt-2 text-[12px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}
