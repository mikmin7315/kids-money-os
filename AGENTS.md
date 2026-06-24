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
  └─ feature/design-system     ← Codex 담당
  └─ feature/notifications     ← Codex 담당
  └─ feature/...
```

- **Codex**: 디자인 시스템, UI 개선, 복잡한 비즈니스 로직
- **Codex**: 반복적 기능 구현, 테스트 작성, 타입 개선

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
