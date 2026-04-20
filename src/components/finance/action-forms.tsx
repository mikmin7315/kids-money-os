"use client";

import { useState } from "react";
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
import { formatWon } from "@/lib/format";

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
  doneRuleIds = [],
}: {
  childId: string;
  behaviorRules: BehaviorRule[];
  doneRuleIds?: string[];
}) {
  const [state, action] = useActionState(submitBehaviorLogForm, initialState);

  if (behaviorRules.length === 0) {
    return (
      <p className="py-4 text-center text-[14px] text-[rgba(43,43,43,0.55)]">
        아직 약속이 없어요. 부모님과 함께 만들어봐요.
      </p>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="date" value={today()} />

      <div className="space-y-2">
        {behaviorRules.map((rule) => {
          const isDone = doneRuleIds.includes(rule.id);
          return (
            <div
              key={rule.id}
              className={`flex items-center gap-3 rounded-[18px] px-4 py-3.5 transition ${
                isDone ? "opacity-60" : "bg-[#F0F0F0]"
              }`}
              style={isDone ? { background: "rgba(43,43,43,0.05)" } : {}}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-[15px] font-semibold ${
                    isDone ? "text-[rgba(43,43,43,0.50)]" : "text-[#2B2B2B]"
                  }`}
                >
                  {rule.title}
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-[rgba(43,43,43,0.50)]">
                  +{formatWon(rule.rewardAmount)} 보상
                </p>
              </div>
              {isDone ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2F7D57]/12 text-[#2F7D57]">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <path d="M4 9.5L7.5 13L14 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              ) : (
                <button
                  type="submit"
                  name="behaviorRuleId"
                  value={rule.id}
                  className="h-10 shrink-0 rounded-2xl bg-[#10367D] px-4 text-[13px] font-bold text-white transition hover:bg-[#0d2d6a] active:scale-[0.96]"
                >
                  했어요
                </button>
              )}
            </div>
          );
        })}
      </div>

      <input
        name="memo"
        type="text"
        placeholder="한 마디 남기기 (선택)"
        className="mt-3 w-full rounded-[16px] border border-[rgba(43,43,43,0.10)] bg-[#EBEBEB] px-4 py-3 text-[14px] text-[#2B2B2B] outline-none placeholder:text-[rgba(43,43,43,0.38)] focus:border-[#C66B3D]"
      />

      <FormMessage state={state} />
    </form>
  );
}

const PRESET_AMOUNTS = [1000, 2000, 3000, 5000];

export function BorrowRequestQuickForm({ childId }: { childId: string }) {
  const [amount, setAmount] = useState(3000);
  const [showCustom, setShowCustom] = useState(false);
  const [state, action] = useActionState(submitBorrowRequestForm, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="repaymentMode" value="next_allowance" />
      <input type="hidden" name="installmentCount" value="1" />
      <input type="hidden" name="requestedAmount" value={amount} />

      {/* Purpose */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[rgba(43,43,43,0.65)]">
          무엇을 사고 싶어?
        </label>
        <input
          name="purpose"
          type="text"
          placeholder="예: 문구점에서 필통 사고 싶어요"
          className="w-full rounded-[16px] border border-[rgba(43,43,43,0.10)] bg-[#EBEBEB] px-4 py-3 text-[14px] text-[#2B2B2B] outline-none placeholder:text-[rgba(43,43,43,0.38)] focus:border-[#C66B3D]"
        />
      </div>

      {/* Amount presets */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[rgba(43,43,43,0.65)]">
          얼마가 필요해?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setShowCustom(false); }}
              className={`rounded-[14px] py-3 text-[13px] font-bold transition active:scale-[0.96] ${
                amount === a && !showCustom
                  ? "bg-[#C66B3D] text-white"
                  : "bg-[#EBEBEB] text-[#2B2B2B]"
              }`}
            >
              {formatWon(a)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className="mt-2 text-[12px] font-medium text-[rgba(43,43,43,0.50)] underline underline-offset-2"
        >
          직접 입력
        </button>
        {showCustom && (
          <input
            type="number"
            min="100"
            step="100"
            value={amount}
            onChange={(e) => setAmount(Math.max(100, Number(e.target.value)))}
            className="mt-2 w-full rounded-[16px] border-2 border-[#C66B3D] bg-[#EBEBEB] px-4 py-3 text-[15px] font-bold text-[#2B2B2B] outline-none"
          />
        )}
      </div>

      {/* Info note */}
      <div className="rounded-[14px] bg-[rgba(16,54,125,0.06)] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-[rgba(43,43,43,0.55)]">
          부모님이 확인한 뒤 허락하면 다음 용돈에서 갚게 돼.
        </p>
      </div>

      <ChildPlayButton label="부모님께 요청 보내기" />
      <FormMessage state={state} />
    </form>
  );
}

const SAVE_PRESETS = [1000, 2000, 5000, 10000];

export function ChildSaveForm({ childId }: { childId: string }) {
  const [amount, setAmount] = useState(1000);
  const [showCustom, setShowCustom] = useState(false);
  const [state, action] = useActionState(submitTransactionForm, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="type" value="save" />
      <input type="hidden" name="date" value={today()} />
      <input type="hidden" name="memo" value="저축하기" />
      <input type="hidden" name="amount" value={amount} />

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[rgba(43,43,43,0.65)]">
          얼마를 저축할까?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SAVE_PRESETS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setShowCustom(false); }}
              className={`rounded-[14px] py-3 text-[13px] font-bold transition active:scale-[0.96] ${
                amount === a && !showCustom
                  ? "bg-[#10367D] text-white"
                  : "bg-[#EBEBEB] text-[#2B2B2B]"
              }`}
            >
              {formatWon(a)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className="mt-2 text-[12px] font-medium text-[rgba(43,43,43,0.50)] underline underline-offset-2"
        >
          직접 입력
        </button>
        {showCustom && (
          <input
            type="number"
            min="100"
            step="100"
            value={amount}
            onChange={(e) => setAmount(Math.max(100, Number(e.target.value)))}
            className="mt-2 w-full rounded-[16px] border-2 border-[#10367D] bg-[#EBEBEB] px-4 py-3 text-[15px] font-bold text-[#2B2B2B] outline-none"
          />
        )}
      </div>

      <button
        type="submit"
        className="w-full h-12 rounded-[16px] bg-[#10367D] text-[15px] font-700 text-white"
      >
        저축하기
      </button>
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

function ChildPlayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full rounded-[18px] bg-[#C66B3D] py-4 text-[15px] font-bold text-white transition hover:bg-[#A85930] active:scale-[0.98] disabled:opacity-60"
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
