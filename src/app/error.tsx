"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="monari-auth-shell">
      <section className="monari-card w-full p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <AlertTriangle size={23} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-black text-[var(--monari-ink)]">금융 데이터를 불러오지 못했습니다</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--monari-ink-soft)]">
          실제 데이터 대신 임시 값을 보여드리지 않습니다. 연결 상태를 확인한 뒤 다시 시도해주세요.
        </p>
        <div className="mt-5 space-y-2">
          <button type="button" onClick={reset} className="monari-btn-primary w-full gap-2">
            <RefreshCw size={17} aria-hidden="true" />
            다시 시도
          </button>
          <Link href="/support" className="monari-btn-ghost w-full">고객지원 안내</Link>
        </div>
      </section>
    </main>
  );
}
