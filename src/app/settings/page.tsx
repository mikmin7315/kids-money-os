import {
  Bell,
  CalendarClock,
  ChevronRight,
  CreditCard,
  Crown,
  FileText,
  History,
  MapPin,
  Megaphone,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { AccountDeletionCard } from "@/components/auth/account-deletion-card";
import { SessionCard } from "@/components/auth/session-card";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { getParentWalletAction } from "@/actions/parent-wallet";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = [
  "#4F7FFF", "#7C3AED", "#059669", "#D97706", "#DB2777",
];

export default async function SettingsPage() {
  const auth = await requireParentSession();
  const [bundle, wallet] = await Promise.all([
    getAppDataBundle(),
    getParentWalletAction(),
  ]);
  const childCount = bundle.children.length;
  const ruleCount = bundle.allowanceRules.length;

  const isPlusPlan = auth.profile?.subscription_tier === "plus";
  const currentRegion = (auth.profile as { region?: string | null } | null)?.region ?? null;
  const planLabel = isPlusPlan ? "모나리 플러스" : "무료 플랜";
  const displayName = auth.profile?.name ? String(auth.profile.name) : (auth.user?.email?.split("@")[0] ?? "부모");

  return (
    <AppNavShell>
      <PageHero>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">내 계정</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white truncate">{displayName}</h1>
        <p className="mt-0.5 text-[13px] text-white/55">{auth.user?.email}</p>

        {/* 플랜 + 아이 수 뱃지 */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/15 px-3 py-1.5">
            {isPlusPlan && <Crown size={12} className="text-yellow-300" />}
            <span className="text-[12px] font-bold text-white">{planLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/10 px-3 py-1.5">
            <span className="text-[12px] font-bold text-white">아이 {childCount}명</span>
          </span>
        </div>
      </PageHero>

      <PageContent className="pt-5">

        {/* ① 가족 */}
        <section className="mb-6">
          <SectionTitle>가족</SectionTitle>
          <div className="mt-3 space-y-2">
            {bundle.children.map((child, idx) => {
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <div key={child.id} className="monari-card px-4 py-3.5 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-black text-white"
                    style={{ background: avatarColor }}
                  >
                    {child.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-extrabold text-[var(--monari-ink)] truncate">{child.name}</p>
                    <p className="text-[12px] text-[var(--monari-ink-muted)]">{child.birthYear}년생</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/child/${child.id}`}
                      className="inline-flex h-11 items-center gap-1 rounded-[10px] bg-[var(--monari-plus-bg)] px-3 text-[12px] font-bold text-[var(--monari-hero)]"
                    >
                      통장 보기
                    </Link>
                    <Link
                      href={`/settings/children/${child.id}`}
                      className="inline-flex h-11 items-center rounded-[10px] bg-[var(--monari-surface-soft)] px-3 text-[12px] font-bold text-[var(--monari-ink-soft)]"
                    >
                      수정
                    </Link>
                  </div>
                </div>
              );
            })}

            {childCount === 0 && (
              <div className="monari-card px-4 py-6 text-center">
                <p className="text-[32px] mb-2">👶</p>
                <p className="text-[14px] font-extrabold text-[var(--monari-ink)]">아직 아이가 없어요</p>
                <p className="mt-1 text-[12px] text-[var(--monari-ink-muted)]">아이를 등록하면 용돈과 이자를 관리할 수 있어요.</p>
                <Link
                  href="/children/new"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--monari-hero)] px-5 py-2.5 text-[13px] font-bold text-white transition active:scale-[0.97]"
                >
                  <UserPlus size={14} /> 아이 추가하기
                </Link>
              </div>
            )}

            {/* 아이 추가 — 아이가 있을 때만 표시 */}
            {childCount > 0 && (
              <Link
                href="/children/new"
                className="monari-card flex items-center gap-3 px-4 py-3.5 transition active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--monari-hero)] text-[var(--monari-hero)]">
                  <UserPlus size={16} />
                </span>
                <span className="text-[14px] font-bold text-[var(--monari-hero)]">아이 추가하기</span>
                <ChevronRight size={16} className="ml-auto text-[var(--monari-hero)]" />
              </Link>
            )}

            {/* 공동 보호자 — 가족 관리의 일부 */}
            <div className="monari-card divide-y divide-[var(--monari-line)]">
              <SettingsRow
                href="/settings/guardians"
                icon={<Users size={17} />}
                iconBg="var(--monari-surface-soft)"
                iconColor="var(--monari-ink-soft)"
                label="공동 보호자"
                sub="배우자나 다른 보호자 초대"
              />
            </div>
          </div>
        </section>

        {/* ② 금융 */}
        <section className="mb-6">
          <SectionTitle>금융</SectionTitle>
          <div className="mt-3 monari-card divide-y divide-[var(--monari-line)]">
            <SettingsRow
              href="/settings/wallet"
              icon={<Wallet size={17} />}
              iconBg="var(--monari-hero-lo)"
              iconColor="var(--monari-hero)"
              label="부모 지갑"
              sub={formatWon(wallet.balance)}
            />
            <SettingsRow
              href="/settings/allowance"
              icon={<CalendarClock size={17} />}
              iconBg="var(--monari-hero-lo)"
              iconColor="var(--monari-hero)"
              label="정기 용돈"
              sub={ruleCount > 0 ? `활성 ${ruleCount}개` : "규칙 없음"}
            />
            <SettingsRow
              href="/settings/interest"
              icon={<TrendingUp size={17} />}
              iconBg="var(--monari-hero-lo)"
              iconColor="var(--monari-hero)"
              label="이자율 설정"
              sub="기본 이자율 · 최소·최대 범위"
            />
            <SettingsRow
              href="/settings/interest-history"
              icon={<History size={17} />}
              iconBg="var(--monari-hero-lo)"
              iconColor="var(--monari-hero)"
              label="이자 지급 내역"
              sub="월별 이자 지급 기록"
            />
          </div>
        </section>

        {/* ③ 카드 */}
        <section className="mb-6">
          <SectionTitle>카드</SectionTitle>
          <div className="mt-3 monari-card divide-y divide-[var(--monari-line)]">
            <SettingsRow
              href="/cards"
              icon={<CreditCard size={17} />}
              iconBg="var(--monari-hero-lo)"
              iconColor="var(--monari-hero)"
              label="키즈 카드"
              sub="카드 발급 · 사용 내역 조회"
            />
          </div>
        </section>

        {/* ④ 앱 설정 */}
        <section className="mb-6">
          <SectionTitle>앱 설정</SectionTitle>
          <div className="mt-3 monari-card divide-y divide-[var(--monari-line)]">
            <SettingsRow
              href="/settings/subscription"
              icon={isPlusPlan ? <Crown size={17} className="text-yellow-500" /> : <CreditCard size={17} />}
              iconBg="var(--monari-hero-lo)"
              iconColor="var(--monari-hero)"
              label="구독 관리"
              sub={isPlusPlan ? "모나리 플러스 이용 중" : "무료 플랜 · 플러스로 업그레이드"}
            />
            <SettingsRow
              href="/settings/region"
              icon={<MapPin size={17} />}
              iconBg="var(--monari-surface-soft)"
              iconColor="var(--monari-ink-soft)"
              label="거주 지역"
              sub={currentRegion ?? "미설정 · 동네 또래 비교에 사용"}
            />
            <SettingsRow
              href="/settings/notifications"
              icon={<Bell size={17} />}
              iconBg="var(--monari-surface-soft)"
              iconColor="var(--monari-ink-soft)"
              label="알림 설정"
              sub="받을 알림 종류 선택"
            />
          </div>
        </section>

        {/* ⑤ 계정 */}
        <section className="mb-6">
          <SectionTitle>계정</SectionTitle>
          <div className="mt-3 space-y-2">
            {auth.user && (
              <SessionCard
                email={auth.user.email}
                name={auth.profile?.name ? String(auth.profile.name) : String(auth.user.user_metadata?.name ?? "")}
                role={auth.profile?.role ? String(auth.profile.role) : "parent"}
              />
            )}
            <div className="monari-card divide-y divide-[var(--monari-line)]">
              <SettingsRow
                href="/settings/consent-history"
                icon={<FileText size={17} />}
                iconBg="var(--monari-surface-soft)"
                iconColor="var(--monari-ink-soft)"
                label="동의 이력"
              />
            </div>
            {auth.user && auth.profile?.role !== "admin" && <AccountDeletionCard />}
          </div>
        </section>

        {/* ⑥ 지원 */}
        <section className="mb-8">
          <SectionTitle>지원</SectionTitle>
          <div className="mt-3 monari-card divide-y divide-[var(--monari-line)]">
            <SettingsRow
              href="/announcements"
              icon={<Megaphone size={17} />}
              iconBg="var(--monari-surface-soft)"
              iconColor="var(--monari-ink-soft)"
              label="공지사항"
            />
            <SettingsRow
              href="/inquiries"
              icon={<MessageSquare size={17} />}
              iconBg="var(--monari-surface-soft)"
              iconColor="var(--monari-ink-soft)"
              label="문의하기"
            />
          </div>
        </section>

      </PageContent>
    </AppNavShell>
  );
}

function SettingsRow({
  href,
  icon,
  iconBg,
  iconColor,
  label,
  sub,
}: {
  href: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sub?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition active:scale-[0.98]">
      {icon && (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[var(--monari-ink)]">{label}</p>
        {sub && <p className="text-[12px] text-[var(--monari-ink-muted)] truncate">{sub}</p>}
      </div>
      <ChevronRight size={16} className="shrink-0 text-[var(--monari-ink-muted)]" />
    </Link>
  );
}
