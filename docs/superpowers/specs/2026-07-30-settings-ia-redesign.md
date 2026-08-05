# Settings IA Redesign

## Goal

`/settings` 허브 페이지의 섹션 구조를 4개에서 5개로 재편해, 각 섹션이 단일 의미를 갖도록 한다. URL은 변경 없음.

## Problem

현재 `/settings` 허브의 **계정** 섹션에 구독(상업), 지역(프로필), 알림(앱 설정), 로그아웃(보안)이 뒤섞여 있고, **정보·지원** 섹션에 공지/문의와 계정 삭제가 혼재한다. 사용자가 특정 설정을 찾을 때 어느 섹션을 봐야 하는지 불명확하다.

## Architecture

- `/settings/page.tsx` (서버 컴포넌트): 5개 섹션으로 재배치. 허브에 잔액·규칙 수·플랜·지역 등 컨텍스트 서브텍스트 추가.
- `RegionForm` 컴포넌트: `/settings/region`과 온보딩 `CompleteFlow`에서 공유.
- `/settings/children/[id]`: 상단에 백 네비게이션 추가.
- 모든 하위 라우트 URL 유지.

## Hub Page — 5-Section Layout

```
/settings
│
├── 가족
│   ├── 아이 카드 × N         (이름, 나이 | 통장보기 / 수정)
│   ├── 아이 추가하기          → /children/new
│   └── 공동 보호자            서브텍스트: 초대된 보호자 수
│
├── 금융
│   ├── 부모 지갑              서브텍스트: 현재 잔액 (₩XX,XXX)
│   ├── 정기 용돈              서브텍스트: 활성 규칙 N개 또는 "규칙 없음"
│   ├── 이자율 설정            → /settings/interest
│   └── 이자 지급 내역         → /settings/interest-history
│
├── 앱 설정
│   ├── 구독 관리              서브텍스트 배지: "무료 플랜" | "Monari+"
│   ├── 거주 지역              서브텍스트: 현재 지역 또는 "미설정"
│   └── 알림 설정              → /settings/notifications
│
├── 계정
│   ├── [세션 카드]            이메일 표시 + 로그아웃 버튼
│   ├── 동의 이력              → /settings/consent-history
│   └── [계정 삭제 카드]       관리자(admin) 역할 제외
│
└── 지원
    ├── 공지사항               → /announcements
    └── 문의하기               → /inquiries
```

## Sub-Page Changes

### RegionForm 컴포넌트 공유

- `src/components/settings/region-form.tsx` 신규 생성
- 17개 시/도 목록, 선택 상태, 저장 액션을 담은 순수 클라이언트 컴포넌트
- `/settings/region/page.tsx`: 이 컴포넌트 사용
- `src/components/onboarding/complete-flow.tsx`: 인라인 지역 목록 제거 → 이 컴포넌트 사용

### 아이 프로필 백 네비게이션

- `/settings/children/[id]/page.tsx` 상단에 `← 설정` 링크 추가
- href: `/settings`

### 변경 없는 하위 페이지

`/settings/allowance`, `/settings/interest`, `/settings/interest-history`,
`/settings/notifications`, `/settings/consent-history`,
`/settings/guardians`, `/settings/guardians/[id]`,
`/settings/wallet`, `/settings/subscription`

## Route Map (변경 없음)

| 현재 URL | 변경 | 비고 |
|---|---|---|
| `/settings` | 섹션 재배치 | 핵심 변경 |
| `/settings/region` | RegionForm 컴포넌트 교체 | 기능 동일 |
| `/settings/children/[id]` | 백 네비게이션 추가 | 소규모 |
| 기타 모든 하위 라우트 | 변경 없음 | |

## Inline Context Data

허브 페이지 서버 컴포넌트에서 추가로 조회할 데이터:

| 항목 | 출처 | 표시 위치 |
|---|---|---|
| 부모 지갑 잔액 | `get_app_data_bundle` 또는 wallet 직접 조회 | 부모 지갑 행 서브텍스트 |
| 정기 용돈 활성 규칙 수 | `get_app_data_bundle` | 정기 용돈 행 서브텍스트 |
| 구독 플랜 | `profiles.subscription_tier` 또는 기존 auth 데이터 | 구독 관리 배지 |
| 거주 지역 | `auth.profile.region` | 거주 지역 서브텍스트 |
| 공동 보호자 수 | 별도 쿼리 또는 `get_app_data_bundle` 확장 | 공동 보호자 서브텍스트 |

## Out of Scope

- 하위 페이지 비주얼 리뉴얼 (레이아웃·색상 등)
- 구독 결제 내역 구현 (현재 "준비 중")
- 지갑 충전 계좌 실 연동
- 행동약속(`/behaviors`) → 설정 이동 여부 (별도 논의 필요)
