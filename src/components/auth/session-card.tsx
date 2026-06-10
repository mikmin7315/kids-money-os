"use client";

import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { signOut } from "@/actions/auth";

export function SessionCard({ email, name, role }: { email?: string | null; name?: string | null; role?: string | null }) {
  return (
    <div className="monari-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--monari-line)] p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--monari-plus-bg)] text-[var(--monari-hero)]">
          <UserRound size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-[var(--monari-ink)]">{name || "부모님"}</p>
          <p className="truncate text-sm text-[var(--monari-ink-muted)]">{email || "이메일 정보 없음"}</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 bg-[var(--monari-plus-bg)] px-5 py-3">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[var(--monari-hero)]" aria-hidden="true" />
        <p className="text-xs leading-5 text-[var(--monari-ink-soft)]">
          {role === "admin" ? "관리자 권한으로 로그인되어 있습니다." : "부모 계정으로 안전하게 로그인되어 있습니다."}
        </p>
      </div>
      <form action={signOut} className="p-4">
        <button type="submit" className="monari-btn-ghost w-full gap-2 text-[var(--monari-ink-soft)]">
          <LogOut size={17} aria-hidden="true" />
          로그아웃
        </button>
      </form>
    </div>
  );
}
