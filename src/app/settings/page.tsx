import Link from "next/link";
import { SessionCard } from "@/components/auth/session-card";
import { TransactionQuickForm } from "@/components/finance/action-forms";
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

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="정책 설정" title="정책 설정" right={<HeaderActions />} />

        {/* Account */}
        <Section title="계정" description="부모 계정이 연결되어야 실제 데이터를 사용할 수 있습니다.">
          {auth.user ? (
            <SessionCard
              email={auth.user.email}
              name={auth.profile?.name ? String(auth.profile.name) : String(auth.user.user_metadata?.name ?? "")}
              role={auth.profile?.role ? String(auth.profile.role) : "parent"}
            />
          ) : (
            <Surface>
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                로그인된 부모 계정이 없습니다.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)]"
              >
                로그인
              </Link>
            </Surface>
          )}
        </Section>

        {/* Child profiles */}
        <Section title="아이 프로필" description="부모 계정 아래 아이를 생성하고 관리합니다.">
          <ChildCreateForm />
          <div className="mt-3 space-y-3">
            {bundle.children.map((child) => (
              <Surface key={child.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{child.name}</p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      별명: {child.nickname} | 출생연도: {child.birthYear}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <ChildPinForm childId={child.id} />
                </div>
              </Surface>
            ))}
          </div>
        </Section>

        {/* P-I-01: Interest policy */}
        <Section title="이자 정책 설정 (P-I-01)" description="기본 이자율과 최소·최대 범위를 설정합니다. 행동 점수에 따라 자동 변동됩니다.">
          <div className="mb-3 space-y-3">
            {bundle.interestPolicies.map((policy) => {
              const child = bundle.children.find((c) => c.id === policy.childId);
              return (
                <Surface key={policy.id}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{child?.name ?? policy.childId}</p>
                    <Badge tone="sky">{policy.settlementCycle === "monthly" ? "월별" : "주별"}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <PolicyStat label="기본" value={formatPercent(policy.baseInterestRate)} />
                    <PolicyStat label="최소" value={formatPercent(policy.minInterestRate)} />
                    <PolicyStat label="최대" value={formatPercent(policy.maxInterestRate)} />
                  </div>
                </Surface>
              );
            })}
          </div>
          <InterestPolicyForm children={bundle.children} />
        </Section>

        {/* P-13: Allowance rules */}
        <Section title="정기 용돈 설정 (P-13)" description="주간·월별 정기 용돈을 설정합니다.">
          <div className="mb-3 space-y-3">
            {bundle.allowanceRules.map((rule) => {
              const child = bundle.children.find((c) => c.id === rule.childId);
              return (
                <Surface key={rule.id}>
                  <p className="font-semibold">{rule.title}</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {child?.name} | {rule.type === "weekly" ? "주간" : "커스텀"} | {formatWon(rule.amount)}
                  </p>
                </Surface>
              );
            })}
          </div>
          <AllowanceRuleForm children={bundle.children} />
        </Section>

        {/* P-L-01: Borrow conditions */}
        <Section title="미리쓰기 조건 설정 (P-L-01)" description="아이별 미리쓰기 한도와 자동 승인 기준을 설정합니다.">
          <BorrowConditionsForm children={bundle.children} />
        </Section>

        {/* Transaction test */}
        <Section title="거래 테스트" description="용돈, 지출, 저축, 상환 쓰기를 테스트합니다.">
          <TransactionQuickForm childOptions={bundle.children} />
        </Section>

        {/* Setup guide */}
        <Section title="설정 순서" description="처음 설정하는 분을 위한 가이드.">
          <Surface>
            <ol className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
              <li>1. `.env.local`에 Supabase 키를 입력합니다.</li>
              <li>2. SQL 에디터에서 `supabase/schema.sql`을 실행합니다.</li>
              <li>3. 로그인 후 아이 프로필을 생성합니다.</li>
              <li>4. 이자 정책, 용돈, 미리쓰기 조건을 순서대로 설정합니다.</li>
            </ol>
          </Surface>
        </Section>
      </MobileShell>
      <BottomNav pathname="/settings" />
    </PageContainer>
  );
}

function PolicyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-[var(--color-card)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
