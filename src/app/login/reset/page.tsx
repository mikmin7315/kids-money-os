"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/reset/confirm`,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes("60 seconds") || msg.includes("rate limit")) {
        setErrorMsg("1분에 한 번만 요청할 수 있어요. 잠시 후 다시 시도해 주세요.");
      } else if (msg.includes("User not found")) {
        setErrorMsg("등록되지 않은 이메일이에요.");
      } else {
        setErrorMsg("재설정 이메일 전송에 실패했어요. 다시 시도해 주세요.");
      }
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="monari-auth-shell">
      <div className="w-full space-y-5">
        <header className="px-1">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--monari-hero)] text-lg font-extrabold text-white shadow-[var(--monari-shadow-soft)]">M</div>
            <div>
              <p className="text-base font-bold tracking-[-0.01em] text-[var(--monari-ink)]">Monari</p>
              <p className="text-xs font-semibold text-[var(--monari-ink-muted)]">우리 가족 금융 습관</p>
            </div>
          </div>
          <h1 className="text-[26px] font-extrabold leading-[1.28] tracking-[-0.025em] text-[var(--monari-ink)]">
            비밀번호 재설정
          </h1>
          <p className="mt-2 text-[14px] text-[var(--monari-ink-muted)]">
            가입한 이메일 주소를 입력하면 재설정 링크를 보내드려요.
          </p>
        </header>

        {status === "sent" ? (
          <div className="monari-card px-5 py-8 text-center space-y-3">
            <div className="text-4xl">📬</div>
            <p className="text-[17px] font-extrabold text-[var(--monari-ink)]">이메일을 확인해주세요</p>
            <p className="text-[14px] text-[var(--monari-ink-muted)]">
              <span className="font-bold text-[var(--monari-primary)]">{email}</span>으로<br />
              재설정 링크를 보냈어요.
            </p>
            <p className="text-[12px] text-[var(--monari-ink-muted)]">
              스팸함도 확인해보세요. 링크는 1시간 후 만료돼요.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-[13px] font-bold text-[var(--monari-ink)]">이메일</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="가입한 이메일 주소"
                required
                className="monari-input w-full"
                autoComplete="email"
              />
            </div>

            {status === "error" && (
              <p className="rounded-[12px] bg-[var(--status-danger-solid)] px-4 py-3 text-[13px] font-semibold text-[var(--status-rose-solid-text)]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="monari-btn-primary w-full h-[52px] text-[16px]"
            >
              {status === "loading" ? "전송 중…" : "재설정 링크 보내기"}
            </button>
          </form>
        )}

        <p className="text-center text-[13px] text-[var(--monari-ink-muted)]">
          <Link href="/login" className="font-bold text-[var(--monari-primary)]">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}
