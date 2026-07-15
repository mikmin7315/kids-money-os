"use client";

import { useActionState } from "react";
import { cancelInviteAction } from "@/actions/guardians";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const [state, formAction, pending] = useActionState(cancelInviteAction, initial);
  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="invite_id" value={inviteId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-[8px] border border-[var(--status-danger-solid)] px-2 py-1 text-[11px] font-bold text-[var(--monari-minus)] disabled:opacity-50"
        >
          취소
        </button>
      </form>
      {state.message && !state.ok && (
        <p className="mt-1 text-[11px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}
