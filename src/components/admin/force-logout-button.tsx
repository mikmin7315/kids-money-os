"use client";

import { useActionState } from "react";
import { forceLogoutAction } from "@/actions/admin-sessions";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function ForceLogoutButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(forceLogoutAction, initial);
  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="user_id" value={userId} />
      {state.message && (
        <p className={`mb-1 text-[10px] font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-[8px] bg-[#fee2e2] px-2.5 py-1.5 text-[11px] font-bold text-[#991b1b] disabled:opacity-50"
      >
        {pending ? "..." : "강제 로그아웃"}
      </button>
    </form>
  );
}
