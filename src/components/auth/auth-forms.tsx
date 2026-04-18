"use client";

import { useActionState } from "react";
import { signInWithPassword, signUpWithPassword, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = { ok: false, message: "" };

export function SignInForm() {
  const [state, action, pending] = useActionState(signInWithPassword, initialState);

  return (
    <form action={action} className="space-y-3">
      <p className="text-base font-bold text-[var(--color-text)]">로그인</p>
      <input className={fieldClass} name="email" type="email" placeholder="이메일" />
      <input className={fieldClass} name="password" type="password" placeholder="비밀번호" />
      <button
        type="submit"
        disabled={pending}
        className="flex h-13 w-full items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
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
    <form action={action} className="space-y-3">
      <p className="text-base font-bold text-[var(--color-text)]">계정 만들기</p>
      <input className={fieldClass} name="name" type="text" placeholder="이름" />
      <input className={fieldClass} name="email" type="email" placeholder="이메일" />
      <input className={fieldClass} name="password" type="password" placeholder="비밀번호" />
      <button
        type="submit"
        disabled={pending}
        className="flex h-13 w-full items-center justify-center rounded-full border-2 border-[var(--color-accent)] text-sm font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-card)] disabled:opacity-50"
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
    <p className={`text-sm font-medium ${state.ok ? "text-emerald-600" : "text-rose-600"}`}>
      {state.message}
    </p>
  );
}

const fieldClass =
  "h-13 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-soft)] focus:border-[var(--color-accent)] focus:outline-none transition";
