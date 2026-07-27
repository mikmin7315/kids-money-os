import Link from "next/link";
import { ArrowLeft, BarChart2, Crown, Lock, Receipt, Sparkles, TrendingUp, Users } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { PaymentButton } from "@/components/subscription/payment-button";
import { requireParentSession } from "@/lib/auth";

const PORTONE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID && !!process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

export const dynamic = "force-dynamic";

const PLUS_FEATURES = [
  {
    icon: Users,
    title: "또래 비교 리포트",
    desc: "동네·전국 기준 우리 아이 용돈·저축률·지출 패턴을 또래와 비교해요.",
  },
  {
    icon: BarChart2,
    title: "카테고리별 지출 분석",
    desc: "또래 아이들이 어디에 돈을 가장 많이 쓰는지 카테고리별로 확인해요.",
  },
  {
    icon: TrendingUp,
    title: "행동 달성률 또래 비교",
    desc: "비슷한 나이 아이들의 평균 약속 달성률과 우리 아이를 비교해요.",
  },
  {
    icon: Sparkles,
    title: "광고 없이 깔끔하게",
    desc: "플러스 회원은 앱 내 광고 없이 이용할 수 있어요.",
  },
];

export default async function SubscriptionPage() {
  const auth = await requireParentSession();
  const isPremium = (auth.profile as { subscription_tier?: string } | null)?.subscription_tier === "plus";

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">계정</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">구독 관리</h1>
        <p className="text-[13px] text-white/65">
          {isPremium ? "모나리 플러스 이용 중" : "무료 플랜 · 플러스로 업그레이드"}
        </p>
        {isPremium && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/15 px-3 py-1.5">
            <Crown size={13} className="text-yellow-300" />
            <span className="text-[12px] font-bold text-white">모나리 플러스</span>
          </div>
        )}
      </PageHero>

      <PageContent className="pt-5">
        {isPremium ? (
          <>
            {/* 플러스 상태 카드 */}
            <section className="mb-6">
              <div
                className="rounded-[20px] p-5 text-center mb-4"
                style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", boxShadow: "0 8px 28px rgba(109,40,217,0.25)" }}
              >
                <p className="text-[28px] mb-2">✨</p>
                <p className="text-[18px] font-black text-white mb-1">모나리 플러스 이용 중</p>
                <p className="text-[12px] text-white/70">또래 비교 리포트를 모두 확인할 수 있어요</p>
              </div>
            </section>

            {/* 결제 내역 */}
            <section className="mb-6">
              <SectionTitle>결제 내역</SectionTitle>
              <div className="mt-3 monari-card px-5 py-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
                  <Receipt size={26} />
                </span>
                <p className="mt-4 text-[14px] font-bold text-[var(--monari-ink)]">결제 내역 준비 중</p>
                <p className="mt-1 text-[12px] text-[var(--monari-ink-muted)]">
                  결제 연동 완료 후 여기서 확인할 수 있어요.
                </p>
              </div>
            </section>

            {/* 구독 해지 */}
            <section className="mb-8">
              <SectionTitle>구독 해지</SectionTitle>
              <div className="mt-3 monari-card p-4">
                <p className="text-[13px] text-[var(--monari-ink-soft)] mb-3">
                  구독을 해지하면 이번 결제 기간이 끝날 때까지 플러스 기능을 계속 이용할 수 있어요.
                </p>
                <ul className="space-y-1.5 mb-4">
                  {[
                    "또래 비교 리포트 기능이 비활성화돼요.",
                    "기존 데이터와 기록은 유지돼요.",
                    "언제든 다시 구독할 수 있어요.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[12px] text-[var(--monari-ink-muted)]">
                      <span className="shrink-0 mt-0.5">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled
                  className="w-full rounded-[12px] border border-red-200 bg-red-50 py-3 text-[13px] font-bold text-red-400 opacity-70"
                >
                  해지 준비 중 — 결제 연동 후 이용 가능
                </button>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* 업그레이드 배너 */}
            <section className="mb-6">
              <div
                className="rounded-[20px] p-5"
                style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", boxShadow: "0 8px 28px rgba(109,40,217,0.25)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-white/60 mb-1">업그레이드</p>
                    <p className="text-[24px] font-black text-white leading-tight">모나리 플러스</p>
                    <p className="text-[12px] text-white/70 mt-1">아이의 금융 습관을 더 깊이 분석해요</p>
                  </div>
                  <Sparkles className="h-7 w-7 text-white/80 shrink-0" />
                </div>
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-[34px] font-black text-white tabular-nums">3,900</span>
                  <span className="text-[15px] font-bold text-white/70">원 / 월</span>
                </div>
                {PORTONE_CONFIGURED ? (
                  <PaymentButton userId={auth.user!.id} userEmail={auth.user!.email ?? ""} />
                ) : (
                  <button
                    disabled
                    className="w-full rounded-[14px] bg-white py-3.5 text-[14px] font-black text-[#7C3AED] opacity-60"
                  >
                    준비 중 — 곧 오픈해요
                  </button>
                )}
              </div>
            </section>

            {/* 플러스 기능 목록 */}
            <section className="mb-6">
              <SectionTitle>플러스 전용 기능</SectionTitle>
              <div className="mt-3 space-y-2">
                {PLUS_FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="monari-card flex items-start gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--monari-hero-lo)]">
                        <Icon size={20} className="text-[var(--monari-hero)]" />
                      </span>
                      <div>
                        <p className="text-[14px] font-bold text-[var(--monari-ink)]">{f.title}</p>
                        <p className="text-[12px] leading-5 text-[var(--monari-ink-muted)] mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 무료 vs 플러스 비교 */}
            <section className="mb-8">
              <SectionTitle>무료 vs 플러스</SectionTitle>
              <div className="mt-3 monari-card overflow-hidden">
                <div className="grid grid-cols-3 bg-[var(--monari-surface-soft)] px-4 py-2.5">
                  <span className="text-[11px] font-bold text-[var(--monari-ink-muted)]">기능</span>
                  <span className="text-[11px] font-bold text-center text-[var(--monari-ink-muted)]">무료</span>
                  <span className="text-[11px] font-bold text-center text-[var(--monari-hero)]">플러스</span>
                </div>
                {[
                  { label: "내 아이 월간 리포트", free: true, plus: true },
                  { label: "코칭 인사이트", free: true, plus: true },
                  { label: "전국 또래 평균 용돈", free: true, plus: true },
                  { label: "저축률 또래 비교", free: false, plus: true },
                  { label: "행동 달성률 비교", free: false, plus: true },
                  { label: "지출 카테고리 비교", free: false, plus: true },
                  { label: "광고 없음", free: false, plus: true },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-3 px-4 py-3 items-center"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--monari-border)" }}
                  >
                    <span className="text-[12px] font-semibold text-[var(--monari-ink-soft)]">{row.label}</span>
                    <span className="text-center text-[14px]">
                      {row.free ? "✓" : <Lock size={12} className="mx-auto text-[var(--monari-ink-muted)]" />}
                    </span>
                    <span className="text-center text-[14px] font-black text-[var(--monari-hero)]">
                      {row.plus ? "✓" : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </PageContent>
    </AppNavShell>
  );
}
