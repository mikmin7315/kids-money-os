"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import Link from "next/link";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  sendPhoneOtp,
  verifyPhoneOtp,
  type AuthFormState,
} from "@/actions/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const initial: AuthFormState = { ok: false, message: "" };
type AuthTab = "social" | "phone" | "email";

export function GoogleSignInButton() {
  const [isNative, setIsNative] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    if (!native) return;

    const listener = Browser.addListener("browserFinished", () => setPending(false));
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  async function startNativeGoogleSignIn() {
    setPending(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = process.env.NEXT_PUBLIC_NATIVE_AUTH_REDIRECT_URL ?? "com.monari.family://auth/callback";
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data.url) throw oauthError ?? new Error("OAuth URL을 만들 수 없습니다.");
      await Browser.open({ url: data.url });
    } catch {
      setError("Google 로그인을 시작하지 못했습니다. 이메일 로그인을 이용해주세요.");
      setPending(false);
    }
  }

  if (isNative) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={startNativeGoogleSignIn} disabled={pending} className={secondaryButtonClass}>
          <GoogleIcon />
          {pending ? "Google 로그인 여는 중..." : "Google로 계속하기"}
        </button>
        {error && <p role="alert" className="text-center text-xs font-semibold text-rose-700">{error}</p>}
      </div>
    );
  }

  return (
    <form action={signInWithGoogle}>
      <button type="submit" className={secondaryButtonClass}>
        <GoogleIcon />
        Google로 계속하기
      </button>
    </form>
  );
}

export function PhoneOtpForm() {
  const [sendState, sendAction, sendPending] = useActionState(sendPhoneOtp, initial);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyPhoneOtp, initial);
  const phoneId = useId();
  const tokenId = useId();
  const phone = sendState.ok ? sendState.message : "";

  if (!sendState.ok) {
    return (
      <form action={sendAction} className="space-y-4">
        <FormField id={phoneId} label="휴대폰 번호" hint="본인 확인을 위해 인증번호를 보내드려요.">
          <input
            id={phoneId}
            className={fieldClass}
            name="phone"
            type="tel"
            placeholder="010-1234-5678"
            inputMode="tel"
            autoComplete="tel"
            required
          />
        </FormField>
        <button type="submit" disabled={sendPending} className={primaryButtonClass}>
          {sendPending ? "인증번호 보내는 중..." : "인증번호 받기"}
        </button>
        <StatusText state={sendState} />
      </form>
    );
  }

  return (
    <form action={verifyAction} className="space-y-4">
      <input type="hidden" name="phone" value={phone} />
      <div className="rounded-2xl bg-[var(--monari-plus-bg)] px-4 py-3 text-sm leading-6 text-[var(--monari-ink-soft)]">
        <strong className="block text-[var(--monari-ink)]">{phone}</strong>
        문자로 받은 6자리 인증번호를 입력해주세요.
      </div>
      <FormField id={tokenId} label="인증번호">
        <input
          id={tokenId}
          className={fieldClass}
          name="token"
          type="text"
          placeholder="6자리 숫자"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          required
        />
      </FormField>
      <button type="submit" disabled={verifyPending} className={primaryButtonClass}>
        {verifyPending ? "확인하는 중..." : "인증하고 시작하기"}
      </button>
      <StatusText state={verifyState} />
    </form>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signInWithPassword, initial);
  const emailId = useId();
  const passwordId = useId();

  return (
    <form action={action} className="space-y-4">
      <FormField id={emailId} label="이메일">
        <input id={emailId} className={fieldClass} name="email" type="email" placeholder="parent@example.com" autoComplete="email" required />
      </FormField>
      <FormField id={passwordId} label="비밀번호">
        <input id={passwordId} className={fieldClass} name="password" type="password" placeholder="비밀번호 입력" autoComplete="current-password" required />
      </FormField>
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "로그인하는 중..." : "로그인"}
      </button>
      <StatusText state={state} />
      <p className="text-center text-[13px] text-[var(--monari-ink-muted)]">
        <Link href="/login/reset" className="font-bold text-[var(--monari-primary)]">
          비밀번호를 잊어버렸어요
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpWithPassword, initial);
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  return (
    <form action={action} className="space-y-4">
      <FormField id={nameId} label="부모님 이름">
        <input id={nameId} className={fieldClass} name="name" type="text" placeholder="이름 입력" autoComplete="name" required />
      </FormField>
      <FormField id={emailId} label="이메일">
        <input id={emailId} className={fieldClass} name="email" type="email" placeholder="parent@example.com" autoComplete="email" required />
      </FormField>
      <FormField id={passwordId} label="비밀번호" hint="안전한 비밀번호를 사용해주세요.">
        <input id={passwordId} className={fieldClass} name="password" type="password" placeholder="비밀번호 입력" autoComplete="new-password" required />
      </FormField>
      <ConsentCheck name="termsAccepted">
        <Link href="/legal/terms" target="_blank" className="font-bold text-[var(--monari-hero)] underline underline-offset-2">이용약관</Link>에 동의합니다.
      </ConsentCheck>
      <ConsentCheck name="privacyAccepted">
        <Link href="/legal/privacy" target="_blank" className="font-bold text-[var(--monari-hero)] underline underline-offset-2">개인정보 처리 안내</Link>를 확인하고 동의합니다.
      </ConsentCheck>
      <ConsentCheck name="childDataAccepted">
        아이 정보를 등록·관리할 권한이 있는 보호자이며, 금융교육 활동 정보 처리에 동의합니다.
      </ConsentCheck>
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "계정 만드는 중..." : "무료로 계정 만들기"}
      </button>
      <StatusText state={state} />
    </form>
  );
}

