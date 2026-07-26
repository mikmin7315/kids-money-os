import { redirect } from "next/navigation";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { InterestPolicyCard } from "@/components/finance/interest-policy-card";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

const PRESETS = [
  { label: "낮음", rate: 2, desc: "처음 시작할 때 추천" },
  { label: "기본", rate: 3, desc: "가장 많이 쓰는 설정" },
  { label: "높음", rate: 5, desc: "약속 잘 지키는 아이" },
];

export default async function InterestSettingPage() {
  const auth = await requireParentSession();
  if (!auth.user) redirect("/login");

  const bundle = await getAppDataBundle();
  const hasChildren = bundle.children.length > 0;

  return (
    <AppNavShell>
      <PageHero>
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70"
        >
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">금융 설정</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">이자율 설정</h1>
        <p className="text-[13px] text-white/65">약속을 지킬수록 이자가 올라가요</p>
      </PageHero>

      <PageContent className="pt-5">

        {/* 이자 구조 설명 */}
        <div className="mb-5 rounded-[16px] bg-[var(--monari-hero-lo)] px-4 py-4">
          <p className="text-[12px] font-bold text-[var(--monari-hero)] mb-2">이자는 어떻게 계산되나요?</p>
          <div className="space-y-1 text-[12px] leading-5 text-[var(--monari-hero)]">
            <p>• <b>기본 이자율</b>로 시작해요</p>
            <p>• 행동 약속을 지킬 때마다 이자율이 올라가요</p>
            <p>• 최소·최대 범위 안에서만 움직여요</p>
            <p>• 매월 말 남긴 돈 × 이자율로 계산해요</p>
          </div>
        </div>

        {/* 이자율 프리셋 가이드 */}
        <section className="mb-5">
          <p className="text-[13px] font-extrabold text-[var(--monari-ink)] mb-3">이자율 가이드</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <div
                key={p.label}
                className="monari-card p-3 text-center"
              >
                <p className="text-[20px] font-black text-[var(--monari-hero)]">{p.rate}%</p>
                <p className="mt-0.5 text-[12px] font-bold text-[var(--monari-ink)]">{p.label}</p>
                <p className="mt-0.5 text-[11px] text-[var(--monari-ink-muted)]">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 아이별 이자율 카드 */}
        <section className="mb-6">
          <p className="text-[13px] font-extrabold text-[var(--monari-ink)] mb-3">아이별 이자율 설정</p>
          {!hasChildren ? (
            <div className="monari-card px-4 py-6 text-center">
              <TrendingUp className="mx-auto mb-3 text-[var(--monari-ink-muted)]" size={28} />
              <p className="text-[14px] font-extrabold text-[var(--monari-ink)]">아이 프로필을 먼저 등록해주세요</p>
              <Link href="/settings" className="mt-3 inline-block text-[13px] font-bold text-[var(--monari-hero)]">
                설정으로 가기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bundle.children.map((child) => (
                <InterestPolicyCard
                  key={child.id}
                  child={child}
                  policy={bundle.interestPolicies.find((policy) => policy.childId === child.id)}
                />
              ))}
            </div>
          )}
        </section>

      </PageContent>
    </AppNavShell>
  );
}
