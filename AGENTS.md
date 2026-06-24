# Monari — 어린이 금융교육 앱

Next.js 16 App Router + Supabase + TypeScript. `src/` 구조.

## 기술 스택

- **Frontend**: Next.js 16 App Router, React 19, TypeScript
- **Backend**: Supabase (Auth, DB, Edge Functions)
- **Styling**: Tailwind CSS, lucide-react
- **배포**: Vercel (예정)

## 프로젝트 구조

```
src/
  app/                  # Next.js App Router 페이지
    page.tsx            # 부모 홈 (P-12)
    login/              # 로그인/회원가입
    onboarding/         # 온보딩
    approvals/          # 약속 승인함
    behaviors/          # 행동 약속 설정
    child/[id]/         # 아이 홈 (C-02)
    child-pin/[id]/     # 아이 PIN 입력
    settings/           # 부모 설정
    records/            # 돈 기록
    admin/              # 운영 대시보드
  components/
    finance/            # 금융 관련 폼 컴포넌트
  lib/
    supabase/           # Supabase 클라이언트, 서버 액션
supabase/
  functions/            # Edge Functions (monthly-settlement 등)
  cron.sql              # 크론 설정
```

## 핵심 비즈니스 로직

### 인증 흐름
- 부모/어드민: Supabase Auth → `requireParentSession()` (role = parent|admin)
- 아이 모드: 부모 세션 유지 + `child_mode` httpOnly 쿠키 (8시간)
- 아이 PIN: scrypt 해시 (salt:hash 저장, timingSafeEqual 검증)

### 이자율 엔진
- `behavior_logs` 승인 → `interest_rate_events` 삽입
- DB 트리거 `on_interest_rate_event` → `wallet_snapshots.current_interest_rate` 자동 갱신
- 월말 정산: Edge Function `monthly-settlement` (매월 1일 00:05 UTC)

### 보안 규칙
- 미리쓰기 이자율은 클라이언트에서 받지 않음 — 서버에서 `interestPolicies.baseInterestRate`로 계산
- `createBorrowRequestAction`은 `interestRate` 파라미터 없음

## 브랜치 전략 (AI 협업)

```
master          ← stable, PR merge 대상
  └─ feature/claude-*     ← Claude Code 작업 브랜치
  └─ feature/codex-*      ← Codex 작업 브랜치
```

- **Claude Code**: 디자인 시스템, 새 페이지 라우트, 복잡한 비즈니스 로직, Supabase 마이그레이션 설계
- **Codex**: 반복적 CRUD 액션, 삭제/수정 기능, TypeScript 타입 보강, 테스트 작성

---

## Codex 작업 요청 목록

`feature/codex-crud` 브랜치에서 작업 후 master로 PR 올려주세요.

### 1. 삭제 서버 액션 (`src/actions/management.ts`에 추가)

```typescript
deleteAllowanceRuleAction(ruleId: string): Promise<ActionResult<void>>
deleteInterestPolicyAction(policyId: string): Promise<ActionResult<void>>
deleteBehaviorRuleAction(ruleId: string): Promise<ActionResult<void>>
toggleBehaviorRuleAction(ruleId: string, isActive: boolean): Promise<ActionResult<void>>
```

패턴: `requireParentSession()` → `isDemoMode()` 체크 → Supabase delete → `revalidatePath("/settings")`

### 2. 삭제 UI (`src/components/finance/management-forms.tsx`)

용돈 규칙·이자 정책·행동 약속 각 리스트 아이템에 휴지통 버튼 추가.
삭제 전 `window.confirm` 또는 인라인 confirm 상태로 확인 받기.

### 3. 타입 보강 (`src/lib/types.ts`)

- `BorrowRequest`에 `repaidAt?: string` 추가
- `AllowanceRule`에 `deletedAt?: string` 추가 (soft delete 고려)

### 4. 코드 규칙

- 서버 액션은 `requireParentSession()` 필수, `auth.user` null guard 필수
- `isDemoMode()` true일 때 mock 성공 리턴 (UI 테스트 가능하게)
- `revalidatePath("/settings")` 호출로 캐시 무효화

## 개발 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 빌드
npm run lint     # 린트
```

## 환경 변수

`.env.local` 필요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 코드 규칙

- 서버 액션은 `src/lib/supabase/actions/` 하위
- 컴포넌트는 `'use client'` 명시 필수
- DB 직접 조작 금지 — 반드시 서버 액션 경유
- 주석 최소화 (WHY가 비명백한 경우만)
