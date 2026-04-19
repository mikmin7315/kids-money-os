"use client";

import { useActionState } from "react";
import {
  createBehaviorRuleForm,
  createChildForm,
  setChildPinForm,
  upsertInterestPolicyForm,
  createAllowanceRuleForm,
  upsertBorrowConditionsForm,
  type ManagementFormState,
} from "@/actions/management";
import { ChildProfile } from "@/lib/types";
import { PinInput } from "@/components/ui/pin-input";

const initialState: ManagementFormState = { ok: false, message: "" };

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

// ────────────────────────────────────────────────────────────
// Child
// ────────────────────────────────────────────────────────────

export function ChildCreateForm() {
  const [state, action, pending] = useActionState(createChildForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-base font-bold text-[var(--color-text)]">새 아이 추가</p>
      <Field label="이름">
        <input className={fieldClass} name="name" type="text" placeholder="예: 김서희" />
      </Field>
      <Field label="별명 (아이에게 보이는 이름)">
        <input className={fieldClass} name="nickname" type="text" placeholder="예: 시에나" />
      </Field>
      <Field label="태어난 연도">
        <input className={fieldClass} name="birthYear" type="number" placeholder="예: 2019" defaultValue="2019" />
      </Field>
      <SubmitButton pending={pending} label="아이 추가하기" />
      <FormMessage state={state} />
    </form>
  );
}

export function ChildPinForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState(setChildPinForm, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="childId" value={childId} />
      <p className="text-xs font-semibold text-[var(--color-muted)]">아이 전용 PIN</p>
      <PinInput name="pin" />
      <p className="text-center text-xs text-[var(--color-muted)]">
        아이가 통장 화면에 들어올 때 입력하는 비밀번호예요.
      </p>
      <SubmitButton pending={pending} label="PIN 저장" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Behavior rule
// ────────────────────────────────────────────────────────────

export function BehaviorRuleCreateForm() {
  const [state, action, pending] = useActionState(createBehaviorRuleForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-base font-bold text-[var(--color-text)]">새 약속 만들기</p>
      <Field label="약속 이름">
        <input className={fieldClass} name="title" type="text" placeholder="예: 스스로 이 닦기" />
      </Field>
      <Field label="왜 중요한 약속인가요?">
        <textarea className={`${fieldClass} min-h-[72px] resize-none`} name="description" placeholder="아이가 이 약속의 의미를 이해할 수 있도록 설명해주세요." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="보상 금액 (원)">
          <input className={fieldClass} name="rewardAmount" type="number" min="0" defaultValue="500" />
        </Field>
        <Field label="이자율 변화 (%)">
          <input className={fieldClass} name="interestDelta" type="number" step="0.1" defaultValue="0.5" />
        </Field>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        <input name="requiresParentApproval" type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" />
        <span className="text-sm text-[var(--color-text)]">완료 전에 부모가 확인해야 해요</span>
      </label>
      <SubmitButton pending={pending} label="약속 저장" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Interest policy
// ────────────────────────────────────────────────────────────

export function InterestPolicyForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(upsertInterestPolicyForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-base font-bold text-[var(--color-text)]">이자 설정</p>
      <Field label="아이 선택">
        <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="기본 이자율">
          <div className="relative">
            <input className={fieldClass} name="baseInterestRate" type="number" step="0.1" min="0" max="100" defaultValue="3" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">%</span>
          </div>
        </Field>
        <Field label="최소">
          <div className="relative">
            <input className={fieldClass} name="minInterestRate" type="number" step="0.1" min="0" max="100" defaultValue="1" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">%</span>
          </div>
        </Field>
        <Field label="최대">
          <div className="relative">
            <input className={fieldClass} name="maxInterestRate" type="number" step="0.1" min="0" max="100" defaultValue="10" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">%</span>
          </div>
        </Field>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        약속을 잘 지키면 이자율이 오르고, 못 지키면 내려가요. 기본값에서 시작해서 최소·최대 사이에서 변동됩니다.
      </p>
      <Field label="이자 정산 주기">
        <select name="settlementCycle" className={fieldClass} defaultValue="monthly">
          <option value="monthly">매달</option>
          <option value="weekly">매주</option>
        </select>
      </Field>
      <SubmitButton pending={pending} label="이자 설정 저장" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Allowance rule
// ────────────────────────────────────────────────────────────

export function AllowanceRuleForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(createAllowanceRuleForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-base font-bold text-[var(--color-text)]">용돈 규칙 추가</p>
      <Field label="아이 선택">
        <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </Field>
      <Field label="용돈 이름">
        <input className={fieldClass} name="title" type="text" placeholder="예: 주간 용돈" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="금액 (원)">
          <input className={fieldClass} name="amount" type="number" min="1" defaultValue="5000" />
        </Field>
        <Field label="지급 방식">
          <select name="type" className={fieldClass} defaultValue="weekly">
            <option value="weekly">매주</option>
            <option value="monthly">매달</option>
            <option value="manual">직접 지급</option>
          </select>
        </Field>
      </div>
      <Field label="지급 요일 (매주인 경우)">
        <select name="weekday" className={fieldClass} defaultValue="6">
          {WEEKDAYS.map((day, i) => (
            <option key={i} value={i}>{day}</option>
          ))}
        </select>
      </Field>
      <Field label="매달 지급일 (매달인 경우)">
        <select name="dayOfMonth" className={fieldClass} defaultValue="1">
          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}일</option>
          ))}
        </select>
      </Field>
      <SubmitButton pending={pending} label="용돈 규칙 저장" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Borrow conditions
// ────────────────────────────────────────────────────────────

export function BorrowConditionsForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(upsertBorrowConditionsForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-base font-bold text-[var(--color-text)]">미리쓰기 한도</p>
      <Field label="아이 선택">
        <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </Field>
      <Field label="최대 미리쓰기 금액 (원)">
        <input className={fieldClass} name="maxAmount" type="number" min="0" defaultValue="20000" />
      </Field>
      <Field
        label="이 금액까지는 자동으로 허락해줄게요 (원)"
        hint="0원이면 금액에 상관없이 항상 부모가 확인해요."
      >
        <input className={fieldClass} name="autoApproveBlow" type="number" min="0" defaultValue="0" />
      </Field>
      <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        <input name="requiresPurpose" type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" defaultChecked />
        <span className="text-sm text-[var(--color-text)]">아이가 사용 목적을 적어야 해요</span>
      </label>
      <SubmitButton pending={pending} label="저장" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Shared primitives
// ────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-soft)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-soft)]">{hint}</p>}
    </div>
  );
}

function SubmitButton({ pending, label, className }: { pending: boolean; label: string; className?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-4 py-3 text-sm font-bold text-[var(--color-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50 ${className ?? ""}`}
    >
      {pending ? "저장 중..." : label}
    </button>
  );
}

function FormMessage({ state }: { state: ManagementFormState }) {
  if (!state.message) return null;
  return (
    <p className={`rounded-xl px-3 py-2 text-sm font-medium ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {state.message}
    </p>
  );
}

const fieldClass =
  "w-full rounded-[20px] border border-[var(--color-border)] bg-white/85 px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)]";

const formClass =
  "space-y-4 rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(249,243,234,0.95))] p-5 shadow-[var(--shadow-soft)]";
