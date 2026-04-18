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

const initialState: ManagementFormState = { ok: false, message: "" };

// ────────────────────────────────────────────────────────────
// Child
// ────────────────────────────────────────────────────────────

export function ChildCreateForm() {
  const [state, action, pending] = useActionState(createChildForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-lg font-semibold">아이 프로필 생성</p>
      <input className={fieldClass} name="name" type="text" placeholder="아이 이름" />
      <input className={fieldClass} name="nickname" type="text" placeholder="별명" />
      <input className={fieldClass} name="birthYear" type="number" placeholder="출생연도" defaultValue="2017" />
      <PrimaryButton pending={pending} label="아이 생성" />
      <FormMessage state={state} />
    </form>
  );
}

export function ChildPinForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState(setChildPinForm, initialState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="childId" value={childId} />
      <div className="flex gap-2">
        <input
          className={`${fieldClass} flex-1`}
          name="pin"
          type="password"
          maxLength={4}
          pattern="[0-9]*"
          inputMode="numeric"
          placeholder="4자리 PIN 설정"
        />
        <PrimaryButton pending={pending} label="저장" className="w-auto px-5" />
      </div>
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
      <p className="text-lg font-semibold">약속 규칙 만들기</p>
      <input className={fieldClass} name="title" type="text" placeholder="규칙 이름" />
      <textarea className={`${fieldClass} min-h-20`} name="description" placeholder="이 행동이 왜 중요한지 설명해주세요." />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">보상 (원)</label>
          <input className={fieldClass} name="rewardAmount" type="number" defaultValue="500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">이자율 변화 (%)</label>
          <input className={fieldClass} name="interestDelta" type="number" step="0.1" defaultValue="0.5" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <input name="requiresParentApproval" type="checkbox" className="h-4 w-4" />
        부모 확인 필요
      </label>
      <PrimaryButton pending={pending} label="규칙 생성" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Interest policy (P-I-01)
// ────────────────────────────────────────────────────────────

export function InterestPolicyForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(upsertInterestPolicyForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-lg font-semibold">이자 정책 설정</p>
      <div>
        <label className="mb-1 block text-xs text-[var(--color-muted)]">아이 선택</label>
        <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">기본 이자율 (%)</label>
          <input className={fieldClass} name="baseInterestRate" type="number" step="0.1" defaultValue="3" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">최소 (%)</label>
          <input className={fieldClass} name="minInterestRate" type="number" step="0.1" defaultValue="1" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">최대 (%)</label>
          <input className={fieldClass} name="maxInterestRate" type="number" step="0.1" defaultValue="10" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--color-muted)]">정산 주기</label>
        <select name="settlementCycle" className={fieldClass} defaultValue="monthly">
          <option value="monthly">월별</option>
          <option value="weekly">주별</option>
        </select>
      </div>
      <PrimaryButton pending={pending} label="이자 정책 저장" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Allowance rule (P-13)
// ────────────────────────────────────────────────────────────

export function AllowanceRuleForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(createAllowanceRuleForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-lg font-semibold">정기 용돈 설정</p>
      <div>
        <label className="mb-1 block text-xs text-[var(--color-muted)]">아이 선택</label>
        <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </div>
      <input className={fieldClass} name="title" type="text" placeholder="용돈 이름 (예: 주간 용돈)" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">금액 (원)</label>
          <input className={fieldClass} name="amount" type="number" defaultValue="5000" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">유형</label>
          <select name="type" className={fieldClass} defaultValue="weekly">
            <option value="weekly">주간</option>
            <option value="monthly">월간</option>
            <option value="manual">수동</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">요일 (0=일, 6=토)</label>
          <input className={fieldClass} name="weekday" type="number" min="0" max="6" defaultValue="6" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">월간 지급일</label>
          <input className={fieldClass} name="dayOfMonth" type="number" min="1" max="28" defaultValue="1" />
        </div>
      </div>
      <PrimaryButton pending={pending} label="용돈 규칙 저장" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Borrow conditions (P-L-01)
// ────────────────────────────────────────────────────────────

export function BorrowConditionsForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(upsertBorrowConditionsForm, initialState);

  return (
    <form action={action} className={formClass}>
      <p className="text-lg font-semibold">미리쓰기 조건 설정</p>
      <div>
        <label className="mb-1 block text-xs text-[var(--color-muted)]">아이 선택</label>
        <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--color-muted)]">최대 한도 (원)</label>
        <input className={fieldClass} name="maxAmount" type="number" defaultValue="20000" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--color-muted)]">자동 승인 한도 이하 금액 (원, 0=자동 승인 없음)</label>
        <input className={fieldClass} name="autoApproveBlow" type="number" defaultValue="0" />
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <input name="requiresPurpose" type="checkbox" className="h-4 w-4" defaultChecked />
        사용 목적 필수 입력
      </label>
      <PrimaryButton pending={pending} label="조건 저장" />
      <FormMessage state={state} />
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Shared primitives
// ────────────────────────────────────────────────────────────

function PrimaryButton({ pending, label, className }: { pending: boolean; label: string; className?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-60 ${className ?? ""}`}
    >
      {pending ? "저장 중..." : label}
    </button>
  );
}

function FormMessage({ state }: { state: ManagementFormState }) {
  if (!state.message) return null;

  return (
    <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
      {state.message}
    </p>
  );
}

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)]";

const formClass =
  "space-y-3 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5";
