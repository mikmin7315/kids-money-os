"use client";

import { useActionState } from "react";
import { cancelInviteAction } from "@/actions/guardians";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const [, formAction, pending] = useActionState(cancelInviteAction, initial);
  return (
    <form action={formAction}>
      <input type="hidden" name="invite_id" value={inviteId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-[8px] border border-[#fee2e2] px-2 py-1 text-[11px] font-bold text-[#dc2626] disabled:opacity-50"
      >
        취소
      </button>
    </form>
  );
}
