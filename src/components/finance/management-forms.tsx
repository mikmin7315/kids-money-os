"use client";

import { useActionState, useState } from "react";
import {
  createBehaviorRuleForm,
  createChildForm,
  setChildPinForm,
  upsertInterestPolicyForm,
  createAllowanceRuleForm,
  upsertBorrowConditionsForm,
  type ManagementFormState,
} from "@/actions/management";
import { PinInput } from "@/components/ui/pin-input";
import { MoneyInput } from "@/components/ui/money-input";
import { ChildProfile } from "@/lib/types";

const initialState: ManagementFormState = { ok: false, message: "" };
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export function ChildCreateForm() {
  const [state, action, pending] = useActionState(createChildForm, initialState);
  return (
    <form action={action} className={formClass}>
      <FormIntro title="아이 프로필 등록" description="아이에게 보여줄 이름과 기본 정보를 입력해주세요." />
      <Field label="이름" hint="부모님 화면에서 구분할 이름이에요.">
        <input className={fieldClass} name="name" type="text" placeholder="예: 김모나" autoComplete="off" required />
      </Field>
      <Field label="아이에게 보여줄 별명">
        <input className={fieldClass} name="nickname" type="text" placeholder="예: 모나" autoComplete="off" />
      </Field>
      <Field label="출생 연도">
        <input className={fieldClass} name="birthYear" type="number" min="2000" max={new Date().getFullYear()} placeholder="예: 2019" defaultValue="2019" required />
      </Field>
      <SubmitButton pending={pending} label="아이 프로필 등록하기" />
      <FormMessage state={state} />
    </form>
  );
}

export function ChildPinForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState(setChildPinForm, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="childId" value={childId} />
      <div>
        <p className="text-sm font-extrabold text-[var(--monari-ink)]">아이 모드 PIN</p>
        <p className="mt-1 text-xs leading-5 text-[var(--monari-ink-muted)]">아이가 자신의 통장에 들어갈 때 사용할 4자리 숫자예요.</p>
      </div>
      <PinInput name="pin" />
      <SubmitButton pending={pending} label="PIN 저장하기" />
      <FormMessage state={state} />
    </form>
  );
}

export function BehaviorRuleCreateForm() {
  const [state, action, pending] = useActionState(createBehaviorRuleForm, initialState);

  return (
    <form action={action} className={formClass}>
      <input type="hidden" name="ruleCategory" value="recurring" />
      <input type="hidden" name="monthlyTargetRate" value="80" />
      <Field label="약속 이름">
        <input className={fieldClass} name="title" type="text" placeholder="예: 스스로 책상 정리하기" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="보상 금액 (원)">
          <MoneyInput className={fieldClass} name="rewardAmount" min={0} value="500" required />
        </Field>
        <Field label="이자율 변화 (%p)">
          <input className={fieldClass} name="interestDelta" type="number" step="0.1" min="0" defaultValue="0.5" required />
        </Field>
      </div>
      <CheckField name="requiresParentApproval" label="완료 후 부모 확인을 받아요" />
      <SubmitButton pending={pending} label="약속 저장하기" />
      <FormMessage state={state} />
    </form>
  );
}

export function InterestPolicyForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(upsertInterestPolicyForm, initialState);
  return (
    <form action={action} className={formClass}>
      <FormIntro title="이자 정책 설정" description="약속 실천에 따라 움직일 이자율 범위를 정해주세요." />
      <ChildSelect childOptions={childOptions} />
      <Field label="기본 이자율 (%)" hint="처음 시작할 때 적용되는 이자율이에요.">
        <input className={fieldClass} name="baseInterestRate" type="number" step="0.1" min="0" max="100" defaultValue="3" required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="최소 이자율 (%)">
          <input className={fieldClass} name="minInterestRate" type="number" step="0.1" min="0" max="100" defaultValue="1" required />
        </Field>
        <Field label="최대 이자율 (%)">
          <input className={fieldClass} name="maxInterestRate" type="number" step="0.1" min="0" max="100" defaultValue="10" required />
        </Field>
      </div>
      <Field label="이자 정산 주기">
        <select name="settlementCycle" className={fieldClass} defaultValue="monthly">
          <option value="monthly">매월 정산</option>
          <option value="weekly">매주 정산</option>
        </select>
      </Field>
      <SubmitButton pending={pending} label="이자 정책 저장하기" />
      <FormMessage state={state} />
    </form>
  );
}

