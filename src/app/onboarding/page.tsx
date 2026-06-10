import { ArrowRight, BadgeCheck, Landmark, PiggyBank, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";

const features = [
  { icon: BadgeCheck, title: "약속이 금융 습관으로", body: "아이의 좋은 행동을 용돈과 이자율에 연결해요." },
  { icon: PiggyBank, title: "저축의 성장을 눈앞에서", body: "잔액과 이자가 자라는 과정을 아이가 직접 확인해요." },
  { icon: Landmark, title: "미리쓰기도 계획적으로", body: "한도와 승인 조건을 부모님이 안전하게 설정해요." },
];

export default async function OnboardingPage() {
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-[32px] border border-[var(--monari-line)] bg-white shadow-[var(--monari-shadow-float)]">
        <section className="monari-hero rounded-none px-6 py-8 sm:px-8">
          <div className="relative z-10">
            <div className="mb-12 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg font-black text-[var(--monari-hero)]">M</div>
                <span className="text-lg font-extrabold tracking-tight text-white">Monari</span>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">부모와 아이가 함께</span>
            </div>
            <p className="mb-3 text-xs font-extrabold tracking-[0.18em] text-white/70">MONEY HABITS FOR KIDS</p>
            <h1 className="text-[36px] font-black leading-[1.14] tracking-[-0.05em] text-white">
              돈을 주는 것을 넘어,<br />돈 쓰는 힘을 길러주세요.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/80">
              Monari는 가족의 약속과 용돈을 연결해 아이가 스스로 저축하고 계획하는 경험을 만듭니다.
            </p>
          </div>
        </section>

        <section className="px-5 py-6 sm:px-7 sm:py-7">
          <h2 className="text-lg font-extrabold tracking-tight text-[var(--monari-ink)]">한눈에 이해하고, 함께 결정해요</h2>
          <div className="mt-4 space-y-2.5">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--monari-plus-bg)] text-[var(--monari-hero)]">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-[var(--monari-ink)]">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--monari-ink-soft)]">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/login" className="monari-btn-primary w-full gap-2">
              부모 계정으로 시작하기
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/" className="monari-btn-ghost w-full">먼저 둘러보기</Link>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--monari-ink-muted)]">
            <ShieldCheck size={14} aria-hidden="true" />
            아이의 금융 활동은 부모님 승인 아래 안전하게 관리됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}
