"use client";

import { useActionState } from "react";
import { applyCardAction } from "@/actions/cards";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function CardApplyForm({ childOptions }: { childOptions: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(applyCardAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-[16px] bg-[#d1fae5] px-5 py-8 text-center">
        <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
        <p className="text-sm font-bold text-[#065f46]">신청이 접수됐어요!</p>
        <p className="mt-1 text-xs text-[#047857]">카드 발급 완료 시 알림을 보내드릴게요.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-[16px] border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm font-extrabold text-[var(--color-text)]">카드 신청하기</p>

      {state.message && (
        <p className="text-sm font-semibold text-[#dc2626]">{state.message}</p>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">아이 선택 *</label>
        <select name="child_id" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm">
          {childOptions.map((c) => (
            <option key={c.id} value={c.id}>{String(c.name)}</option>
          ))}
        </select>
      </div>

      <div className="rounded-[10px] bg-[#f9fafb] p-3 text-xs text-[var(--color-muted)]">
        신청 전 <span className="font-bold text-[var(--color-text)]">서비스 이용약관</span> 및{" "}
        <span className="font-bold text-[var(--color-text)]">개인정보 처리방침</span>에 동의하는 것으로 간주됩니다.
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[10px] bg-[var(--color-accent)] py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "신청 중..." : "카드 신청 시작하기"}
      </button>
    </form>
  );
}
