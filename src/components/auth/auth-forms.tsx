"use client";

import { useActionState, useState } from "react";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  sendPhoneOtp,
  verifyPhoneOtp,
  type AuthFormState,
} from "@/actions/auth";

const initial: AuthFormState = { ok: false, message: "" };

/* ── 구글 로그인 ── */
export function GoogleSignInButton() {
  return (
    <form action={signInWithGoogle}>
      <button
        type="submit"
        className="flex h-13 w-full items-center justify-center gap-3 rounded-full border-2 border-[var(--color-border)] bg-white text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <GoogleIcon />
        구글로 계속하기
      </button>
    </form>
  );
}

/* ── 전화번호 OTP ── */
export function PhoneOtpForm() {
  const [sendState, sendAction, sendPending] = useActionState(sendPhoneOtp, initial);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyPhoneOtp, initial);

  const phone = sendState.ok ? sendState.message : "";

  if (!sendState.ok) {
    return (
      <form action={sendAction} className="space-y-3">
        <input
          className={fieldClass}
          name="phone"
          type="tel"
          placeholder="010-1234-5678"
          inputMode="tel"
        />
        <button
          type="submit"
          disabled={sendPending}
          className={btnPrimary}
        >
          {sendPending ? "전송 중..." : "인증번호 받기"}
        </button>
        <StatusText state={sendState} />
      </form>
    );
  }

  return (
    <form action={verifyAction} className="space-y-3">
      <input type="hidden" name="phone" value={phone} />
      <p className="text-sm text-[var(--color-muted)]">
        {phone}로 인증번호를 전송했어요.
      </p>
      <input
        className={fieldClass}
        name="token"
        type="text"
        placeholder="인증번호 6자리"
        inputMode="numeric"
        maxLength={6}
        autoFocus
      />
      <button type="submit" disabled={verifyPending} className={btnPrimary}>
        {verifyPending ? "확인 중..." : "확인"}
      </button>
      <StatusText state={verifyState} />
    </form>
  );
}

/* ── 이메일 로그인 ── */
export function SignInForm() {
  const [state, action, pending] = useActionState(signInWithPassword, initial);
  return (
    <form action={action} className="space-y-3">
      <input className={fieldClass} name="email" type="email" placeholder="이메일" />
      <input className={fieldClass} name="password" type="password" placeholder="비밀번호" />
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "로그인 중..." : "로그인"}
      </button>
      <StatusText state={state} />
    </form>
  );
}

/* ── 이메일 가입 ── */
export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpWithPassword, initial);
  return (
    <form action={action} className="space-y-3">
      <input className={fieldClass} name="name" type="text" placeholder="이름" />
      <input className={fieldClass} name="email" type="email" placeholder="이메일" />
      <input className={fieldClass} name="password" type="password" placeholder="비밀번호" />
      <button type="submit" disabled={pending} className={btnOutline}>
        {pending ? "생성 중..." : "계정 만들기"}
      </button>
      <StatusText state={state} />
    </form>
  );
}

/* ── 탭 전체 컨테이너 ── */
export function AuthTabs() {
  const [tab, setTab] = useState<"social" | "phone" | "email">("social");

  return (
    <div className="space-y-5">
      {/* 탭 */}
      <div className="grid grid-cols-3 gap-1 rounded-full bg-[var(--color-card)] p-1">
        {(["social", "phone", "email"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full py-2 text-xs font-semibold transition ${
              tab === t
                ? "bg-white text-[var(--color-accent)] shadow-sm"
                : "text-[var(--color-muted)]"
            }`}
          >
            {t === "social" ? "소셜" : t === "phone" ? "전화번호" : "이메일"}
          </button>
        ))}
      </div>

      {tab === "social" && (
        <div className="space-y-3">
          <GoogleSignInButton />
          <p className="text-center text-xs text-[var(--color-soft)]">
            구글 계정으로 바로 시작하세요
          </p>
        </div>
      )}
      {tab === "phone" && <PhoneOtpForm />}
      {tab === "email" && (
        <div className="space-y-4">
          <SignInForm />
          <Divider label="처음이세요?" />
          <SignUpForm />
        </div>
      )}
    </div>
  );
}

/* ── 공통 컴포넌트 ── */
function StatusText({ state }: { state: AuthFormState }) {
  if (!state.message || state.ok) return null;
  return <p className="text-sm font-medium text-rose-600">{state.message}</p>;
}

function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--color-border)]" />
      <span className="text-xs text-[var(--color-soft)]">{label}</span>
      <div className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const fieldClass =
  "h-13 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-soft)] focus:border-[var(--color-accent)] focus:outline-none transition";

const btnPrimary =
  "flex h-13 w-full items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50";

const btnOutline =
  "flex h-13 w-full items-center justify-center rounded-full border-2 border-[var(--color-accent)] text-sm font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-card)] disabled:opacity-50";
