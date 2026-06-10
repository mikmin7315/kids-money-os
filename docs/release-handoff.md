# Monari 출시 준비 인수인계

기준 브랜치: `feature/design-system`

AI 후속 작업은 `docs/ai-collaboration.md`의 Codex + Claude Code 협업 원칙을 따른다.

## 현재 완료된 범위

- 상업 출시 수준의 부모·아이 화면 디자인 시스템 적용
- 로그인, 온보딩, 설정, 승인, 약속, 기록, 리포트 UX 개선
- legacy CSS 토큰 호환 매핑 및 모바일 safe-area 대응
- PWA manifest, service worker, 오프라인 fallback 추가
- Capacitor Android/iOS 프로젝트 및 네이티브 shell 추가
- Supabase Realtime 알림 구독과 낙관적 읽음 처리 통합
- 앱 내 계정 삭제, 공개 법적 안내·지원 페이지 구현
- 부모 동의 기록과 동의 전 사용 차단 구현
- 네이티브 Google OAuth 딥링크 처리 구현
- 인증된 금융 페이지의 비공개 캐시 정책과 운영 오류 시 mock 데이터 차단
- 아이 PIN 가족 소유권 검증, 5회 시도 제한, 15분 잠금 구현
- 가족 간 규칙·정책 연결 방지 RLS와 지갑·거래 원장 직접 변조 차단
- 행동 보상·미리쓰기 승인과 금융 부수 효과를 원자적 DB 트랜잭션으로 처리
- 마지막 관리자 강등 방지와 운영 환경의 demo fallback 차단
- Android·iOS·패키지 초기 릴리스 버전 `1.0.0` 정렬
- 전체 lint, TypeScript, Next.js 프로덕션 빌드 통과

## 다음 작업 순서

1. 현재 변경을 검토하고 기능·네이티브·문서 단위로 커밋한다.
2. Supabase 운영 프로젝트에 마이그레이션을 적용한다.
3. 운영 HTTPS URL과 최종 번들 ID를 확정한다.
4. 운영 URL로 Capacitor를 동기화하고 실제 기기 회귀 테스트를 진행한다.
5. 개인정보 처리 안내, 이용약관, 고객지원 페이지의 법률 문구와 고객지원 이메일을 확정한다.
6. 네이티브 OAuth를 실제 기기에서 검증하고 푸시 알림 도입 여부를 확정한다.
7. 스토어 메타데이터와 서명 자료를 준비하고 내부 테스트에 배포한다.

## Supabase 적용

운영 DB에는 기존 스키마 적용 후 아래 마이그레이션이 필요하다.

```text
supabase/release-preflight.sql (읽기 전용 사전검사)
supabase/migrations/add_notifications.sql
supabase/migrations/enable_notifications_realtime.sql
supabase/migrations/add_parent_consent.sql
supabase/migrations/add_child_pin_lockout.sql
supabase/migrations/harden_family_integrity.sql
supabase/migrations/add_atomic_approvals.sql
supabase/migrations/add_admin_role_guard.sql
```

먼저 `supabase/release-preflight.sql`을 Supabase SQL Editor에서 실행한다. 필수 테이블과 Realtime publication은 모두 `true`, 세 중복 검사 결과는 모두 0행이어야 한다. 이후 마이그레이션 파일을 위 순서대로 각각 전체 파일 단위로 실행한다.

`enable_notifications_realtime.sql`은 `notifications` 테이블의 replica identity를 설정하고 `supabase_realtime` publication에 테이블을 추가한다.

적용 후 부모와 아이 계정으로 각각 로그인해 아래 항목을 확인한다.

- 새 알림이 새로고침 없이 표시되는지
- 읽음 처리 후 다른 세션에도 상태가 반영되는지
- 부모가 다른 부모의 알림을 조회하거나 수정할 수 없는지
- 아이 모드에서 선택한 아이의 알림만 보이는지

부모 화면은 Supabase Realtime으로 즉시 갱신됩니다. 아이 모드는 부모 Supabase 세션을 유지하는 현재 인증 구조상 Realtime 행 필터만으로 부모용·형제용 알림을 완전히 격리할 수 없어, 권한 검증된 서버 액션을 15초 간격으로 조회합니다. 아이 전용 Supabase JWT 또는 Broadcast 채널을 도입하기 전까지 이 보안 경계를 유지해야 합니다.

## 검증 명령

```powershell
npm install
npm run verify:release
npm run preflight:release
npm run native:doctor
```

현재 Windows 환경의 확인 결과:

- Next.js lint, TypeScript, 프로덕션 빌드 통과
- 프로덕션 의존성 high/critical 보안 감사 통과
- 스토어 필수 공개 URL과 PWA manifest HTTP 스모크 테스트 통과
- Capacitor Android 진단 통과
- iOS 진단은 Xcode가 없는 Windows 환경이라 실행 불가
- 운영 설정이 확정되기 전 `npm run preflight:release`는 의도적으로 실패하며 누락된 값을 나열
- Supabase CLI가 현재 Windows 환경에 설치되어 있지 않아 마이그레이션 실행 검증은 운영 프로젝트에서 필요

## 네이티브 동기화

운영 URL이 확정된 뒤 실행한다.

```powershell
$env:CAPACITOR_SERVER_URL="https://your-production-domain.com"
npm run native:sync
```

현재 `com.monari.family`은 임시 번들 ID다. 번들 ID를 변경할 경우 Capacitor 설정뿐 아니라 Android namespace/application ID, Java package 경로, iOS bundle identifier를 함께 변경해야 한다.

네이티브 앱은 `native-shell`에 Next.js 정적 파일을 번들링하지 않고 `CAPACITOR_SERVER_URL`의 운영 HTTPS 앱을 로드한다. 따라서 `native-shell/index.html`은 운영 URL 누락 시에만 보이는 안전한 안내 셸이며, 스토어 빌드 전 `npm run preflight:release`와 `npm run native:sync`를 반드시 실행해야 한다.

## 아직 출시를 막는 항목

- 운영 HTTPS URL과 최종 번들 ID 미확정
- 공개 안내 URL은 구현 완료했으며 법률 검토와 `NEXT_PUBLIC_SUPPORT_EMAIL` 확정이 필요
- 계정 삭제 흐름은 구현 완료했으며 운영 Supabase에서 cascade 삭제를 검증해야 함
- 부모 동의 기록·사용 전 게이트는 구현 완료했으며 운영 DB 적용과 아동 개인정보 처리 법률 검토가 필요
- 네이티브 Google OAuth 코드는 구현 완료했으며 Supabase Redirect URL 등록과 실제 기기 검증이 필요
- Android/iOS 스토어 계정, 서명 자료, 실제 기기 테스트 미완료

푸시 알림은 현재 Realtime·아이 모드 polling 알림을 대체하거나 보완하는 후속 기능이며 1.0.0 제출 필수 조건은 아니다.
