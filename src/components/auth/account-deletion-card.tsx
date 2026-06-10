"use client";

import { useActionState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  deleteAccountAction,
  type DeleteAccountState,
} from "@/lib/supabase/actions/account";

const initialState: DeleteAccountState = { ok: false, message: "" };

export function AccountDeletionCard() {
  const [state, action, pending] = useActionState(deleteAccountAction, initialState);

  return (
    <details className="monari-card mt-3 overflow-hidden border-rose-200">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 text-rose-700">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
          <AlertTriangle size={19} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">계정 삭제</span>
          <span className="mt-0.5 block text-xs leading-5 text-rose-600">
            가족 금융 데이터를 영구 삭제합니다.
          </span>
        </span>
      </summary>

      <form action={action} className="space-y-4 border-t border-rose-100 bg-rose-50/60 p-4">
        <div className="rounded-2xl bg-white p-4 text-xs leading-5 text-[var(--monari-ink-soft)]">
          <p className="font-extrabold text-rose-700">삭제 후에는 복구할 수 없습니다.</p>
          <p className="mt-1">
            등록한 아이, 잔액, 거래 내역, 약속 기록과 리포트가 모두 삭제됩니다.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-[var(--monari-ink)]">
            계속하려면 <strong className="text-rose-700">계정 삭제</strong>를 입력하세요
          </span>
          <input
            className="monari-input border-rose-200 focus:border-rose-500"
            name="confirmation"
            type="text"
            autoComplete="off"
            required
            aria-describedby="delete-account-status"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={17} aria-hidden="true" />
          {pending ? "계정 삭제 중..." : "모든 데이터와 계정 삭제"}
        </button>

        {state.message && (
          <p
            id="delete-account-status"
            role="alert"
            aria-live="assertive"
            className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-rose-700"
          >
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}
