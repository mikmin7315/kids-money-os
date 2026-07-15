"use client";

import { useActionState } from "react";
import { addRestrictionAction } from "@/actions/admin-policy";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function AddRestrictionForm({
  parents,
  childOptions,
}: {
  parents: { id: string; email: string }[];
  childOptions: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(addRestrictionAction, initial);

  return (
    <form action={formAction} className="space-y-3 rounded-[16px] border border-[var(--color-border)] bg-white p-4">
      {state.message && (
        <p className={`text-sm font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">부모 계정</label>
          <select name="user_id" className="w-full rounded-[10px] border border-[var(--color-border)] px-2 py-2 text-xs">
            <option value="">선택 안 함</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.email}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">아이 계정</label>
          <select name="child_id" className="w-full rounded-[10px] border border-[var(--color-border)] px-2 py-2 text-xs">
            <option value="">선택 안 함</option>
            {childOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">제한 유형</label>
          <select name="type" className="w-full rounded-[10px] border border-[var(--color-border)] px-2 py-2 text-xs">
            <option value="suspend">일시 정지</option>
            <option value="read_only">읽기 전용</option>
            <option value="full">전체 차단</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">해제 일자</label>
          <input type="date" name="ends_at" className="w-full rounded-[10px] border border-[var(--color-border)] px-2 py-2 text-xs" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">사유 *</label>
        <input name="reason" required maxLength={200} placeholder="제한 사유를 입력해주세요" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={pending} className="w-full rounded-[10px] bg-[var(--monari-minus)] py-2.5 text-sm font-bold text-white disabled:opacity-50">
        {pending ? "적용 중..." : "이용 제한 적용"}
      </button>
    </form>
  );
}
