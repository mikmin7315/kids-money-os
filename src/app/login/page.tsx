import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton, SignInForm, SignUpForm, PhoneOtpForm } from "@/components/auth/auth-forms";
import { getAuthContext } from "@/lib/auth";
import { LoginTabs } from "@/components/auth/login-tabs";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ accountDeleted?: string; authError?: string }>;
}) {
  const params = await searchParams;
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--monari-bg)]">
      {/* 블루 그라디언트 히어로 */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#003d80] via-[#0055B3] to-[#1a75d4] px-6 pb-10 pt-14">
        {/* 배경 글로우 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/8 blur-2xl" />
        </div>

        <div className="relative">
          {/* 로고 */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/20 text-lg font-extrabold text-white shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-sm">
              🪙
            </div>
            <div>
              <p className="text-base font-extrabold tracking-[-0.01em] text-white">Monari</p>
              <p className="text-xs font-semibold text-white/70">우리 가족 금융 습관</p>
            </div>
          </div>

          <h1 className="text-[28px] font-extrabold leading-[1.25] tracking-[-0.025em] text-white">
            약속을 지키면<br />이자가 올라가요 🎯
          </h1>
          <p className="mt-2.5 text-sm leading-6 text-white/75">
            용돈에 이자를 붙여주고, 좋은 습관엔 보상을 —<br />아이가 스스로 돈을 관리하는 법을 배워요.
          </p>
        </div>
      </div>

      {/* 컨텐츠 카드 — 히어로와 살짝 겹치게 */}
      <div className="relative -mt-5 flex-1 rounded-t-[28px] bg-[var(--monari-bg)] px-5 pt-6 pb-8">
        <div className="mx-auto w-full max-w-sm space-y-4">

          {/* Google 로그인 — 최우선 노출 */}
          <div className="rounded-[22px] border border-[var(--monari-line)] bg-[var(--monari-surface)] p-5 shadow-[var(--monari-shadow-card)]">
            <p className="mb-3 text-[13px] font-bold text-[var(--monari-ink-muted)]">빠른 시작</p>
            <GoogleSignInButton />
            <p className="mt-2.5 text-center text-[11px] leading-5 text-[var(--monari-ink-muted)]">
              별도 비밀번호 없이 Google 계정으로 바로 시작해요
            </p>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--monari-line)]" />
            <span className="text-[11px] font-semibold text-[var(--monari-ink-muted)]">또는</span>
            <div className="h-px flex-1 bg-[var(--monari-line)]" />
          </div>

          {/* 이메일 / 휴대폰 탭 */}
          <LoginTabs />

          {/* 알림 배너 */}
          {params.accountDeleted === "1" && (
            <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
              계정과 가족 금융 데이터가 삭제되었습니다.
            </p>
          )}
          {params.authError && (
            <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700">
              Google 로그인을 완료하지 못했습니다. 다시 시도하거나 이메일 로그인을 이용해주세요.
            </p>
          )}

          {/* 하단 법적 정보 */}
          <div className="space-y-2 pt-2">
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-[var(--monari-ink-muted)]">
              <LockKeyhole size={12} aria-hidden="true" />
              로그인 정보는 인증 서비스를 통해 관리됩니다.
            </p>
            <nav aria-label="정책 및 고객지원" className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[var(--monari-ink-muted)]">
              <Link href="/legal/privacy">개인정보 처리 안내</Link>
              <Link href="/legal/terms">이용약관</Link>
              <Link href="/inquiries">고객지원</Link>
              <Link href="/account-deletion">계정 삭제 안내</Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
