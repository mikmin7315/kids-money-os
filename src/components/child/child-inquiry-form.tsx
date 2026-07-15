"use client";

import { useActionState } from "react";
import { submitInquiryAction } from "@/actions/inquiries";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

const CHILD_CATEGORIES = [
  { value: "general",   label: "궁금한 것" },
  { value: "allowance", label: "용돈" },
  { value: "borrow",    label: "미리쓰기" },
  { value: "finance",   label: "이자·저금" },
  { value: "bug",       label: "앱이 이상해요" },
  { value: "other",     label: "기타" },
];

export function ChildInquiryForm() {
  const [state, formAction, pending] = useActionState(submitInquiryAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-[24px] bg-[var(--status-success-solid)] p-5 text-center">
        <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--status-success-solid-text)" }}>문의가 접수됐어요!</p>
        <p className="mt-1" style={{ fontSize: 12, color: "#047857" }}>빠르게 답변드릴게요 🙏</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
      {state.message && !state.ok && (
        <p className="text-sm font-semibold text-[var(--monari-minus)]">{state.message}</p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-bold text-[var(--monari-ink-soft)]">무엇이 궁금해요?</label>
        <select
          name="category"
          className="w-full rounded-[12px] border border-[#e5e7eb] bg-[var(--monari-surface-soft)] px-3 py-2.5 text-sm"
        >
          {CHILD_CATEGORIES.map((c) => (
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
          placeholder="짧게 써주세요"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-[var(--monari-ink-soft)]">내용 *</label>
        <textarea
          name="body"
          required
          rows={4}
          maxLength={1000}
          className="w-full rounded-[12px] border border-[#e5e7eb] bg-[var(--monari-surface-soft)] px-3 py-2.5 text-sm resize-none"
          placeholder="자세하게 설명해주세요!"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[14px] bg-[var(--monari-hero)] py-3 text-base font-extrabold text-white transition active:scale-[0.97] disabled:opacity-50"
      >
        {pending ? "보내는 중..." : "문의 보내기"}
      </button>
    </form>
  );
}