export function AuthTabs() {
  const [tab, setTab] = useState<AuthTab>("social");
  const tabs: { id: AuthTab; label: string }[] = [
    { id: "social", label: "간편 로그인" },
    { id: "phone", label: "휴대폰" },
    { id: "email", label: "이메일" },
  ];

  return (
    <section className="rounded-[24px] border border-[var(--monari-line)] bg-[var(--monari-surface)] p-4 shadow-[var(--monari-shadow-card)] sm:p-5" aria-label="로그인 방법">
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-[var(--monari-surface-soft)] p-1" role="tablist" aria-label="로그인 방법 선택">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`auth-panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`min-h-11 rounded-xl px-2 text-xs font-bold transition ${
              tab === item.id ? "bg-[var(--monari-surface)] text-[var(--monari-hero)] shadow-sm" : "text-[var(--monari-ink-soft)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div id={`auth-panel-${tab}`} role="tabpanel">
        {tab === "social" && (
          <div className="space-y-3">
            <GoogleSignInButton />
            <p className="text-center text-xs leading-5 text-[var(--monari-ink-muted)]">
              별도 비밀번호 없이 안전하게 시작할 수 있어요.
            </p>
          </div>
        )}
        {tab === "phone" && <PhoneOtpForm />}
        {tab === "email" && (
          <div className="space-y-6">
            <SignInForm />
            <Divider label="Monari가 처음이라면" />
            <SignUpForm />
          </div>
        )}
      </div>
    </section>
  );
}

function FormField({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-[var(--monari-ink)]">{label}</label>
      {children}
      {hint && <p className="text-xs leading-5 text-[var(--monari-ink-muted)]">{hint}</p>}
    </div>
  );
}

function ConsentCheck({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] p-3">
      <input name={name} type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--monari-hero)]" />
      <span className="text-xs leading-5 text-[var(--monari-ink-soft)]">{children}</span>
    </label>
  );
}

function StatusText({ state }: { state: AuthFormState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
    >
      {state.message}
    </p>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--monari-line)]" />
      <span className="text-xs font-semibold text-[var(--monari-ink-muted)]">{label}</span>
      <div className="h-px flex-1 bg-[var(--monari-line)]" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const fieldClass = "monari-input";
const primaryButtonClass = "monari-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = "monari-btn-ghost w-full gap-3 disabled:cursor-not-allowed disabled:opacity-50";