export function AllowanceRuleForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(createAllowanceRuleForm, initialState);
  return (
    <form action={action} className={formClass}>
      <FormIntro title="용돈 규칙 추가" description="지급 금액과 주기를 정해 일관된 용돈 습관을 만들어요." />
      <ChildSelect childOptions={childOptions} />
      <Field label="규칙 이름">
        <input className={fieldClass} name="title" type="text" placeholder="예: 주간 기본 용돈" required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="지급 금액 (원)">
          <MoneyInput className={fieldClass} name="amount" min={1} value="5000" required />
        </Field>
        <Field label="지급 방식">
          <select name="type" className={fieldClass} defaultValue="weekly">
            <option value="weekly">매주</option>
            <option value="monthly">매월</option>
            <option value="manual">직접 지급</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="매주 지급 요일" hint="지급 방식이 매주일 때 적용돼요.">
          <select name="weekday" className={fieldClass} defaultValue="6">
            {WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
          </select>
        </Field>
        <Field label="매월 지급일" hint="지급 방식이 매월일 때 적용돼요.">
          <select name="dayOfMonth" className={fieldClass} defaultValue="1">
            {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}일</option>)}
          </select>
        </Field>
      </div>
      <SubmitButton pending={pending} label="용돈 규칙 저장하기" />
      <FormMessage state={state} />
    </form>
  );
}

export function BorrowConditionsForm({ childOptions }: { childOptions: ChildProfile[] }) {
  const [state, action, pending] = useActionState(upsertBorrowConditionsForm, initialState);
  return (
    <form action={action} className={formClass}>
      <FormIntro title="미리쓰기 한도 설정" description="아이가 잔액보다 먼저 쓸 수 있는 범위와 승인 기준을 정해주세요." />
      <ChildSelect childOptions={childOptions} />
      <Field label="최대 미리쓰기 금액 (원)" hint="아이가 요청할 수 있는 최대 금액이에요.">
        <MoneyInput className={fieldClass} name="maxAmount" min={1} value="20000" required />
      </Field>
      <Field label="자동 승인 기준 금액 (원)" hint="0원이면 모든 미리쓰기 요청을 부모님이 확인해요.">
        <MoneyInput className={fieldClass} name="autoApproveBlow" min={0} value="0" />
      </Field>
      <CheckField name="requiresPurpose" label="아이가 사용 목적을 반드시 적어요" defaultChecked />
      <SubmitButton pending={pending} label="미리쓰기 조건 저장하기" />
      <FormMessage state={state} />
    </form>
  );
}

function ChildSelect({ childOptions }: { childOptions: ChildProfile[] }) {
  return (
    <Field label="적용할 아이">
      <select name="childId" className={fieldClass} defaultValue={childOptions[0]?.id}>
        {childOptions.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
      </select>
    </Field>
  );
}

function FormIntro({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-base font-extrabold text-[var(--monari-ink)]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--monari-ink-muted)]">{description}</p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-bold text-[var(--monari-ink)]">{label}</span>
      {children}
      {hint && <span className="block text-xs leading-5 text-[var(--monari-ink-muted)]">{hint}</span>}
    </label>
  );
}

function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-[var(--monari-line-strong)] bg-[var(--monari-plus-bg)] px-4 py-3">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-5 w-5 shrink-0 accent-[var(--monari-hero)]" />
      <span className="text-sm font-semibold leading-5 text-[var(--monari-ink)]">{label}</span>
    </label>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending} className="monari-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "저장하는 중..." : label}
    </button>
  );
}

function FormMessage({ state }: { state: ManagementFormState }) {
  if (!state.message) return null;
  return (
    <p role="status" aria-live="polite" className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {state.message}
    </p>
  );
}

const fieldClass = "monari-input";
const textareaClass = "monari-textarea";
const formClass = "space-y-5";
