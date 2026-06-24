import { ChevronRight, CircleDollarSign, Landmark, PiggyBank, Plus, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { AccountDeletionCard } from "@/components/auth/account-deletion-card";
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

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const auth = await requireParentSession();
  const bundle = await getAppDataBundle();
  const configuredChildren = new Set(bundle.interestPolicies.map((item) => item.childId));
  bundle.allowanceRules.forEach((item) => configuredChildren.add(item.childId));
  const hasChildren = bundle.children.length > 0;

  return (
    <MobileAppShell title="가족 금융 설정" subtitle="부모 설정">
      <section className="monari-hero mb-6">
        <div className="relative z-10">
          <p className="text-sm font-bold text-white/75">우리 가족 설정 현황</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">아이에게 맞는 금융 규칙을 관리하세요</h2>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <HeroPill label="등록한 아이" value={`${bundle.children.length}명`} />
            <HeroPill label="용돈 규칙" value={`${bundle.allowanceRules.length}개`} />
            <HeroPill label="정책 연결" value={`${configuredChildren.size}명`} />
          </div>
        </div>
      </section>

      <section className="mb-7">
        <SectionTitle>내 계정</SectionTitle>
        <div className="mt-3">
          {auth.user ? (
            <SessionCard
              email={auth.user.email}
              name={auth.profile?.name ? String(auth.profile.name) : String(auth.user.user_metadata?.name ?? "")}
              role={auth.profile?.role ? String(auth.profile.role) : "parent"}
            />
          ) : (
            <EmptyState icon={ShieldCheck} title="로그인이 필요해요" description="부모 계정으로 로그인하면 가족 설정을 안전하게 관리할 수 있어요.">
              <Link href="/login" className="monari-btn-primary mt-4 w-full">로그인하기</Link>
            </EmptyState>
          )}
          {auth.user && auth.profile?.role !== "admin" && <AccountDeletionCard />}
        </div>
      </section>

      <section className="mb-7">
        <SectionTitle>아이 프로필</SectionTitle>
        {hasChildren ? (
          <div className="mt-3 space-y-3">
            {bundle.children.map((child) => {
              const policy = bundle.interestPolicies.find((item) => item.childId === child.id);
              const allowance = bundle.allowanceRules.find((item) => item.childId === child.id);
              return (
                <article key={child.id} className="monari-card overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-[var(--monari-ink)]">{child.name}</p>
                        <p className="mt-1 text-xs text-[var(--monari-ink-muted)]">{child.nickname} · {child.birthYear}년생</p>
                      </div>
                      <Link href={`/child/${child.id}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl bg-[var(--monari-plus-bg)] px-3 text-xs font-bold text-[var(--monari-hero)]">
                        통장 보기 <ChevronRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <MetricBox label="기본 이자율" value={policy ? formatPercent(policy.baseInterestRate) : "설정 전"} />
                      <MetricBox label="용돈 금액" value={allowance ? formatWon(allowance.amount) : "설정 전"} />
                    </div>
                  </div>
                  <details className="border-t border-[var(--monari-line)]">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-bold text-[var(--monari-ink-soft)]">
                      아이 모드 PIN 관리
                      <ChevronRight size={16} aria-hidden="true" />
                    </summary>
                    <div className="border-t border-[var(--monari-line)] bg-[var(--monari-surface-soft)] p-5">
                      <ChildPinForm childId={child.id} />
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={UserPlus} title="첫 아이를 등록해주세요" description="아이 프로필을 등록하면 용돈, 이자, 미리쓰기 규칙을 설정할 수 있어요." />
        )}
        <Link
          href="/children/new"
          className="monari-card mt-3 flex min-h-16 items-center gap-3 px-4 py-3 transition active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--monari-plus-bg)] text-[var(--monari-hero)]">
            <UserPlus size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-[var(--monari-ink)]">아이 프로필 추가</span>
            <span className="mt-0.5 block text-xs leading-5 text-[var(--monari-ink-muted)]">새 아이의 금융 생활을 시작해요.</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[var(--monari-hero)]" />
        </Link>
      </section>

      {/* 빠른 설정 바로가기 */}
      <section className="mb-7">
        <SectionTitle>빠른 설정</SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href="/settings/allowance" className="flex flex-col gap-2 rounded-[20px] bg-[#f0fdf4] p-4 transition active:scale-[0.97]">
            <CircleDollarSign size={22} className="text-[#059669]" />
            <p className="text-sm font-extrabold text-[#065f46]">정기 용돈 설정</p>
            <p className="text-xs text-[#059669]/70">매주·매월 자동 지급</p>
          </Link>
          <Link href="/settings/interest" className="flex flex-col gap-2 rounded-[20px] bg-[#ede9fe] p-4 transition active:scale-[0.97]">
            <PiggyBank size={22} className="text-[var(--monari-hero)]" />
            <p className="text-sm font-extrabold text-[#4c1d95]">이자율 설정</p>
            <p className="text-xs text-[#7c3aed]/70">약속 기반 이자 설정</p>
          </Link>
        </div>
      </section>

      <section className="mb-7">
        <SectionTitle>금융 규칙</SectionTitle>
        <p className="mt-2 text-xs leading-5 text-[var(--monari-ink-muted)]">아이와 함께 정한 규칙은 언제든 다시 저장해 변경할 수 있어요.</p>

        {bundle.allowanceRules.length > 0 && (
          <div className="monari-card mt-3 divide-y divide-[var(--monari-line)] px-4">
            {bundle.allowanceRules.map((rule) => {
              const child = bundle.children.find((item) => item.id === rule.childId);
              const cycle = rule.type === "weekly" ? "매주" : rule.type === "monthly" ? "매월" : "직접 지급";
              return (
                <div key={rule.id} className="flex items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--monari-ink)]">{child?.name} · {rule.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--monari-ink-muted)]">{cycle} {formatWon(rule.amount)}</p>
                  </div>
                  <StatusBadge>{cycle}</StatusBadge>
                </div>
              );
            })}
          </div>
        )}

        <UnavailableState show={!hasChildren} />
        {hasChildren && (
          <SettingsForm title="용돈 규칙 추가" description="정기 용돈의 금액과 지급일을 정해요." icon={CircleDollarSign}>
            <AllowanceRuleForm childOptions={bundle.children} />
          </SettingsForm>
        )}

        {bundle.interestPolicies.length > 0 && (
          <div className="monari-card mt-3 divide-y divide-[var(--monari-line)] px-4">
            {bundle.interestPolicies.map((policy) => {
              const child = bundle.children.find((item) => item.id === policy.childId);
              return (
                <div key={policy.id} className="py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-[var(--monari-ink)]">{child?.name}</p>
                    <StatusBadge>{policy.settlementCycle === "monthly" ? "매월 정산" : "매주 정산"}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--monari-ink-muted)]">
                    기본 {formatPercent(policy.baseInterestRate)} · 최소 {formatPercent(policy.minInterestRate)} · 최대 {formatPercent(policy.maxInterestRate)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {hasChildren && (
          <>
            <SettingsForm title="이자 정책 설정" description="약속 실천에 따라 변할 이자율 범위를 정해요." icon={PiggyBank}>
              <InterestPolicyForm childOptions={bundle.children} />
            </SettingsForm>
            <SettingsForm title="미리쓰기 한도 설정" description="요청 한도와 부모 승인 기준을 관리해요." icon={Landmark}>
              <BorrowConditionsForm childOptions={bundle.children} />
            </SettingsForm>
          </>
        )}
      </section>
    </MobileAppShell>
  );
}

function SettingsForm({ title, description, icon: Icon, defaultOpen, children }: { title: string; description: string; icon: typeof Plus; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details className="monari-card mt-3 overflow-hidden" open={defaultOpen}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--monari-plus-bg)] text-[var(--monari-hero)]"><Icon size={19} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-[var(--monari-ink)]">{title}</span>
          <span className="mt-0.5 block text-xs leading-5 text-[var(--monari-ink-muted)]">{description}</span>
        </span>
        <Plus size={18} className="shrink-0 text-[var(--monari-hero)]" aria-hidden="true" />
      </summary>
      <div className="border-t border-[var(--monari-line)] bg-[var(--monari-surface-soft)] p-4 sm:p-5">{children}</div>
    </details>
  );
}

function EmptyState({ icon: Icon, title, description, children }: { icon: typeof Plus; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="monari-card mt-3 p-5 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--monari-plus-bg)] text-[var(--monari-hero)]"><Icon size={21} aria-hidden="true" /></span>
      <p className="mt-3 text-sm font-extrabold text-[var(--monari-ink)]">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--monari-ink-muted)]">{description}</p>
      {children}
    </div>
  );
}

function UnavailableState({ show }: { show: boolean }) {
  if (!show) return null;
  return <EmptyState icon={UserPlus} title="아이 등록 후 규칙을 설정할 수 있어요" description="먼저 위에서 아이 프로필을 추가해주세요." />;
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-center"><p className="text-[10px] font-semibold text-white/70">{label}</p><p className="mt-0.5 text-sm font-black text-white">{value}</p></div>;
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] p-3"><p className="text-[11px] font-semibold text-[var(--monari-ink-muted)]">{label}</p><p className="mt-1 text-sm font-extrabold text-[var(--monari-ink)]">{value}</p></div>;
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 rounded-lg bg-[var(--monari-plus-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--monari-hero)]">{children}</span>;
}
