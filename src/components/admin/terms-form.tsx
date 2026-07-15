"use client";

import { useActionState } from "react";
import { createTermsAction } from "@/actions/terms";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function TermsCreateForm() {
  const [state, formAction, pending] = useActionState(createTermsAction, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-[16px] border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm font-extrabold text-[var(--color-text)]">새 약관 등록</p>

      {state.message && (
        <p className={`text-sm font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">유형 *</label>
          <select name="type" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm">
            <option value="service">이용약관</option>
            <option value="privacy">개인정보처리방침</option>
            <option value="marketing">마케팅 수신 동의</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">버전 *</label>
          <input
            name="version"
            required
            placeholder="예: 2.0"
            className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">제목 *</label>
        <input
          name="title"
          required
          maxLength={100}
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
          placeholder="약관 제목"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">내용 *</label>
        <textarea
          name="body"
          required
          rows={8}
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm resize-y"
          placeholder="약관 전문을 입력하세요."
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_active" name="is_active" value="true" className="rounded" />
        <label htmlFor="is_active" className="text-sm font-semibold text-[var(--color-text)]">
          즉시 활성화 (기존 동일 유형 비활성화)
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[10px] bg-[var(--color-accent)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "등록 중..." : "약관 등록"}
      </button>
    </form>
  );
}
