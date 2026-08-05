# Settings IA Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/settings` 허브 페이지를 4섹션에서 5섹션으로 재편하고, REGIONS 상수를 공유 파일로 추출한다.

**Architecture:** `src/app/settings/page.tsx` 하나를 수정해 섹션 구조를 재배치한다. 부모 지갑 잔액은 기존 `getParentWalletAction()`을 settings 페이지에서도 호출해 서브텍스트에 표시한다. REGIONS 배열은 `src/lib/regions.ts`로 추출해 settings/region과 onboarding 두 곳에서 공유한다.

**Tech Stack:** Next.js 16 App Router (서버 컴포넌트), TypeScript, Tailwind CSS, `@/actions/parent-wallet`, `@/lib/data`, `@/lib/format`

## Global Constraints

- 모든 하위 라우트 URL 변경 없음 (`/settings/*` 유지)
- `'use client'` 컴포넌트에는 표시 필수
- DB 직접 조작 금지 — 서버 액션 경유
- `.claude/worktrees/distracted-lehmann-9f5767` 절대 수정·스테이징 금지
- 주석 최소화 (WHY가 비명백한 경우만)

---

## File Map

| 동작 | 경로 | 역할 |
|---|---|---|
| **수정** | `src/app/settings/page.tsx` | 5섹션 재배치 + 잔액·규칙 수 서브텍스트 |
| **신규** | `src/lib/regions.ts` | REGIONS 배열 단일 출처 |
| **수정** | `src/app/settings/region/page.tsx` | REGIONS import → lib |
| **수정** | `src/components/onboarding/complete-flow.tsx` | REGIONS import → lib |

---

## Task 1: settings 허브 5섹션 재배치

**Files:**
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `getParentWalletAction()` → `{ balance: number, bankName: string|null, ... }` (from `@/actions/parent-wallet`)
- Consumes: `bundle.allowanceRules` → `AllowanceRule[]` (from `getAppDataBundle()`)
- Consumes: `formatWon(n: number)` → `string` (from `@/lib/format`)

- [ ] **Step 1: 현재 파일 확인**

  `src/app/settings/page.tsx` 현재 279줄. 변경 전 구조:
  - ① 가족 (L63–L129)
  - ② 금융 설정 (L131–L168)
  - ③ 계정 (L170–L208): 구독·지역·알림·세션
  - ④ 정보·지원 (L210–L239): 공지·문의·동의이력·계정삭제

- [ ] **Step 2: import 추가 및 데이터 페칭 수정**

  파일 상단 import 블록에 두 줄 추가:
  ```tsx
  import { getParentWalletAction } from "@/actions/parent-wallet";
  import { formatWon } from "@/lib/format";
  ```

  컴포넌트 내 데이터 페칭을 병렬로 변경 (L33–L34 교체, L32의 `requireParentSession` 유지):
  ```tsx
  const [bundle, wallet] = await Promise.all([
    getAppDataBundle(),
    getParentWalletAction(),
  ]);
  const childCount = bundle.children.length;
  const ruleCount = bundle.allowanceRules.length;
  ```

- [ ] **Step 3: 5섹션 JSX 작성**

  `<PageContent className="pt-5">` 안의 섹션 전체를 아래로 교체:

  ```tsx
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
                  className="inline-flex h-8 items-center gap-1 rounded-[10px] bg-[var(--monari-plus-bg)] px-3 text-[12px] font-bold text-[var(--monari-hero)]"
                >
                  통장 보기
                </Link>
                <Link
                  href={`/settings/children/${child.id}`}
                  className="inline-flex h-8 items-center rounded-[10px] bg-[var(--monari-surface-soft)] px-3 text-[12px] font-bold text-[var(--monari-ink-soft)]"
                >
                  수정
                </Link>
              </div>
            </div>
          );
        })}

        {childCount === 0 && (
          <div className="monari-card px-4 py-5 text-center">
            <p className="text-[14px] font-extrabold text-[var(--monari-ink)]">아직 아이가 없어요</p>
            <p className="mt-1 text-[12px] text-[var(--monari-ink-muted)]">아이를 등록하면 용돈과 이자를 관리할 수 있어요.</p>
          </div>
        )}

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

    {/* ③ 앱 설정 */}
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

    {/* ④ 계정 */}
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

    {/* ⑤ 지원 */}
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
  ```

- [ ] **Step 4: 빌드 확인**

  ```bash
  npm run build
  ```
  Expected: 에러 없이 빌드 완료. TypeScript 타입 에러 없음.

- [ ] **Step 5: 커밋**

  ```bash
  git add src/app/settings/page.tsx
  git commit -m "feat: reorganize settings hub into 5 sections (가족/금융/앱설정/계정/지원)"
  ```

---

## Task 2: REGIONS 상수 공유 파일 추출

**Files:**
- Create: `src/lib/regions.ts`
- Modify: `src/app/settings/region/page.tsx`
- Modify: `src/components/onboarding/complete-flow.tsx`

**Interfaces:**
- Produces: `REGIONS: readonly string[]` (exported from `src/lib/regions.ts`)
- Consumes (region page): `REGIONS` passed as `regions` prop to `<RegionForm regions={REGIONS} />`
- Consumes (complete-flow): `REGIONS` used inline in JSX button list

- [ ] **Step 1: `src/lib/regions.ts` 생성**

  ```ts
  export const REGIONS = [
    "서울특별시",
    "부산광역시",
    "인천광역시",
    "대구광역시",
    "대전광역시",
    "광주광역시",
    "울산광역시",
    "세종특별자치시",
    "경기도",
    "강원도",
    "충청북도",
    "충청남도",
    "전라북도",
    "전라남도",
    "경상북도",
    "경상남도",
    "제주특별자치도",
  ] as const;
  ```

- [ ] **Step 2: `settings/region/page.tsx` 수정**

  파일 상단 import 추가:
  ```tsx
  import { REGIONS } from "@/lib/regions";
  ```

  파일에서 `const REGIONS = [...]` 블록(L10–L28) 전체 삭제.

  `<RegionForm>` 호출 부분은 그대로 유지:
  ```tsx
  <RegionForm currentRegion={currentRegion} regions={REGIONS} />
  ```

- [ ] **Step 3: `complete-flow.tsx` 수정**

  파일 상단 import 추가:
  ```tsx
  import { REGIONS } from "@/lib/regions";
  ```

  파일에서 `const REGIONS = [...]` 블록(L8–L13) 전체 삭제. JSX 내 `REGIONS.map(...)` 사용은 그대로 유지.

- [ ] **Step 4: 빌드 확인**

  ```bash
  npm run build
  ```
  Expected: 에러 없이 빌드 완료.

- [ ] **Step 5: 커밋**

  ```bash
  git add src/lib/regions.ts src/app/settings/region/page.tsx src/components/onboarding/complete-flow.tsx
  git commit -m "refactor: extract REGIONS constant to src/lib/regions.ts"
  ```
