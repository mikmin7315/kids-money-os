import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";

export default async function OnboardingPage() {
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

  return (
    <main className="min-h-screen px-5 pb-10 pt-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="relative overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,248,236,0.98),rgba(232,244,240,0.92))] px-6 py-7 shadow-[var(--shadow-card)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(15,139,124,0.08)] blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 -translate-x-8 translate-y-8 rounded-full border border-[rgba(200,122,34,0.18)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)]">
                <span className="text-lg font-black text-white">M</span>
              </div>
              <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-text)]">Monari</span>
            </div>

            <div className="mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Onboarding</p>
              <h1 className="mt-4 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-[var(--color-text)]">
                행동이 이자를
                <br />
                만듭니다.
              </h1>
              <p className="mt-5 text-base leading-7 text-[var(--color-muted)]">
                약속을 지키면 이자율이 오르고, 저축이 쌓이고, 아이가 돈을 배우는 흐름을 부모가 설계합니다.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              <FeatureRow
                icon="⭐"
                title="행동 → 이자율"
                body="약속을 지킬수록 저축 이자율이 올라가요"
              />
              <FeatureRow
                icon="🐷"
                title="저축 자동 계산"
                body="월말 정산으로 이자가 자동 지급됩니다"
              />
              <FeatureRow
                icon="💳"
                title="미리쓰기 관리"
                body="계획적인 소비 습관을 함께 만들어요"
              />
            </div>

            <div className="mt-10 space-y-3">
              <Link
                href="/login"
                className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-accent)] text-base font-bold text-white transition hover:opacity-90"
              >
                부모 계정으로 시작
              </Link>
              <Link
                href="/"
                className="flex h-14 w-full items-center justify-center rounded-full border border-[var(--color-border)] bg-white/70 text-base font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                데모 모드로 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-white/70 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-card)] text-xl">
        {icon}
      </span>
      <div>
        <p className="font-display text-lg font-semibold text-[var(--color-text)]">{title}</p>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">{body}</p>
      </div>
    </div>
  );
}
