import Link from "next/link";
import { SessionCard } from "@/components/auth/session-card";
import {
  AllowanceRuleForm,
  BorrowConditionsForm,
  ChildCreateForm,
  ChildPinForm,
  InterestPolicyForm,
} from "@/components/finance/management-forms";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatPercent, formatWon } from "@/lib/format";

export default async function SettingsPage() {
  const [bundle, auth] = await Promise.all([getAppDataBundle(), requireParentSession()]);
  const configuredChildren = new Set(bundle.interestPolicies.map((item) => item.childId));
  bundle.allowanceRules.forEach((item) => configuredChildren.add(item.childId));

  return (
    <MobileAppShell title="가정 금융 규칙" subtitle="설정">
      {/* Hero */}
      <div className="monari-hero mb-4">
        <p className="text-[13px] font-700 text-white/70 mb-2">아이별 통장 규칙 관리</p>
        <div className="grid grid-cols-3 gap-2">
          <HeroPill label="등록 자녀" value={`${bundle.children.length}명`} />
          <HeroPill label="용돈 규칙" value={`${bundle.allowanceRules.length}개`} />
          <HeroPill label="정책 연결" value={`${configuredChildren.size}개`} />
        </div>
      </div>

      {/* Account */}
      <section className="mb-4">
        <SectionTitle>내 계정</SectionTitle>
        <div className="mt-3">
          {auth.user ? (
            <SessionCard
              email={auth.user.email}
              name={auth.profile?.name ? String(auth.profile.name) : String(auth.user.user_metadata?.name ?? "")}
              role={auth.profile?.role ? String(auth.profile.role) : "parent"}
            />
          ) : (
            <div className="monari-card p-5">
              <p className="text-[14px] text-[var(--monari-ink-soft)] mb-3">로그인 후 이용할 수 있어요.</p>
              <Link href="/login" className="monari-btn-primary px-5">로그인하기</Link>
            </div>
          )}
        </div>
      </section>

      {/* Child profiles */}
      <section className="mb-4">
        <SectionTitle>아이 프로필</SectionTitle>
        {bundle.children.length === 0 ? (
          <div className="monari-card mt-3 p-4">
            <p className="text-[13px] text-[var(--monari-ink-soft)]">아직 등록된 아이가 없어요. 아래에서 추가해주세요.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {bundle.children.map((child) => {
              const policy = bundle.interestPolicies.find((p) => p.childId === child.id);
              const allowance = bundle.allowanceRules.find((r) => r.childId === child.id);
              return (
                <div key={child.id} className="monari-card p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[18px] font-800 text-[var(--monari-ink)]">{child.name}</p>
                      <p className="monari-meta mt-0.5">{child.nickname} · {child.birthYear}년생</p>
                    </div>
                    <Link
                      href={`/child/${child.id}`}
                      className="rounded-[14px] border border-[var(--monari-line)] px-3 py-1.5 text-[12px] font-700 text-[var(--monari-hero)]"
                    >
                      통장 보기
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <MetricBox label="이자 정책" value={policy ? formatPercent(policy.baseInterestRate) : "미설정"} />
                    <MetricBox label="용돈 규칙" value={allowance ? formatWon(allowance.amount) : "미설정"} />
                  </div>

                  <div className="border-t border-[var(--monari-line)] pt-4">
                    <ChildPinForm childId={child.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add child */}
      <section className="mb-4">
        <SectionTitle>아이 추가</SectionTitle>
        <div className="monari-card mt-3 p-5">
          <ChildCreateForm />
        </div>
      </section>

      {/* Allowance rules */}
      <section className="mb-4">
        <SectionTitle>용돈 규칙</SectionTitle>
        {bundle.allowanceRules.length > 0 && (
          <div className="monari-card mt-3 px-4 mb-3 divide-y divide-[var(--monari-line)]">
            {bundle.allowanceRules.map((rule) => {
              const child = bundle.children.find((c) => c.id === rule.childId);
              const cycleLabel = rule.type === "weekly" ? "매주" : rule.type === "monthly" ? "매달" : "직접 지급";
              return (
                <div key={rule.id} className="flex items-center justify-between py-[14px]">
                  <div>
                    <p className="text-[14px] font-600 text-[var(--monari-ink)]">{child?.name} · {rule.title}</p>
                    <p className="monari-meta mt-[2px]">{cycleLabel} {formatWon(rule.amount)}</p>
                  </div>
                  <span className="text-[12px] font-700 text-[var(--monari-hero)] bg-[var(--monari-plus-bg)] px-2.5 py-1 rounded-[10px]">{cycleLabel}</span>
                </div>
              );
            })}
          </div>
        )}
        {bundle.children.length > 0 ? (
          <div className="monari-card p-5">
            <AllowanceRuleForm childOptions={bundle.children} />
          </div>
        ) : (
          <div className="monari-card mt-3 p-4">
            <p className="text-[13px] text-[var(--monari-ink-soft)]">아이를 먼저 추가해주세요.</p>
          </div>
        )}
      </section>

      {/* Interest policies */}
      <section className="mb-4">
        <SectionTitle>이자 설정</SectionTitle>
        {bundle.interestPolicies.length > 0 && (
          <div className="monari-card mt-3 px-4 mb-3 divide-y divide-[var(--monari-line)]">
            {bundle.interestPolicies.map((policy) => {
              const child = bundle.children.find((c) => c.id === policy.childId);
              return (
                <div key={policy.id} className="py-[14px]">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[14px] font-700 text-[var(--monari-ink)]">{child?.name}</p>
                    <span className="text-[12px] font-700 text-[var(--monari-hero)] bg-[var(--monari-plus-bg)] px-2.5 py-1 rounded-[10px]">
                      {policy.settlementCycle === "monthly" ? "매달 정산" : "매주 정산"}
                    </span>
                  </div>
                  <p className="monari-meta">
                    기본 {formatPercent(policy.baseInterestRate)} · 최소 {formatPercent(policy.minInterestRate)} · 최대 {formatPercent(policy.maxInterestRate)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        {bundle.children.length > 0 ? (
          <div className="monari-card p-5">
            <InterestPolicyForm childOptions={bundle.children} />
          </div>
        ) : (
          <div className="monari-card mt-3 p-4">
            <p className="text-[13px] text-[var(--monari-ink-soft)]">아이를 먼저 추가해주세요.</p>
          </div>
        )}
      </section>

      {/* Borrow conditions */}
      <section className="mb-4">
        <SectionTitle>미리쓰기 한도</SectionTitle>
        {bundle.children.length > 0 ? (
          <div className="monari-card mt-3 p-5">
            <BorrowConditionsForm childOptions={bundle.children} />
          </div>
        ) : (
          <div className="monari-card mt-3 p-4">
            <p className="text-[13px] text-[var(--monari-ink-soft)]">아이를 먼저 추가해주세요.</p>
          </div>
        )}
      </section>
    </MobileAppShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-white/10 border border-white/15 px-2 py-2 gap-0.5">
      <p className="text-[11px] font-600 text-white/70">{label}</p>
      <p className="text-[14px] font-800 text-white">{value}</p>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--monari-line)] bg-[rgba(43,43,43,0.03)] p-3">
      <p className="monari-meta">{label}</p>
      <p className="text-[15px] font-800 text-[var(--monari-ink)] mt-1">{value}</p>
    </div>
  );
}
