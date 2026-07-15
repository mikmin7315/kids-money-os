import { redirect } from "next/navigation";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { InterestPolicyForm } from "@/components/finance/management-forms";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatPercent } from "@/lib/format";

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
    <MobileAppShell title="이자 설정" subtitle="이자율 정책 관리">
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
      >
        <ArrowLeft size={16} /> 설정으로
      </Link>

      {/* 히어로 */}
      <section
        className="relative mb-6 overflow-hidden rounded-[24px] p-6 text-white"
        style={{
          background: "linear-gradient(145deg,#5b21b6 0%,#7c3aed 55%,#a855f7 100%)",
          boxShadow: "0 16px 40px rgba(109,40,217,0.35)",
        }}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-[13px] font-semibold text-white/70">약속을 지키면 이자가 올라가요</p>
          <h2 className="mt-1 text-xl font-black tracking-tight">이자율 설정</h2>
          <p className="mt-2 text-sm text-white/75">
            남긴 돈에 붙는 기본 이자율과 최소·최대 범위를 정해주세요.
            행동 약속을 지킬수록 이자율이 높아져요.
          </p>
        </div>
      </section>

      {/* 이자 구조 설명 */}
      <div className="mb-6 rounded-[16px] bg-[var(--monari-hero-lo)] p-4">
        <p className="text-xs font-bold text-[var(--monari-hero)]">📊 이자는 어떻게 계산되나요?</p>
        <div className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--monari-hero)]">
          <p>• <b>기본 이자율</b>로 시작해요</p>
          <p>• 행동 약속을 지킬 때마다 이자율이 올라가요</p>
          <p>• 최소·최대 범위 안에서만 움직여요</p>
          <p>• 매월 말 남긴 돈 × 이자율로 계산해요</p>
        </div>
      </div>

      {/* 이자율 프리셋 예시 */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-extrabold text-[var(--monari-ink)]">이자율 가이드</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <div
              key={p.label}
              className="rounded-[16px] bg-white p-3 text-center shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
            >
              <p className="text-xl font-black text-[var(--monari-hero)]">{p.rate}%</p>
              <p className="mt-0.5 text-xs font-bold text-[var(--monari-ink)]">{p.label}</p>
              <p className="mt-0.5 text-[10px] text-[var(--monari-ink-muted)]">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 현재 설정 현황 */}
      {bundle.interestPolicies.length > 0 && (
        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--monari-ink)]">현재 설정된 이자 정책</p>
          <div className="space-y-2">
            {bundle.interestPolicies.map((policy) => {
              const child = bundle.children.find((c) => c.id === policy.childId);
              return (
                <div
                  key={policy.id}
                  className="flex items-center justify-between rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
                      <TrendingUp size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-[var(--monari-ink)]">{child?.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--monari-ink-muted)]">
                        {formatPercent(policy.minInterestRate)} ~ {formatPercent(policy.maxInterestRate)}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-[var(--monari-hero)]">
                    {formatPercent(policy.baseInterestRate)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 폼 */}
      {!hasChildren ? (
        <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <TrendingUp className="mx-auto mb-3 text-[var(--monari-ink-muted)]" size={32} />
          <p className="text-sm font-extrabold text-[var(--monari-ink)]">아이 프로필을 먼저 등록해주세요</p>
          <Link href="/settings" className="mt-3 inline-block text-sm font-bold text-[var(--monari-hero)]">
            설정으로 가기 →
          </Link>
        </div>
      ) : (
        <div className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="mb-4 text-sm font-extrabold text-[var(--monari-ink)]">이자 정책 설정</p>
          <InterestPolicyForm childOptions={bundle.children} />
        </div>
      )}
    </MobileAppShell>
  );
}
