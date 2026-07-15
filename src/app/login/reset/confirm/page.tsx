"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg("비밀번호가 일치하지 않아요.");
      setStatus("error");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("비밀번호는 8자 이상이어야 해요.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("done");
      setTimeout(() => router.push("/"), 2000);
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
            </div>
          </div>
          <h1 className="text-[26px] font-extrabold leading-[1.28] tracking-[-0.025em] text-[var(--monari-ink)]">
            새 비밀번호 설정
          </h1>
        </header>

        {status === "done" ? (
          <div className="monari-card px-5 py-8 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-[17px] font-800 text-[var(--monari-ink)]">비밀번호가 변경됐어요</p>
            <p className="text-[14px] text-[var(--monari-ink-muted)]">잠시 후 홈으로 이동해요.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-700 text-[var(--monari-ink)]">새 비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상"
                required
                minLength={8}
                className="monari-input w-full"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-700 text-[var(--monari-ink)]">비밀번호 확인</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="한 번 더 입력해주세요"
                required
                className="monari-input w-full"
                autoComplete="new-password"
              />
            </div>

            {(status === "error") && (
              <p className="rounded-[12px] bg-[var(--status-danger-solid)] px-4 py-3 text-[13px] font-600 text-[var(--status-rose-solid-text)]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="monari-btn-primary w-full h-[52px] text-[16px]"
            >
              {status === "loading" ? "변경 중…" : "비밀번호 변경하기"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
