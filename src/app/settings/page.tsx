import Link from "next/link";
import { SessionCard } from "@/components/auth/session-card";
import {
  AllowanceRuleForm,
  BorrowConditionsForm,
  ChildCreateForm,
  ChildPinForm,
  InterestPolicyForm,
} from "@/components/finance/management-forms";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge, MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatPercent, formatWon } from "@/lib/format";

export default async function SettingsPage() {
  const [bundle, auth] = await Promise.all([getAppDataBundle(), requireParentSession()]);
  const configuredChildren = new Set(bundle.interestPolicies.map((item) => item.childId));
  bundle.allowanceRules.forEach((item) => configuredChildren.add(item.childId));

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="설정" title="가정 금융 규칙 설정" right={<HeaderActions />} />

        <section className="mt-6">
          <Surface className="relative overflow-hidden border-[rgba(87,70,49,0.1)] bg-[linear-gradient(135deg,rgba(255,248,236,0.98),rgba(232,244,240,0.92))] px-6 py-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(15,139,124,0.08)] blur-2xl" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Settings</p>
              <h2 className="mt-4 font-display text-[2rem] font-semibold leading-[1.06] tracking-tight">
                아이별 통장 규칙과
                <br />
                부모 관리 기준을 정리합니다.
              </h2>
              <p className="mt-4 max-w-[31ch] text-sm leading-6 text-[var(--color-muted)]">
                프로필, PIN, 용돈, 이자, 미리쓰기 조건을 한곳에서 관리하도록 구성했습니다.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <SettingsPill label="등록 자녀" value={`${bundle.children.length}`} />
                <SettingsPill label="용돈 규칙" value={`${bundle.allowanceRules.length}`} />
                <SettingsPill label="정책 연결" value={`${configuredChildren.size}`} />
              </div>
            </div>
          </Surface>
        </section>

        <Section title="내 계정">
          {auth.user ? (
            <SessionCard
              email={auth.user.email}
              name={auth.profile?.name ? String(auth.profile.name) : String(auth.user.user_metadata?.name ?? "")}
              role={auth.profile?.role ? String(auth.profile.role) : "parent"}
            />
          ) : (
            <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(249,243,234,0.94))]">
              <p className="text-sm text-[var(--color-muted)]">로그인 후 이용할 수 있어요.</p>
              <Link
                href="/login"
                className="mt-4 inline-flex h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-5 text-sm font-bold text-white"
              >
                로그인하기
              </Link>
            </Surface>
          )}
        </Section>

        <Section title="아이 프로필" description="아이별 통장 상태와 핵심 설정을 한 카드에서 확인합니다.">
          {bundle.children.length === 0 ? (
            <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(249,243,234,0.94))]">
              <p className="text-sm text-[var(--color-muted)]">아직 등록된 아이가 없어요. 아래에서 추가해주세요.</p>
            </Surface>
          ) : (
            <div className="space-y-3">
              {bundle.children.map((child) => {
                const policy = bundle.interestPolicies.find((p) => p.childId === child.id);
                const allowance = bundle.allowanceRules.find((r) => r.childId === child.id);
                return (
                  <Surface key={child.id} className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl font-semibold text-[var(--color-text)]">{child.name}</p>
                        <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                          {child.nickname} · {child.birthYear}년생
                        </p>
                      </div>
                      <Link
                        href={`/child/${child.id}`}
                        className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                      >
                        통장 보기
                      </Link>
                    </div>

                    {(policy || allowance) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {policy && (
                          <span className="rounded-full border border-[rgba(87,70,49,0.08)] bg-white/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                            이자 {policy.baseInterestRate}%
                          </span>
                        )}
                        {allowance && (
                          <span className="rounded-full border border-[rgba(87,70,49,0.08)] bg-white/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                            용돈 {formatWon(allowance.amount)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <ProfileStat label="이자 정책" value={policy ? formatPercent(policy.baseInterestRate) : "미설정"} />
                      <ProfileStat label="용돈 규칙" value={allowance ? formatWon(allowance.amount) : "미설정"} />
                    </div>

                    <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                      <ChildPinForm childId={child.id} />
                    </div>
                  </Surface>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="아이 추가" description="새 자녀 프로필을 만들어 바로 규칙에 연결할 수 있습니다.">
          <ChildCreateForm />
        </Section>

        <Section title="용돈 규칙" description="자동 지급 규칙과 현재 활성화된 사이클을 함께 보여줍니다.">
          {bundle.allowanceRules.length > 0 && (
            <div className="mb-3 space-y-2">
              {bundle.allowanceRules.map((rule) => {
                const child = bundle.children.find((c) => c.id === rule.childId);
                const cycleLabel = rule.type === "weekly" ? "매주" : rule.type === "monthly" ? "매달" : "직접 지급";
                return (
                  <div key={rule.id} className="flex items-center justify-between rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(249,243,234,0.94))] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{child?.name} · {rule.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">{cycleLabel} {formatWon(rule.amount)}</p>
                    </div>
                    <Badge tone="sky">{cycleLabel}</Badge>
                  </div>
                );
              })}
            </div>
          )}
          {bundle.children.length > 0 ? (
            <AllowanceRuleForm childOptions={bundle.children} />
          ) : (
            <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(249,243,234,0.94))]">
              <p className="text-sm text-[var(--color-muted)]">아이를 먼저 추가해주세요.</p>
            </Surface>
          )}
        </Section>

        <Section title="이자 설정" description="행동과 저축을 연결하는 핵심 정책을 자녀별로 관리합니다.">
          {bundle.interestPolicies.length > 0 && (
            <div className="mb-3 space-y-2">
              {bundle.interestPolicies.map((policy) => {
                const child = bundle.children.find((c) => c.id === policy.childId);
                return (
                  <div key={policy.id} className="rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(239,228,210,0.9))] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{child?.name}</p>
                      <Badge tone="sky">{policy.settlementCycle === "monthly" ? "매달 정산" : "매주 정산"}</Badge>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-[var(--color-muted)]">
                      <span>기본 <strong className="text-[var(--color-text)]">{formatPercent(policy.baseInterestRate)}</strong></span>
                      <span>최소 {formatPercent(policy.minInterestRate)}</span>
                      <span>최대 {formatPercent(policy.maxInterestRate)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {bundle.children.length > 0 ? (
            <InterestPolicyForm childOptions={bundle.children} />
          ) : (
            <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(249,243,234,0.94))]">
              <p className="text-sm text-[var(--color-muted)]">아이를 먼저 추가해주세요.</p>
            </Surface>
          )}
        </Section>

        <Section title="미리쓰기 한도" description="선지급 조건과 허용 범위를 계획 소비 관점에서 설정합니다.">
          {bundle.children.length > 0 ? (
            <BorrowConditionsForm childOptions={bundle.children} />
          ) : (
            <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(249,243,234,0.94))]">
              <p className="text-sm text-[var(--color-muted)]">아이를 먼저 추가해주세요.</p>
            </Surface>
          )}
        </Section>
      </MobileShell>
      <BottomNav pathname="/settings" />
    </PageContainer>
  );
}

function SettingsPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(87,70,49,0.08)] bg-white/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-2 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(87,70,49,0.08)] bg-white/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-2 font-display text-lg font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
