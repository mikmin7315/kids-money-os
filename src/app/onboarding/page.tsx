import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";

export default async function OnboardingPage() {
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

  return (
    <main className="flex min-h-screen flex-col bg-white px-5 pb-10 pt-14">
      <div className="mx-auto w-full max-w-sm flex-1 flex flex-col">

        {/* 로고 */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)]">
            <span className="text-lg font-black text-white">M</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">Monari</span>
        </div>

        {/* 히어로 */}
        <div className="mt-12">
          <h1 className="text-[2.6rem] font-black leading-[1.1] tracking-tight text-[var(--color-text)]">
            행동이 이자를<br />만듭니다.
          </h1>
          <p className="mt-5 text-base leading-7 text-[var(--color-muted)]">
            약속을 지키면 이자율이 오르고, 저축이 쌓이고,<br />
            아이가 돈을 배우는 공간입니다.
          </p>
        </div>

        {/* 기능 카드 3개 */}
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

        {/* CTA */}
        <div className="mt-auto pt-12 space-y-3">
          <Link
            href="/login"
            className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-accent)] text-base font-bold text-white transition hover:opacity-90"
          >
            부모 계정으로 시작
          </Link>
          <Link
            href="/"
            className="flex h-14 w-full items-center justify-center rounded-full border-2 border-[var(--color-border)] text-base font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            데모 모드로 둘러보기
          </Link>
        </div>
      </div>
    </main>
  );
}

function FeatureRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-card)] text-xl">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-[var(--color-text)]">{title}</p>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">{body}</p>
      </div>
    </div>
  );
}
