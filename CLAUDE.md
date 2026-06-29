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
    login/reset/        # 비밀번호 재설정 이메일 전송
    login/reset/confirm/# 새 비밀번호 설정 (Supabase 이메일 링크 도착 후)
    onboarding/         # 온보딩
    approvals/          # 약속 승인함 + 미리쓰기 상환
    behaviors/          # 행동 약속 설정 (달성률 기반 이자율 반영)
    child/[id]/         # 아이 홈 (C-02)
    child-pin/[id]/     # 아이 PIN 입력
    settings/           # 부모 설정
    settings/children/[id]/ # 아이 수정·삭제
    records/            # 돈 기록
    admin/              # 운영 대시보드
  components/
    finance/            # 금융 관련 폼 컴포넌트
  lib/
    supabase/           # Supabase 클라이언트, 서버 액션
supabase/
  functions/
    monthly-settlement/ # 월말 이자율 정산 (매월 1일 00:05 UTC)
    process-allowances/ # 정기 용돈 배치 (매일 15:05 UTC = KST 00:05)
  cron.sql              # 크론 등록 스크립트 (vault 기반 x-cron-secret 포함)
  migrations/           # 순차 적용 SQL 파일 (수동 SQL Editor 실행 방식)
```

## 핵심 비즈니스 로직

### 인증 흐름
- 부모/어드민: Supabase Auth → `requireParentSession()` (role = parent|admin)
- 아이 모드: 부모 세션 유지 + `child_mode` httpOnly 쿠키 (8시간)
- 아이 PIN: scrypt 해시 (salt:hash 저장, timingSafeEqual 검증)

### 이자율 엔진
- `behavior_rules.rule_category`: `recurring`(달성률 기준) / `monthly_goal`(1회 달성)
- `behavior_rules.monthly_target_rate`: recurring 규칙의 달성 임계율 (기본 80%)
- 월말 정산: Edge Function `monthly-settlement` (매월 1일 00:05 UTC, KST 09:05)
  - 이전 달 KST 기준 행동 달성률 계산 → `interest_rate_events` 삽입
  - DB 트리거 `on_interest_rate_event` → `wallet_snapshots.current_interest_rate` 자동 갱신

### 정기 용돈 배치
- Edge Function `process-allowances` (매일 15:05 UTC = KST 00:05)
- `process_scheduled_allowances(date)` RPC: 부모 지갑 차감 → 아이 계좌 입금 (멱등)
- 실패 시 `allowance_executions.status = 'failed'` + 부모 알림 생성

### 미리쓰기 상환
- `repay_borrow_installment(uuid)` RPC: 회차별 원자적 상환
- 전체 회차 완료 시 `borrow_requests.status = 'repaid'` 자동 전환

### 아이 소프트 삭제
- `delete_child(uuid)` RPC: `children.deleted_at = now()`
- `get_app_data_bundle` 및 children RLS(`children_select_by_parent`)에서 자동 제외
- insert/update는 별도 정책(`children_insert_by_parent`, `children_update_by_parent`)으로 허용

### 보안 규칙
- 미리쓰기 이자율은 클라이언트에서 받지 않음 — 서버에서 `interestPolicies.baseInterestRate`로 계산
- `createBorrowRequestAction`은 `interestRate` 파라미터 없음
- 계좌번호는 화면에 마지막 4자리만 표시 (`maskAccountNumber()`)
- `behavior-photos` 버킷은 private — 조회는 signed URL(`getBehaviorPhotoUrl()`)만 허용

### 크론 보안
- Edge Function은 `CRON_SECRET` 환경변수 설정 시 `x-cron-secret` 헤더 검증
- cron.sql에서 vault의 `cron_secret` 값을 헤더로 전달
- Supabase vault에 `cron_secret`, `supabase_url`, `supabase_service_role_key` 저장 필요

## 브랜치 전략 (AI 협업)

```
master          ← stable, PR merge 대상
  └─ feature/design-system     ← Claude Code 담당
  └─ feature/notifications     ← Codex 담당
  └─ feature/...
```

- **Claude Code**: 디자인 시스템, UI 개선, 복잡한 비즈니스 로직
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
- `CRON_SECRET` (Edge Function 크론 인증, Supabase vault `cron_secret`과 동일 값)

## 마이그레이션 적용 순서 (수동 SQL Editor)

1. `schema.sql` — 전체 스키마 기준 (새 환경 초기화용)
2. `add_behavior_photo.sql` — behavior-photos private 버킷
3. `add_parent_wallet.sql` — 부모 지갑
4. `harden_wallet_and_interest_confirmation.sql` — 보안 강화
5. `p0_backend_hardening.sql` — RLS/cash_spend_requests
6. `interest_rate_monthly_system.sql` — rule_category/monthly_target_rate
7. `p0_remaining_features.sql` — repay/process_allowances/update_child/delete_child
8. `p0_hardening.sql` — get_app_data_bundle/children RLS 분리
9. `cron.sql` — 크론 등록 (pg_cron/pg_net 활성화 후)
10. `p1_settlement_runs.sql` — settlement_runs/settlement_child_runs + run_monthly_settlement RPC
11. `p1_charge_audit_log.sql` — parent_wallet_charges 감사 컬럼 + approve/reject RPC 업데이트
12. `announcements.sql` — announcements/announcement_reads 테이블 (공지/점검 시스템)

## 코드 규칙

- 서버 액션은 `src/actions/` 하위 (finance.ts / management.ts / admin.ts 등)
- 컴포넌트는 `'use client'` 명시 필수
- DB 직접 조작 금지 — 반드시 서버 액션 경유
- 주석 최소화 (WHY가 비명백한 경우만)
- `.claude/worktrees/distracted-lehmann-9f5767` 는 절대 수정/스테이징 금지
