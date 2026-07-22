import { ChevronRight, CircleDollarSign, PiggyBank, Plus, ReceiptText, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { AccountDeletionCard } from "@/components/auth/account-deletion-card";
import { SessionCard } from "@/components/auth/session-card";
import { ThemeToggleRow } from "@/components/ui/theme-toggle";
import { ChildPinForm } from "@/components/finance/management-forms";
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
        <SectionTitle>화면 테마</SectionTitle>
        <div className="mt-3">
          <ThemeToggleRow />
        </div>
      </section>

      {/* 모나리 플러스 배너 */}
      {(() => {
        const isPremium = (auth.profile as { subscription_tier?: string } | null)?.subscription_tier === "plus";
        return isPremium ? (
          <Link href="/settings/subscription" className="mb-6 flex items-center justify-between rounded-[20px] px-5 py-4 transition active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", boxShadow: "0 6px 20px rgba(109,40,217,0.3)" }}>
            <div>
              <p className="text-[11px] font-700 tracking-widest uppercase text-white/60">구독 중</p>
              <p className="text-[16px] font-900 text-white">모나리 플러스 ✨</p>
            </div>
            <ChevronRight size={18} className="text-white/60" />
          </Link>
        ) : (
          <Link href="/settings/subscription" className="mb-6 flex items-center gap-3 rounded-[20px] px-5 py-4 transition active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#7C3AED14,#9333EA08)", border: "1.5px solid #7C3AED30" }}>
            <Sparkles size={20} className="text-[var(--monari-hero)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-800 text-[var(--monari-ink)]">모나리 플러스로 업그레이드</p>
              <p className="text-[12px] text-[var(--monari-ink-muted)]">또래 비교 리포트 · 월 3,900원</p>
            </div>
            <ChevronRight size={16} className="text-[var(--monari-ink-muted)] shrink-0" />
          </Link>
        );
      })()}

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
        <SectionTitle>공동 보호자</SectionTitle>
        <div className="mt-3 space-y-2">
          <Link href="/settings/guardians" className="monari-card flex items-center justify-between px-4 py-3.5 transition active:scale-[0.98]">
            <div>
              <span className="text-sm font-bold text-[var(--monari-ink)]">보호자 초대 및 권한 관리</span>
              <p className="text-xs text-[var(--monari-ink-muted)]">배우자나 다른 보호자와 함께 관리해요</p>
            </div>
            <ChevronRight size={16} className="text-[var(--monari-ink-muted)]" />
          </Link>
        </div>
      </section>

      <section className="mb-7">
        <SectionTitle>알림</SectionTitle>
        <div className="mt-3 space-y-2">
          <Link href="/settings/notifications" className="monari-card flex items-center justify-between px-4 py-3.5 transition active:scale-[0.98]">
            <div>
              <span className="text-sm font-bold text-[var(--monari-ink)]">알림 상세 설정</span>
              <p className="text-xs text-[var(--monari-ink-muted)]">받고 싶은 알림 종류를 선택해요</p>
            </div>
            <ChevronRight size={16} className="text-[var(--monari-ink-muted)]" />
          </Link>
        </div>
      </section>

      <section className="mb-7">
        <SectionTitle>고객지원</SectionTitle>
        <div className="mt-3 space-y-2">
          <Link href="/announcements" className="monari-card flex items-center justify-between px-4 py-3.5 transition active:scale-[0.98]">
            <span className="text-sm font-bold text-[var(--monari-ink)]">공지사항</span>
            <ChevronRight size={16} className="text-[var(--monari-ink-muted)]" />
          </Link>
          <Link href="/inquiries" className="monari-card flex items-center justify-between px-4 py-3.5 transition active:scale-[0.98]">
            <span className="text-sm font-bold text-[var(--monari-ink)]">문의하기</span>
            <ChevronRight size={16} className="text-[var(--monari-ink-muted)]" />
          </Link>
          <Link href="/announcements" className="monari-card flex items-center justify-between px-4 py-3.5 transition active:scale-[0.98]">
            <span className="text-sm font-bold text-[var(--monari-ink)]">공지 및 안내</span>
            <ChevronRight size={16} className="text-[var(--monari-ink-muted)]" />
          </Link>
          <Link href="/settings/consent-history" className="monari-card flex items-center justify-between px-4 py-3.5 transition active:scale-[0.98]">
            <span className="text-sm font-bold text-[var(--monari-ink)]">동의 이력</span>
            <ChevronRight size={16} className="text-[var(--monari-ink-muted)]" />
          </Link>
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
                      <div className="flex flex-col gap-1.5">
                        <Link href={`/child/${child.id}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl bg-[var(--monari-plus-bg)] px-3 text-xs font-bold text-[var(--monari-hero)]">
                          통장 보기 <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                        <Link href={`/settings/children/${child.id}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl bg-[var(--monari-surface-soft)] px-3 text-xs font-bold text-[var(--monari-ink-soft)]">
                          수정·삭제
                        </Link>
                        <Link href={`/settings/interest-confirm/${child.id}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl bg-[var(--monari-hero-lo)] px-3 text-xs font-bold text-[var(--monari-hero)]">
                          이자 확정 🔒
                        </Link>
                      </div>
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
          <Link href="/manage" className="flex flex-col gap-2 rounded-[24px] bg-[var(--status-success-solid)] p-4 transition active:scale-[0.97]">
            <CircleDollarSign size={22} className="text-[var(--monari-done)]" />
            <p className="text-sm font-extrabold text-[var(--status-success-solid-text)]">정기 용돈 설정</p>
            <p className="text-xs text-[var(--monari-done)]/70">매주·매월 자동 지급</p>
          </Link>
          <Link href="/manage" className="flex flex-col gap-2 rounded-[24px] bg-[var(--monari-hero-lo)] p-4 transition active:scale-[0.97]">
            <PiggyBank size={22} className="text-[var(--monari-hero)]" />
            <p className="text-sm font-extrabold text-[var(--monari-hero)]">이자율 설정</p>
            <p className="text-xs text-[var(--monari-hero)]/70">약속 기반 이자 설정</p>
          </Link>
          <Link href="/settings/interest-history" className="flex flex-col gap-2 rounded-[24px] bg-[var(--status-success-solid)] p-4 transition active:scale-[0.97]">
            <ReceiptText size={22} className="text-[var(--monari-done)]" />
            <p className="text-sm font-extrabold text-[var(--status-success-solid-text)]">이자 지급 내역</p>
            <p className="text-xs text-[var(--monari-done)]/70">월별 이자 기록 확인</p>
          </Link>
        </div>
      </section>

    </MobileAppShell>
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

function HeroPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-center"><p className="text-[10px] font-semibold text-white/70">{label}</p><p className="mt-0.5 text-sm font-black text-white">{value}</p></div>;
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[var(--monari-line)] bg-[var(--monari-surface-soft)] p-3"><p className="text-[11px] font-semibold text-[var(--monari-ink-muted)]">{label}</p><p className="mt-1 text-sm font-extrabold text-[var(--monari-ink)]">{value}</p></div>;
}
