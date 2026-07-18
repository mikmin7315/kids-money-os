import { CheckCircle2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthTabs } from "@/components/auth/auth-forms";
import { getAuthContext } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ accountDeleted?: string; authError?: string }>;
}) {
  const params = await searchParams;
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

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
          <p className="mb-2 text-xs font-bold tracking-[0.11em] text-[var(--monari-primary)]">어린이 금융교육 앱</p>
          <h1 className="text-[29px] font-extrabold leading-[1.28] tracking-[-0.025em] text-[var(--monari-ink)]">
            약속을 지키면<br />이자가 올라가요. 🎯
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--monari-ink-soft)]">
            용돈에 이자를 붙여주고, 좋은 습관엔 보상을 — 아이가 스스로 돈을 관리하는 법을 배워요.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2">
          <TrustPoint text="부모 승인 기반" />
          <TrustPoint text="안전한 아이 모드" />
        </div>

        <AuthTabs />

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

        <p className="flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-[var(--monari-ink-muted)]">
          <LockKeyhole size={13} aria-hidden="true" />
          로그인 정보는 인증 서비스를 통해 관리됩니다.
        </p>
        <nav aria-label="정책 및 고객지원" className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[var(--monari-ink-muted)]">
          <Link href="/legal/privacy">개인정보 처리 안내</Link>
          <Link href="/legal/terms">이용약관</Link>
          <Link href="/support">고객지원</Link>
          <Link href="/account-deletion">계정 삭제 안내</Link>
        </nav>
      </div>
    </main>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--monari-line)] bg-[var(--monari-surface)] px-3 py-3 text-xs font-bold text-[var(--monari-ink)]">
      <CheckCircle2 size={16} className="shrink-0 text-[var(--monari-done)]" aria-hidden="true" />
      {text}
    </div>
  );
}
