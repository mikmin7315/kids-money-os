"use client";

import { useActionState } from "react";
import { confirmInterestRateAction } from "@/actions/finance";

const initial = { ok: false, message: "" };

export function InterestConfirmForm({
  childId,
  rate,
}: {
  childId: string;
  rate: number;
}) {
  const [state, action, pending] = useActionState(confirmInterestRateAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-[20px] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p style={{ fontSize: 48, marginBottom: 12 }}>🔒</p>
        <p style={{ fontSize: 20, fontWeight: 900, color: "var(--monari-ink)" }}>이자 약속 확정!</p>
        <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>{state.message}</p>
        <a
          href="/settings"
          className="mt-6 block w-full rounded-[18px] bg-[var(--monari-surface-soft)] py-4 text-base font-extrabold text-[var(--monari-hero)] text-center"
        >
          설정으로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <input type="hidden" name="childId" value={childId} />

      <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 4 }}>이 이자율로 확정할까요?</p>
      <p style={{ fontSize: 13, color: "var(--monari-ink-muted)", marginBottom: 16 }}>
        확정하면 아이도 이번 달 약속을 확인할 수 있어요.
      </p>

      {state.message && !state.ok && (
        <p className="mb-4 rounded-[14px] bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[18px] py-4 text-base font-extrabold text-white transition active:scale-[0.97] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)" }}
      >
        {pending ? "확정 중..." : `🔒 이자율 확정하기 (${rate}%)`}
      </button>
    </form>
  );
}
