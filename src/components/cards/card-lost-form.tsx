"use client";

import Link from "next/link";
import { useActionState } from "react";
import { reportCardLostAction } from "@/actions/cards";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function CardLostForm({ cardId, childName }: { cardId: string; childName: string }) {
  const [state, formAction, pending] = useActionState(reportCardLostAction, initial);

  if (state.ok) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <p style={{ fontSize: 48, marginBottom: 12 }}>🔒</p>
        <p className="text-base font-extrabold text-[var(--color-text)]">카드를 즉시 정지했어요</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">재발급이 필요하면 고객센터에 문의해주세요.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/cards" className="rounded-[12px] border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold">카드 관리로</Link>
          <Link href="/inquiries" className="rounded-[12px] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white">재발급 문의</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <p style={{ fontSize: 48, marginBottom: 12 }}>⚠️</p>
      <p className="text-base font-extrabold text-[var(--color-text)]">{childName} 카드 분실 신고</p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        신고 즉시 카드가 정지되며<br />이후 결제가 불가능해요.
      </p>
      {state.message && (
        <p className="mt-3 text-sm font-semibold text-[var(--monari-minus)]">{state.message}</p>
      )}
      <form action={formAction} className="mt-6 w-full space-y-3">
        <input type="hidden" name="card_id" value={cardId} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[14px] bg-[var(--monari-minus)] py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "처리 중..." : "즉시 분실 신고하기"}
        </button>
      </form>
    </div>
  );
}
