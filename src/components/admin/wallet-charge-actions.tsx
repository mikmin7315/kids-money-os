"use client";

import { useActionState } from "react";
import { approveWalletChargeAction, rejectWalletChargeAction } from "@/actions/admin";

export function AdminWalletChargeActions({ chargeId }: { chargeId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approveWalletChargeAction, { ok: false, message: "" });
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectWalletChargeAction, { ok: false, message: "" });

  if (approveState.ok) return <p className="text-sm font-bold text-[var(--monari-done)]">✓ 충전 승인 완료</p>;
  if (rejectState.ok) return <p className="text-sm font-bold text-[var(--monari-ink-muted)]">반려 완료</p>;

  const pending = approvePending || rejectPending;

  return (
    <div className="space-y-2">
      {(approveState.message && !approveState.ok) || (rejectState.message && !rejectState.ok) ? (
        <p className="text-xs text-red-600">{approveState.message || rejectState.message}</p>
      ) : null}
      <div className="flex gap-2">
        <form action={rejectAction} className="flex-1">
          <input type="hidden" name="chargeId" value={chargeId} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-[12px] border-2 border-[#e5e7eb] py-2.5 text-sm font-bold text-[var(--monari-ink-muted)] transition active:scale-95 disabled:opacity-50"
          >
            반려
          </button>
        </form>
        <form action={approveAction} className="flex-1">
          <input type="hidden" name="chargeId" value={chargeId} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-[12px] bg-[var(--monari-hero)] py-2.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
          >
            {approvePending ? "처리 중…" : "충전 승인"}
          </button>
        </form>
      </div>
    </div>
  );
}
