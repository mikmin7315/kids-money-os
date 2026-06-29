"use client";

import { useActionState } from "react";
import { inviteGuardianAction } from "@/actions/guardians";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function InviteGuardianForm() {
  const [state, formAction, pending] = useActionState(inviteGuardianAction, initial);

  return (
    <form action={formAction} className="rounded-[16px] border border-[var(--color-border)] bg-white p-4 space-y-3">
      {state.message && (
        <p className={`text-sm font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>{state.message}</p>
      )}
      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">이메일 주소</label>
        <input
          name="email"
          type="email"
          required
          placeholder="guardian@example.com"
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[10px] bg-[var(--color-accent)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "전송 중..." : "초대 보내기"}
      </button>
    </form>
  );
}
