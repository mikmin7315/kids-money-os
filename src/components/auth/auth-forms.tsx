"use client";

import { useActionState } from "react";
import { signInWithPassword, signUpWithPassword, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = {
  ok: false,
  message: "",
};

export function SignInForm() {
  const [state, action, pending] = useActionState(signInWithPassword, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <p className="text-lg font-semibold">로그인</p>
      <input className={fieldClass} name="email" type="email" placeholder="이메일" />
      <input className={fieldClass} name="password" type="password" placeholder="비밀번호" />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-60"
      >
        {pending ? "로그인 중..." : "로그인"}
      </button>
      <StatusText state={state} />
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpWithPassword, initialState);

  return (
    <form action={action} className="space-y-3 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <p className="text-lg font-semibold">부모 계정 만들기</p>
      <input className={fieldClass} name="name" type="text" placeholder="이름" />
      <input className={fieldClass} name="email" type="email" placeholder="이메일" />
      <input className={fieldClass} name="password" type="password" placeholder="비밀번호" />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[var(--color-card)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] disabled:opacity-60"
      >
        {pending ? "계정 생성 중..." : "계정 만들기"}
      </button>
      <StatusText state={state} />
    </form>
  );
}

function StatusText({ state }: { state: AuthFormState }) {
  if (!state.message) return null;

  return (
    <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
      {state.message}
    </p>
  );
}

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)]";
