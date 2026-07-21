# Monari 릴리스 인수인계

이 문서는 운영 배포 전에 Codex, Claude Code, 운영자가 같은 기준으로 확인할 수 있도록 정리한 최종 릴리스 체크리스트입니다.

## 현재 완료된 범위

- 부모 앱, 아이 앱, 관리자 앱의 주요 화면 라우트 구현
- Supabase Auth 기반 부모/관리자 인증
- 부모 세션 기반 아이 모드와 4자리 PIN 진입 흐름
- 용돈, 지출, 저금, 꺼내기, 빌리기, 갚기, 이자 거래 흐름
- 행동 약속 생성, 아이 수행 기록, 부모 승인/거절 흐름
- 행동 보상과 이자율 이벤트 반영
- 월말 정산 Edge Function 구성
- 카드 신청, 상태, 거래 내역, 한도, 분실/재발급, 관리자 카드 관리 화면
- 공지, 문의, 알림, 약관/동의, 계정 삭제, 세션/감사 로그 관리 화면
- PWA manifest, 서비스 워커, 오프라인 fallback
- Capacitor Android/iOS 프로젝트 기본 구성
- 린트, 타입체크, Next.js production build, smoke test, production dependency audit 통과

## 배포 전 필수 확인

로컬 또는 CI에서 먼저 아래 명령을 실행합니다.

```powershell
npm install
npm run verify:release
npm run pre-promote
```

`verify:release`는 다음을 확인합니다.

- ESLint
- TypeScript
- Next.js production build
- 주요 공개 페이지 smoke test
- 운영 dependency high 이상 취약점 audit

`pre-promote`는 다음 Supabase 조건을 읽기 전용으로 확인합니다.

- 필수 backend 환경변수 설정
- service role 인증 가능 여부
- 필수 테이블 존재 여부
- 마이그레이션 필수 컬럼 존재 여부
- 필수 RPC 존재 여부

## Supabase 운영 DB 확인

운영 DB에서는 먼저 아래 파일을 Supabase SQL Editor에서 실행합니다.

```text
supabase/release-preflight.sql
```

결과 기준:

- 필수 테이블 체크가 모두 `true`
- Realtime publication 체크가 모두 `true`
- 중복 데이터 검사 결과가 모두 0행
- 관리자 계정이 최소 1개 이상 존재
- 운영에 필요한 마이그레이션이 모두 적용됨

필요 시 아래 마이그레이션을 파일 단위로 순서대로 적용합니다.

```text
supabase/migrations/add_notifications.sql
supabase/migrations/enable_notifications_realtime.sql
supabase/migrations/add_parent_consent.sql
supabase/migrations/add_child_pin_lockout.sql
supabase/migrations/harden_family_integrity.sql
supabase/migrations/add_atomic_approvals.sql
supabase/migrations/add_admin_role_guard.sql
supabase/migrations/harden_wallet_and_interest_confirmation.sql
supabase/migrations/fix_borrow_repaid_at.sql
supabase/migrations/card_disputes_and_reconsent.sql
```

## Vercel 확인

Vercel 프로젝트에는 최소 아래 환경변수가 설정되어 있어야 합니다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

배포 후 실제 URL에서 아래 항목을 확인합니다.

- Google 로그인 시작 및 `/auth/callback` 복귀
- 이메일 로그인
- 부모 홈 진입
- 아이 PIN 진입
- 관리자 로그인 및 대시보드 진입
- `/support`, `/legal/privacy`, `/legal/terms`, `/account-deletion` 공개 페이지 접근

## 권한별 수동 QA

### 부모 계정

- 아이 프로필 생성/수정
- 용돈 규칙 생성/수정/삭제
- 이자 정책 생성/수정/삭제
- 행동 약속 생성/활성화/비활성화/삭제
- 아이 행동 기록 승인/거절
- 빌리기 요청 승인/거절
- 지출, 저금, 꺼내기, 용돈 지급 기록 생성
- 알림 확인 및 읽음 처리
- 동의 이력 확인

### 아이 모드

- PIN 4자리 입력 성공
- 잘못된 PIN 입력 시 실패 처리
- PIN 미설정 아이의 바로 입장 흐름
- 잔액/기록/약속/이자/카드/공지 화면 이동
- 현금 기록 생성
- 빌리기 요청 생성
- 제한 상태 화면 확인

### 관리자

- 부모/아이/거래/지갑 조회
- 카드 신청/카드 상세/거래 상세/분쟁 관리
- 재동의 캠페인 관리
- 세션/감사 로그 확인
- 공지/알림 템플릿/알림 로그 확인
- 출시 제어와 제한 정책 확인

## 네이티브 앱 확인

운영 HTTPS URL이 확정되면 Capacitor 서버 URL을 맞춘 뒤 동기화합니다.

```powershell
$env:CAPACITOR_SERVER_URL="https://your-production-domain.com"
npm run native:sync
npm run native:doctor
```

실제 기기에서는 `docs/android-device-smoke.md` 기준으로 확인합니다.

## 아직 사람이 확인해야 하는 항목

- 운영 Supabase SQL Editor에서 `release-preflight.sql` 실행 결과
- 운영 Google OAuth Redirect URL 등록 상태
- 실제 부모/아이/관리자 계정으로 주요 버튼 클릭 QA
- 월말 정산 Edge Function의 운영 secret 설정과 호출 결과
- Android/iOS 스토어 계정, 서명 자료, 실제 기기 테스트

## Claude Code에 넘길 때 요약

```text
Monari 릴리스 후속 QA 요청:

1. docs/release-handoff.md 기준으로 운영 배포 전 수동 QA를 진행해주세요.
2. Supabase SQL Editor에서 supabase/release-preflight.sql 결과를 확인해주세요.
3. 실제 Vercel URL에서 Google 로그인, 부모 홈, 아이 PIN, 관리자 진입을 확인해주세요.
4. 카드/용돈/이자/승인/정산 흐름을 실제 데이터로 E2E 확인해주세요.
5. 코드 구현 누락보다는 운영 환경/권한별 실사용 QA 중심으로 봐주세요.
```
