"use client";

import { useState } from "react";
import { PhoneOtpForm, SignInForm, SignUpForm } from "./auth-forms";

type Tab = "email" | "phone";

export function LoginTabs({ next = "" }: { next?: string }) {
  const [tab, setTab] = useState<Tab>("email");
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <section className="rounded-[22px] border border-[var(--monari-line)] bg-[var(--monari-surface)] p-5 shadow-[var(--monari-shadow-card)]" aria-label="이메일/휴대폰 로그인">
      {/* 탭 */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--monari-surface-soft)] p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "email"}
          onClick={() => { setTab("email"); setShowSignUp(false); }}
          className={`min-h-10 rounded-xl px-2 text-xs font-bold transition ${
            tab === "email" ? "bg-[var(--monari-surface)] text-[var(--monari-hero)] shadow-sm" : "text-[var(--monari-ink-soft)]"
          }`}
        >
          이메일
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "phone"}
          onClick={() => { setTab("phone"); setShowSignUp(false); }}
          className={`min-h-10 rounded-xl px-2 text-xs font-bold transition ${
            tab === "phone" ? "bg-[var(--monari-surface)] text-[var(--monari-hero)] shadow-sm" : "text-[var(--monari-ink-soft)]"
          }`}
        >
          휴대폰
        </button>
      </div>

      {tab === "email" && !showSignUp && (
        <div className="space-y-4">
          <SignInForm next={next} />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--monari-line)]" />
            <span className="text-[11px] font-semibold text-[var(--monari-ink-muted)]">처음이라면</span>
            <div className="h-px flex-1 bg-[var(--monari-line)]" />
          </div>
          <button
            type="button"
            onClick={() => setShowSignUp(true)}
            className="monari-btn-ghost w-full text-sm"
          >
            무료로 계정 만들기
          </button>
        </div>
      )}

      {tab === "email" && showSignUp && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowSignUp(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--monari-primary)]"
          >
            ← 로그인으로 돌아가기
          </button>
          <SignUpForm />
        </div>
      )}

      {tab === "phone" && <PhoneOtpForm next={next} />}
    </section>
  );
}
