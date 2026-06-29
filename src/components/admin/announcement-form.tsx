"use client";

import { useActionState } from "react";
import { createAnnouncementAction } from "@/actions/announcements";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function AnnouncementForm() {
  const [state, formAction, pending] = useActionState(createAnnouncementAction, initial);

  return (
    <form action={formAction} className="space-y-3 rounded-[16px] border border-[var(--color-border)] bg-white p-4">
      {state.message && (
        <p className={`text-sm font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>
          {state.message}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">제목 *</label>
        <input
          name="title"
          required
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
          placeholder="공지 제목"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">내용 *</label>
        <textarea
          name="body"
          required
          rows={4}
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
          placeholder="공지 내용을 입력하세요."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">유형</label>
          <select name="type" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm">
            <option value="notice">공지</option>
            <option value="maintenance">점검</option>
            <option value="update">업데이트</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">대상</label>
          <select name="target" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm">
            <option value="all">전체</option>
            <option value="parent">부모만</option>
            <option value="child">아이만</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">게시 시작 (선택)</label>
          <input type="datetime-local" name="starts_at" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">게시 종료 (선택)</label>
          <input type="datetime-local" name="ends_at" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">상태</label>
        <select name="status" className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm">
          <option value="draft">임시저장</option>
          <option value="active">바로 게시</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[12px] bg-[var(--color-accent)] py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
      >
        {pending ? "등록 중..." : "공지 등록"}
      </button>
    </form>
  );
}
