"use client";

import { useActionState } from "react";
import { submitInquiryAction } from "@/actions/inquiries";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

const CATEGORIES = [
  { value: "general",   label: "일반 문의" },
  { value: "account",   label: "계정/로그인" },
  { value: "finance",   label: "금융·이자" },
  { value: "borrow",    label: "미리쓰기" },
  { value: "allowance", label: "용돈" },
  { value: "bug",       label: "버그 신고" },
  { value: "other",     label: "기타" },
];

export function InquirySubmitForm() {
  const [state, formAction, pending] = useActionState(submitInquiryAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-[24px] bg-[var(--status-success-solid)] p-5 text-center">
        <p style={{ fontSize: 36, marginBottom: 8 }}>✅</p>
        <p style={{ fontSize: 16, fontWeight: 800, color: "var(--status-success-solid-text)" }}>문의가 접수됐어요!</p>
        <p className="mt-1" style={{ fontSize: 13, color: "var(--monari-done)" }}>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
      {state.message && !state.ok && (
        <p className="text-sm font-semibold text-[var(--monari-minus)]">{state.message}</p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-bold text-[var(--monari-ink-soft)]">문의 유형</label>
        <select
          name="category"
          className="w-full rounded-[12px] border border-[#e5e7eb] bg-[var(--monari-surface-soft)] px-3 py-2.5 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-[var(--monari-ink-soft)]">제목 *</label>
        <input
          name="title"
          required
          maxLength={100}
          className="w-full rounded-[12px] border border-[#e5e7eb] bg-[var(--monari-surface-soft)] px-3 py-2.5 text-sm"
          placeholder="문의 제목을 입력해주세요"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-[var(--monari-ink-soft)]">내용 *</label>
        <textarea
          name="body"
          required
          rows={5}
          maxLength={2000}
          className="w-full rounded-[12px] border border-[#e5e7eb] bg-[var(--monari-surface-soft)] px-3 py-2.5 text-sm resize-none"
          placeholder="문의 내용을 자세히 입력해주세요. 스크린샷이나 오류 메시지가 있다면 설명해주세요."
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[14px] bg-[var(--monari-hero)] py-3 text-base font-extrabold text-white transition active:scale-[0.97] disabled:opacity-50"
      >
        {pending ? "접수 중..." : "문의 제출하기"}
      </button>
    </form>
  );
}
