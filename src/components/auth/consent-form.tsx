"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  acceptParentConsentAction,
  type ConsentFormState,
} from "@/lib/supabase/actions/consent";

const initialState: ConsentFormState = { ok: false, message: "" };

export function ConsentForm() {
  const [state, action, pending] = useActionState(acceptParentConsentAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <ConsentCheck name="termsAccepted">
        <Link href="/legal/terms" target="_blank" className="font-bold text-[var(--monari-hero)] underline underline-offset-2">이용약관</Link>에 동의합니다.
      </ConsentCheck>
      <ConsentCheck name="privacyAccepted">
        <Link href="/legal/privacy" target="_blank" className="font-bold text-[var(--monari-hero)] underline underline-offset-2">개인정보 처리 안내</Link>를 확인하고 동의합니다.
      </ConsentCheck>
      <ConsentCheck name="childDataAccepted">
        아이 정보를 등록·관리할 권한이 있는 보호자이며, 금융교육 활동 정보 처리에 동의합니다.
      </ConsentCheck>

      <button type="submit" disabled={pending} className="monari-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
        <CheckCircle2 size={17} aria-hidden="true" />
        {pending ? "동의 저장 중..." : "동의하고 Monari 시작하기"}
      </button>

      {state.message && (
        <p role="alert" aria-live="assertive" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">
          {state.message}
        </p>
      )}
    </form>
  );
}

function ConsentCheck({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] p-4">
      <input name={name} type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--monari-hero)]" />
      <span className="text-sm leading-6 text-[var(--monari-ink-soft)]">{children}</span>
    </label>
  );
}
