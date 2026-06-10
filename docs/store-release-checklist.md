# Monari 스토어 출시 체크리스트

## 현재 구조

Monari는 Next.js 서버 액션과 Supabase 인증을 사용합니다. 네이티브 앱은 Capacitor 안에서 배포된 HTTPS 운영 앱을 로드합니다.

스토어 빌드 전 반드시 `CAPACITOR_SERVER_URL`을 실제 운영 URL로 설정합니다.

```powershell
$env:CAPACITOR_SERVER_URL="https://your-production-domain.com"
npm run native:sync
npm run verify:store
```

## 공통 필수 준비

- 최종 번들 ID 확정 (`com.monari.family`은 임시값)
- 운영 도메인과 모니터링 구성
- 개인정보 처리 안내 및 이용약관 공개 URL의 법률 검토
- `NEXT_PUBLIC_SUPPORT_EMAIL` 설정 및 고객지원 웹페이지 확인
- 앱 안에서 계정 삭제를 요청하거나 완료할 수 있는 흐름 및 운영 DB 검증
- 구현된 부모 동의 기록·사용 전 게이트의 운영 DB 적용 및 아동 개인정보 처리·대상 연령 법률 검토
- 실제 기기에서 로그인, PIN, 승인, 기록, 알림 흐름 테스트
- Supabase Redirect URL에 `com.monari.family://auth/callback` 등록 및 네이티브 Google OAuth 실제 기기 테스트
- 스토어용 앱 아이콘, 스크린샷, 설명, 키워드
- 1.0.0 이후 네이티브 기능 추가 권장: 푸시 알림 또는 생체 인증

## Google Play

- Google Play Console 개발자 계정
- Android Studio 및 JDK 설치
- 서명용 upload key 생성 및 안전한 보관
- AAB 릴리스 빌드
- Data safety 양식 작성
- 콘텐츠 등급 및 대상 연령 설정
- 내부 테스트, 비공개 테스트, 프로덕션 순서로 배포

## Apple App Store

- Apple Developer Program 계정
- macOS와 Xcode
- App Store Connect 앱 생성
- 배포 인증서 및 provisioning profile
- App Privacy 작성
- 연령 등급 설정
- TestFlight 내부 테스트 후 심사 제출

## 현재 남은 출시 차단 요소

- 실제 운영 HTTPS URL 미확정
- 최종 번들 ID 미확정
- Supabase 운영 프로젝트에 `docs/release-handoff.md`에 나열된 전체 마이그레이션 미적용
- 공개 안내 URL 법률 검토 및 고객지원 이메일 확정 미완료
- 앱 내부 계정 삭제 흐름의 운영 DB cascade 검증 미완료
- Google Play 및 Apple Developer 계정/서명 자료 없음
- Android 실제 기기 및 AAB 릴리스 검증 미완료
- iOS 빌드는 macOS와 Xcode가 필요
- 네이티브 Google OAuth 외부 설정·실제 기기 검증 미완료

`npm run preflight:release`는 운영 환경 변수, 번들 ID, 네이티브 OAuth 딥링크, cleartext 설정의 불일치를 차단합니다. 최종 번들 ID를 `RELEASE_BUNDLE_ID`에 설정하고 Supabase Redirect URL 등록 후 `SUPABASE_REDIRECT_URLS_CONFIRMED=true`로 표시합니다.

상세 인수인계와 적용 순서는 `docs/release-handoff.md`를 참고합니다.
