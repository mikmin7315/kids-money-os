import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { requireParentSession } from "@/lib/auth";
import { AppLockSettingsForm } from "./app-lock-form";

export const dynamic = "force-dynamic";

export default async function AppLockPage() {
  await requireParentSession();

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">보안</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">앱 잠금</h1>
        <p className="text-[13px] text-white/65">일정 시간 사용하지 않으면 자동으로 잠가요</p>
      </PageHero>

      <PageContent className="pt-5">
        <AppLockSettingsForm />

        <div className="monari-card p-4 mb-8">
          <p className="text-[13px] font-bold text-[var(--monari-ink)] mb-2">🔒 이런 경우에 잠겨요</p>
          <ul className="space-y-1.5">
            {[
              "설정한 시간 동안 앱을 사용하지 않으면",
              "다른 앱으로 전환했다가 돌아오면",
              "기기 화면이 꺼졌다가 켜지면",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[12px] text-[var(--monari-ink-muted)]">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-[var(--monari-ink-muted)]">
            잠금 해제는 현재 로그인된 계정으로 인증해요.
            기기에 Face ID / 지문인증이 등록되어 있다면 자동으로 사용돼요.
          </p>
        </div>
      </PageContent>
    </AppNavShell>
  );
}
