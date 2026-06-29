"use client";

import { useActionState } from "react";
import { replyInquiryAction } from "@/actions/inquiries";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function AdminInquiryReplyForm({ inquiryId }: { inquiryId: string }) {
  const [state, formAction, pending] = useActionState(replyInquiryAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={inquiryId} />

      {state.message && (
        <p className={`text-sm font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>
          {state.message}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">답변 *</label>
        <textarea
          name="reply"
          required
          rows={4}
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm resize-none"
          placeholder="사용자에게 보낼 답변을 입력하세요."
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">운영 메모 (내부)</label>
        <textarea
          name="note"
          rows={2}
          className="w-full rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm resize-none"
          placeholder="사용자에게 보이지 않는 운영 메모"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          name="status"
          className="rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <option value="resolved">답변 완료</option>
          <option value="in_progress">처리 중</option>
          <option value="closed">종료</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-[10px] bg-[var(--color-accent)] py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "등록 중..." : "답변 등록"}
        </button>
      </div>
    </form>
  );
}
