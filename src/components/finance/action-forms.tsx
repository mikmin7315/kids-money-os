"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  FormState,
  submitBehaviorApprovalForm,
  submitBehaviorRejectForm,
  submitBehaviorLogForm,
  submitBorrowRejectForm,
  submitBorrowRequestForm,
  submitBorrowApprovalForm,
  submitMonthlyReportForm,
  submitTransactionForm,
} from "@/actions/finance";
import { BehaviorRule, ChildProfile } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ────────────────────────────────────────────────────────────
// Child-facing forms
// ────────────────────────────────────────────────────────────

export function ChildBehaviorCheckForm({
  childId,
  behaviorRules,
}: {
  childId: string;
  behaviorRules: BehaviorRule[];
}) {
  const [state, action] = useActionState(submitBehaviorLogForm, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="date" value={today()} />
      <select name="behaviorRuleId" className={childFieldClass}>
        {behaviorRules.map((rule) => (
          <option key={rule.id} value={rule.id}>
            {rule.title}
          </option>
        ))}
      </select>
      <input className={childFieldClass} name="memo" type="text" placeholder="한 마디 남기기 (선택)" />
      <PlayButton label="체크 완료 ✅" />
      <FormMessage state={state} />
    </form>
  );
}

export function BorrowRequestQuickForm({ childId }: { childId: string }) {
  const [state, action] = useActionState(submitBorrowRequestForm, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      <input className={childFieldClass} name="purpose" type="text" placeholder="무엇을 사고 싶나요?" />
      <input className={childFieldClass} name="requestedAmount" type="number" min="1" defaultValue="3000" />
      <select className={childFieldClass} name="repaymentMode" defaultValue="next_allowance">
        <option value="next_allowance">다음 용돈에서 상환</option>
        <option value="installment">분할 상환</option>
      </select>
      <input className={childFieldClass} name="installmentCount" type="number" min="1" defaultValue="2" placeholder="분할 횟수" />
      <PlayButton label="요청 보내기 💳" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Parent approval forms (inline — one per card, no duplicate quick forms)
// ────────────────────────────────────────────────────────────

export function InlineBehaviorDecisionForm({ behaviorLogId }: { behaviorLogId: string }) {
  const [approveState, approveAction] = useActionState(submitBehaviorApprovalForm, initialState);
  const [rejectState, rejectAction] = useActionState(submitBehaviorRejectForm, initialState);

  return (
    <div className="space-y-2.5">
      <form action={approveAction} className="space-y-2.5">
        <input type="hidden" name="behaviorLogId" value={behaviorLogId} />
        <input className={fieldClass} name="approvedDate" type="date" defaultValue={today()} />
        <SubmitButton label="약속 확인해줄게요 ✓" />
      </form>
      <form action={rejectAction}>
        <input type="hidden" name="behaviorLogId" value={behaviorLogId} />
        <SecondarySubmitButton label="다시 이야기해봐요" />
      </form>
      <FormMessage state={approveState.message ? approveState : rejectState} />
    </div>
  );
}

export function InlineBorrowDecisionForm({ borrowRequestId }: { borrowRequestId: string }) {
  const [approveState, approveAction] = useActionState(submitBorrowApprovalForm, initialState);
  const [rejectState, rejectAction] = useActionState(submitBorrowRejectForm, initialState);

  return (
    <div className="space-y-2.5">
      <form action={approveAction} className="space-y-2.5">
        <input type="hidden" name="borrowRequestId" value={borrowRequestId} />
        <input className={fieldClass} name="approvalDate" type="date" defaultValue={today()} />
        <SubmitButton label="이 조건으로 허락할게요 ✓" />
      </form>
      <form action={rejectAction}>
        <input type="hidden" name="borrowRequestId" value={borrowRequestId} />
        <SecondarySubmitButton label="조금 더 이야기해봐요" />
      </form>
      <FormMessage state={approveState.message ? approveState : rejectState} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Parent utility forms (settings / behaviors pages)
// ────────────────────────────────────────────────────────────

export function BehaviorLogQuickForm({
  childOptions,
  behaviorRules,
}: {
  childOptions: ChildProfile[];
  behaviorRules: BehaviorRule[];
}) {
  const [state, action] = useActionState(submitBehaviorLogForm, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[28px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(239,228,210,0.9))] p-4">
      <p className="font-display text-xl font-semibold">행동 기록 테스트</p>
      <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
        {childOptions.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
          </option>
        ))}
      </select>
      <select name="behaviorRuleId" className={fieldClass} defaultValue={behaviorRules[0]?.id}>
        {behaviorRules.map((rule) => (
          <option key={rule.id} value={rule.id}>
            {rule.title}
          </option>
        ))}
      </select>
      <input className={fieldClass} name="date" type="date" defaultValue={today()} />
      <input className={fieldClass} name="memo" type="text" placeholder="메모" />
      <SubmitButton label="기록 저장" />
      <FormMessage state={state} />
    </form>
  );
}

export function TransactionQuickForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action] = useActionState(submitTransactionForm, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[28px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(239,228,210,0.9))] p-4">
      <p className="font-display text-xl font-semibold">거래 테스트</p>
      <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
        {childOptions.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
          </option>
        ))}
      </select>
      <select name="type" className={fieldClass} defaultValue="spend">
        <option value="allowance">용돈</option>
        <option value="reward">보상</option>
        <option value="spend">지출</option>
        <option value="save">저축</option>
        <option value="unsave">저축 인출</option>
        <option value="borrow">미리쓰기</option>
        <option value="repay">상환</option>
        <option value="interest">이자</option>
      </select>
      <input className={fieldClass} name="date" type="date" defaultValue={today()} />
      <input className={fieldClass} name="amount" type="number" min="1" defaultValue="1000" />
      <input className={fieldClass} name="memo" type="text" placeholder="메모" />
      <SubmitButton label="거래 저장" />
      <FormMessage state={state} />
    </form>
  );
}

export function MonthlyReportQuickForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action] = useActionState(submitMonthlyReportForm, initialState);
  const now = new Date();

  return (
    <form action={action} className="space-y-3 rounded-[28px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(239,228,210,0.9))] p-4">
      <p className="font-display text-xl font-semibold">월별 리포트 생성</p>
      <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
        {childOptions.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
          </option>
        ))}
      </select>
      <input className={fieldClass} name="year" type="number" defaultValue={now.getFullYear()} />
      <input className={fieldClass} name="month" type="number" min="1" max="12" defaultValue={now.getMonth() + 1} />
      <SubmitButton label="리포트 생성" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Shared primitives
// ────────────────────────────────────────────────────────────

function PlayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[var(--color-accent)] px-4 py-3.5 text-sm font-bold text-[var(--color-accent-fg)] shadow-[0_4px_0_var(--color-accent-strong)] transition-all active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-accent-strong)] disabled:opacity-60"
    >
      {pending ? "처리 중..." : label}
    </button>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-95 disabled:opacity-60"
    >
      {pending ? "처리 중..." : label}
    </button>
  );
}

function SecondarySubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-[var(--color-border)] bg-white/85 px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-60"
    >
      {pending ? "처리 중..." : label}
    </button>
  );
}

function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;

  return (
    <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
      {state.message}
    </p>
  );
}

const fieldClass =
  "w-full rounded-[20px] border border-[var(--color-border)] bg-white/85 px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]";

const childFieldClass =
  "w-full rounded-[20px] border border-[var(--color-chip-border,var(--color-border))] bg-[var(--color-surface-soft,var(--color-card))] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]";
