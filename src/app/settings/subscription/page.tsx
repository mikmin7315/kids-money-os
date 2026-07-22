import Link from "next/link";
import { ArrowLeft, BarChart2, Lock, Sparkles, TrendingUp, Users } from "lucide-react";
import { requireParentSession } from "@/lib/auth";

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
    <div style={{ background: "var(--monari-bg)", minHeight: "100dvh" }}>
      <main className="px-4 pb-36 pt-8 max-w-lg mx-auto">
        <Link
          href="/settings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
        >
          <ArrowLeft size={16} /> 설정으로
        </Link>

        {/* 상태 배너 */}
        {isPremium ? (
          <div
            className="mb-6 rounded-[24px] p-5 text-center"
            style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", boxShadow: "0 8px 28px rgba(109,40,217,0.35)" }}
          >
            <p className="text-[30px] mb-2">✨</p>
            <p className="text-[20px] font-900 text-white mb-1">모나리 플러스 이용 중</p>
            <p className="text-[13px] font-600 text-white/70">또래 비교 리포트를 모두 확인할 수 있어요</p>
          </div>
        ) : (
          <div
            className="mb-6 rounded-[24px] p-5"
            style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", boxShadow: "0 8px 28px rgba(109,40,217,0.35)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[12px] font-700 tracking-[0.08em] uppercase text-white/60 mb-1">업그레이드</p>
                <p className="text-[26px] font-900 text-white leading-tight">모나리 플러스</p>
                <p className="text-[13px] font-600 text-white/70 mt-1">아이의 금융 습관을 더 깊이 분석해요</p>
              </div>
              <Sparkles className="h-8 w-8 text-white/80 shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[36px] font-900 text-white tabular-nums">3,900</span>
              <span className="text-[16px] font-700 text-white/70">원 / 월</span>
            </div>
            {/* TODO: 결제선생 또는 인앱결제 연동 */}
            <button
              disabled
              className="w-full rounded-[16px] bg-white py-3.5 text-[15px] font-900 text-[#7C3AED] opacity-60"
            >
              준비 중 — 곧 오픈해요
            </button>
          </div>
        )}

        {/* 기능 목록 */}
        <h2 className="text-[17px] font-900 text-[var(--monari-ink)] mb-3">플러스 전용 기능</h2>
        <div className="space-y-3 mb-6">
          {PLUS_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="monari-card flex items-start gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--monari-hero-lo)]">
                  <Icon size={20} className="text-[var(--monari-hero)]" />
                </span>
                <div>
                  <p className="text-[14px] font-800 text-[var(--monari-ink)]">{f.title}</p>
                  <p className="text-[12px] leading-5 text-[var(--monari-ink-muted)] mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 무료 vs 플러스 비교 */}
        <h2 className="text-[17px] font-900 text-[var(--monari-ink)] mb-3">무료 vs 플러스 비교</h2>
        <div className="monari-card overflow-hidden mb-6">
          <div className="grid grid-cols-3 bg-[var(--monari-surface-soft)] px-4 py-2.5">
            <span className="text-[11px] font-700 text-[var(--monari-ink-muted)]">기능</span>
            <span className="text-[11px] font-700 text-center text-[var(--monari-ink-muted)]">무료</span>
            <span className="text-[11px] font-800 text-center text-[var(--monari-hero)]">플러스</span>
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
              <span className="text-[12px] font-600 text-[var(--monari-ink-soft)]">{row.label}</span>
              <span className="text-center text-[15px]">{row.free ? "✓" : <Lock size={12} className="mx-auto text-[var(--monari-ink-muted)]" />}</span>
              <span className="text-center text-[15px] font-900 text-[var(--monari-hero)]">{row.plus ? "✓" : "—"}</span>
            </div>
          ))}
        </div>

        {!isPremium && (
          <p className="text-center text-[12px] text-[var(--monari-ink-muted)]">
            결제 연동 준비 중입니다. 오픈 시 알림을 보내드릴게요.
          </p>
        )}
      </main>
    </div>
  );
}
