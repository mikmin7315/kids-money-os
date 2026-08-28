# MONARI PRODUCT STRATEGY V3.1
## 대표 피드백 반영 전략 수정본

> **작성일**: 2026-08-28  
> **기준 문서**: MONARI_PRODUCT_STRATEGY_V3.md (보존됨)  
> **변경 성격**: 핵심 가정 및 MVP 우선순위 재정의  
> **상태**: 대표 승인 대기 — 승인 전 코드/DB 수정 없음

---

## V3 대비 핵심 변경 요약

| 항목 | V3 | V3.1 |
|---|---|---|
| Toss 경쟁 구도 | "17세 이상 대상, 비경쟁" | 7-18세 구간에서 실제 경쟁 |
| Killer Feature | Goal Saving | Family Money → Child Habit Loop 전체 |
| Core Loop | 8단계 일반 | 9단계 + MVP 기능 매핑 |
| 이자율 UX | 그대로 노출 | 아이에게는 "기본이자 + 보너스이자"로 단순화 |
| Family 아키텍처 | Phase 2 설계 | **Phase 1에서 DB/Domain 설계 (UI는 Phase 2)** |
| Goal Sponsorship | 단순 후원 | Matching Contribution 모델 |
| Money Score | App 사용량 포함 | 실제 금융행동만 평가 |
| Peer Benchmark | 초기 Plus 핵심 | 데이터 충분 후 Premium Feature로 성장 |
| Plus Paywall | 목표 개수 제한 | Core Loop 체험은 Free, 인사이트는 Plus |
| Phase 2 명칭 | Real Money Flow | Financial Infrastructure Validation |
| Card 진입조건 | 사용자 1만 명 | 다차원 Go/No-Go 기준 |
| North Star | 월 2회 앱 사용 아이 수 | WAFK (주 1회 의미있는 금융행동 수행 아이) |

---

# PART 1: Current Product Audit

V3 내용을 기준으로 유지. 아래 사항만 추가.

## 핵심 구조 갭 재확인 (우선순위 재정렬)

| 갭 | V3 우선순위 | V3.1 우선순위 | 이유 |
|---|---|---|---|
| goals 테이블 없음 | P0 | **P0** | Core Loop Step 2, 4의 선결 조건 |
| 아이 Home 재설계 | P0 | **P0** | Core Loop 진입점 |
| Family 데이터 구조 | Phase 2 | **P0 (DB/Domain만)** | 이후 모든 확장의 기반 |
| 아이 바텀탭 | P0 | **P0** | Loop 탐색의 물리적 구조 |
| Push Notification 완성 | P1 | **P0** | Loop 재진입 트리거 |
| Money Score 재설계 | P1 | P1 | 동일 |
| Peer Benchmark 강화 | P1 | **P2** | 데이터 충분 후 |
| Gift Giver UI | Phase 2 | Phase 2 | 동일 (DB만 Phase 1) |

---

# PART 2: Competitive Gap Analysis (개정)

## 중요 안내: VERIFIED / UNVERIFIED 표기

경쟁사 정보는 공개 자료 기준. 서비스는 지속 변화하므로 출시 전 재검증 필수.

- **[V]** = 공식 자료 또는 공개 정보로 확인 가능한 사실
- **[U]** = 확인 불가 또는 변경 가능성 있음. 전략적 추정 목적으로만 사용

---

## 토스 틴즈 / 토스 유스카드 (핵심 경쟁사 재정의)

**V3 오류 수정**: V3는 "토스는 17세 이상 대상"이라고 전제했으나, 토스는 어린이·청소년 시장을 이미 적극 공략 중이다. Monari는 7-18세 구간에서 토스와 **실제 경쟁** 관계에 있다.

| 항목 | 토스 | Monari 현재 | Monari 목표 |
|---|---|---|---|
| 청소년 카드 [V] | ✅ 존재 | ❌ mock | Phase 3 |
| 청소년 전용 앱 [U] | 별도 또는 통합 | ✅ 전용 앱 | 유지 |
| 목표저축 [U] | 제공 여부 불명확 | ⚠️ 미구현 | P0 |
| 금융습관 분석 [U] | 제한적으로 추정 | ✅ 구현됨 | Core |
| 행동→이자율 시스템 [V] | ❌ | ✅ | Core |
| 가족 네트워크 [U] | 제한적으로 추정 | ⚠️ 공동보호자만 | Phase 2 |
| 부모 코칭 [U] | 미제공으로 추정 | ✅ 부분 구현 | Core |
| 또래 비교 [U] | 미제공으로 추정 | ✅ 인프라 완성 | Plus |

**핵심 전략 시사점**:  
토스가 강한 영역 = 카드, 결제, 간편 UX, 브랜드 신뢰도.  
Monari가 강한 영역 = 행동→이자율 Loop, 가족 단위 금융 설계, 부모 코칭, 습관 분석.  
단기 차별화는 UX 우위가 아닌 **"가족 금융교육 Loop"**에서 만들어야 한다.

---

## 카카오뱅크 mini

| 항목 | 확인 여부 | 내용 |
|---|---|---|
| 실물 카드 발급 | [V] | 존재 |
| 저금통 (목표저축) | [V] | 존재 |
| 가입 연령 | [V] | 7세 이상, 법정대리인 동의 |
| 부모 코칭 | [U] | 미제공으로 추정 |
| 행동 미션 연동 | [U] | 제한적 또는 없음으로 추정 |
| 금융습관 리포트 | [U] | 미제공으로 추정 |

**핵심 학습**: mini의 목표저축은 이미 시장에서 검증된 기능. Goal Saving 자체는 차별화가 아니다.  
Monari의 차별화는 **Goal이 Mission, 이자율, 가족 참여와 연결되는 방식**에 있다.

---

## 아이부자 (하나은행)

| 항목 | 확인 여부 | 내용 |
|---|---|---|
| 부모↔아이 연결 | [V] | 존재 |
| 용돈 보내기 | [V] | 존재 |
| 행동 미션 | [V] | 존재 (기본 수준) |
| 이자율 연동 | [U] | 미연동으로 추정 |
| 금융습관 분석 | [U] | 제한적으로 추정 |
| 실제 은행 계좌 연동 | [V] | 존재 (하나은행) |

**핵심 갭**: 아이부자는 은행의 인프라를 갖추었으나 **심층 금융습관 Loop가 없다**.  
Monari의 차별화는 이 Loop에서 만들어진다.

---

## 경쟁 구도 재정의

```
Monari vs 토스 : 7-18세 전 구간에서 경쟁. 
                  토스는 카드/결제, Monari는 습관/교육에서 우위.

Monari vs mini : 목표저축 기능 겹침.
                  mini는 카드, Monari는 Mission-Goal 연결에서 우위.

Monari vs 아이부자 : 부모-아이 연결 영역 겹침.
                      아이부자는 실제 은행, Monari는 깊은 습관 Loop에서 우위.
```

**Launch Core Target**: 초등학생 + 부모 (7-12세)  
**Architecture Target**: 7-18세 전 연령 확장 가능한 구조

---

# PART 3: Revised Product Positioning

## 수정된 한 줄 포지션

> **"아이가 처음 돈을 받는 순간부터 스스로 관리하게 될 때까지,  
> 가족이 함께 만드는 금융 성장 기록"**

V3의 포지션을 유지하되, "첫 금융생활"이 아닌 **"금융 성장 기록"**으로 강조점 이동.  
이유: Toss가 "첫 금융생활" 포지션을 이미 강하게 선점할 수 있음.  
Monari는 "성장 데이터"와 "가족 연결"을 중심으로 차별화.

---

# PART 4: Personas — V3와 동일

---

# PART 5: JTBD — V3와 동일 (Core Loop 기반으로 아래에서 확장)

---

# PART 6: REVISED Core Loop (V3 전면 개정)

## 새로운 Monari Core Loop (9단계)

```
[1] 돈을 받는다
────────────────────────────────────
정기용돈 (자동)
즉시용돈 (부모 직접)
미션 보상 (행동 후 자동)
가족 선물 (조부모, Gift Giver — Phase 2)
목표 후원 (Matching Contribution — Phase 2)

         ↓

[2] 아이가 돈을 직접 나눈다
────────────────────────────────────
Spend (사용 가능)
Save (저금)
Goal (목표에 배정)

↓ 아이가 직접 비율을 정함 (강제 분배 없음)

         ↓

[3] 아이가 행동한다
────────────────────────────────────
소비 (현금 기록 / 카드 사용 — Phase 3)
저축 (저금 버튼)
미션 완료 (행동약속 체크)
목표 관리 (목표에 직접 배정/수정)
미리쓰기 요청/상환

         ↓

[4] 목표가 움직인다
────────────────────────────────────
Goal Progress 시각화
예상 달성일 계산
"3,000원 더 모으면 7일 빨라져요"

         ↓

[5] Monari가 행동을 해석한다
────────────────────────────────────
소비 패턴 분류
미션 달성률 계산
저축 지속성 평가
목표 관리 방식 분석
이자율 산정 (월말 정산)

         ↓

[6] 아이에게 쉬운 피드백을 준다
────────────────────────────────────
Goal Progress 애니메이션
Money Level (7-12세) / Score (13세+)
"이번 주 미션 4개 완료! 보너스 이자 +0.5%"
"목표까지 18일 남았어요"

         ↓

[7] 부모에게 금융습관 변화로 보여준다
────────────────────────────────────
주간 요약 카드
월간 성장 리포트
"지호의 저축 지속성이 3주 연속 늘었어요"
Parent Coaching Tip (행동 기반 개인화)

         ↓

[8] 부모/가족이 다음 금융경험에 참여한다
────────────────────────────────────
미션 추가/수정
목표 Matching Contribution
용돈 조정
가족 초대 (Phase 2)

         ↓

[9] 다시 아이의 행동으로 이어진다
────────────────────────────────────
Push 알림 (목표 진행 독려, 미션 리마인더)
보상 수령 알림
새 미션 도착 알림
→ [1]로 재진입
```

---

## MVP 기능 × Core Loop 매핑

| 기능 | Loop 단계 | P0/P1 | 현재 상태 |
|---|---|---|---|
| 정기 용돈 자동 지급 | Step 1 | P0 | ✅ 완료 |
| 즉시 용돈 | Step 1 | P0 | ✅ 완료 |
| **Goal System (신규)** | Step 2, 4 | **P0** | ❌ 미구현 |
| **아이 Allocation UI** | Step 2 | **P0** | ❌ 미구현 |
| 행동약속 미션 | Step 3 | P0 | ✅ 완료 |
| 미션 보상 지급 | Steps 1, 3 | P0 | ✅ 완료 |
| 저금 | Step 3 | P0 | ✅ 완료 |
| 미리쓰기 / 상환 | Step 3 | P0 | ✅ 완료 |
| Goal Progress 시각화 | Step 4 | P0 | ❌ 미구현 |
| 이자율 정산 (월말) | Step 5 | P0 | ✅ 완료 |
| Money Level/Score | Steps 5, 6 | P1 | ⚠️ 개편 필요 |
| **아이 Home 재설계** | Steps 3, 4, 6 | **P0** | ⚠️ 재설계 필요 |
| **아이 바텀탭** | Steps 3, 4, 6 | **P0** | ❌ 없음 |
| **Push Notification 완성** | Steps 6, 7, 9 | **P0** | ⚠️ 미완성 |
| 월간 리포트 | Step 7 | P1 | ✅ 완료 |
| **주간 요약 카드 (신규)** | Step 7 | P1 | ❌ 미구현 |
| **Parent Coaching 개인화** | Steps 7, 8 | P1 | ⚠️ 개선 필요 |
| **Family DB Architecture** | Steps 1, 8 | **P0 (DB만)** | ❌ 미구현 |
| 미션 생성/수정 | Step 8 | P0 | ✅ 완료 |
| **온보딩 재설계** | Loop 진입 | **P0** | ⚠️ 개선 필요 |

**판별 기준**: Loop에서 2단계 이상 담당하거나, 다른 P0 기능의 선결 조건이면 P0.

---

# PART 7: Family Financial Network (개정)

## Phase 1에서 DB/Domain Architecture 설계 (UI는 Phase 2)

현재 `children.parent_id` 중심 구조는 이후 모든 Family 확장을 막는다.  
Phase 1에서 코드를 변경하지 않더라도, **DB 구조를 먼저 확장 가능하게 만들어야 한다**.

## 추천 Family Domain Entity

```
Family
├── id
├── name ("김민준 가족")
├── created_at
└── settings (JSONB)

FamilyMember
├── id
├── family_id → Family
├── profile_id → profiles (부모/보호자용)
├── child_id → children (아이용, NULL if adult)
├── role → FamilyRole
├── display_name
├── invited_by
├── joined_at
└── status (active / invited / removed)

FamilyRole (Enum)
├── PRIMARY_GUARDIAN   — 가족 생성자. 모든 권한
├── GUARDIAN           — 공동 보호자. 권한 설정 가능
├── GIFT_GIVER         — 선물 기여자. 용돈 보내기만
└── CHILD              — 아이. 자신의 Wallet/Goal/Mission

FamilyMemberPermission
├── member_id → FamilyMember
├── can_give_allowance
├── can_approve_behavior
├── can_approve_borrow
├── can_approve_spend
├── can_change_settings
├── can_view_reports
└── max_gift_amount_per_month (NULL = 무제한)
```

## 현재 구조에서 Migration 계획

현재 `children.parent_id` + `child_guardians` → 새 Family 구조로 이관.

### Migration 단계 (데이터 손실 없음)

```sql
-- Step 1: Family 테이블 생성
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: FamilyMember 테이블 생성
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id),
  profile_id UUID REFERENCES profiles(id),  -- 성인
  child_id UUID REFERENCES children(id),    -- 아이
  role TEXT NOT NULL,  -- PRIMARY_GUARDIAN / GUARDIAN / GIFT_GIVER / CHILD
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active',
  CONSTRAINT check_member_type CHECK (
    (profile_id IS NOT NULL AND child_id IS NULL) OR
    (profile_id IS NULL AND child_id IS NOT NULL)
  )
);

-- Step 3: 기존 데이터 Migration
-- 각 parent를 Family로, children을 CHILD member로, child_guardians를 GUARDIAN으로 이관

-- Step 4: children.parent_id와 child_guardians는
--         읽기 전용 유지 + Deprecation 플래그
-- (서비스 배포 후 Migration 완료 확인 후 제거)
```

### Migration 원칙

1. 기존 테이블 유지 (children.parent_id, child_guardians) — 삭제 금지
2. 새 Family 구조를 병렬로 운영
3. 신규 기능(Goal Sponsorship, Gift Giver)은 새 구조만 사용
4. 기존 기능은 기존 구조 유지 → 점진적 이관
5. Phase 1 목표: 신규 Family 구조 생성 + 기존 데이터 자동 이관

---

# PART 8: Allowance System — V3와 동일

---

# PART 9: Wallet — V3와 동일 (단, 실제 Wallet 계획은 PART 23에서 개정)

---

# PART 10: Card (개정 — 두 Track 분리)

## PRODUCT TRACK vs FINANCIAL INFRASTRUCTURE TRACK

카드는 두 개의 독립적인 Track으로 운영한다.

```
PRODUCT TRACK (지금 진행)
────────────────────────
Monari Core Loop 검증
Child/Parent Retention 확인
Goal → Behavior → Report Loop 완성
Unit Economics 이해

동시 진행 ↓

FINANCIAL INFRASTRUCTURE TRACK (지금 시작)
────────────────────────
은행/카드사/선불/BaaS 파트너 탐색
사업 구조 검토
법무 자문
파트너 미팅 및 PoC
[LEGAL REVIEW REQUIRED] — 선불전자지급수단 등록 여부
```

**두 Track은 각각 독립적으로 진행**한다.  
"사용자 N명 달성 후 카드 시작"이 아니라, 두 Track이 준비됐을 때 합류한다.

## Card 실제 개발 Go/No-Go 기준 (다차원)

단순 MAU 숫자가 아닌 다차원 기준:

| 기준 | 임계값 | 측정 방법 |
|---|---|---|
| Child D30 Retention | > 40% | 코호트 분석 |
| Core Loop 완주율 | > 50% | 등록 아이 중 전체 Loop 1회 완주 |
| Goal 달성율 | > 30% | 설정한 목표 중 달성 완료 비율 |
| Parent NPS | > 40 | 월간 NPS 서베이 |
| Parent D30 Retention | > 50% | 코호트 분석 |
| 미션 주간 완료율 | > 65% | 설정 미션 중 완료 비율 |
| LTV/CAC | > 3x | 구독 전환율 × ARPU ÷ 획득 비용 |
| Financial Partner | 계약 완료 | BaaS/선불 파트너 |
| Legal Review | 완료 | 법무법인 의견서 |

**이 기준 중 Financial Partner + Legal Review는 필수 조건.**  
나머지는 5개 이상 충족 시 Go.

---

# PART 11: Transfer & Friends — V3와 동일

---

# PART 12: Saving & Goal (개정 — Matching Contribution 모델)

## Goal 시스템은 P0이나 "단순 후원"이 아니다

아이가 목표를 달성하는 노력 없이 가족이 바로 채워주는 구조는  
아이의 저축 동기를 오히려 낮춘다.

## Goal Sponsorship: Matching Contribution 설계

가족이 목표에 기여할 때는 **아이의 노력을 전제로** 한다.

### 옵션 A: 성취 Matching

```
"지호가 10,000원을 직접 저금할 때마다
 할머니가 2,000원을 추가해드려요"
 
Target: 50,000원
아이 기여: 최소 80%
가족 Bonus: 최대 20%
```

### 옵션 B: Milestone Bonus

```
목표: 70,000원
아이가 35,000원(50%) 도달 시
→ 부모 Bonus 5,000원 자동 지급

아이가 63,000원(90%) 도달 시
→ 할머니 응원금 7,000원 추가
```

### 옵션 C: 시간 기반 Matching

```
목표: 50,000원 / 목표일: 8주
매주 아이가 저금하면
→ 가족이 주당 최대 1,000원 Matching
(8주 × 1,000원 = 최대 8,000원)
```

### 구현 추천: MVP에서는 옵션 A

- 간단하고 이해하기 쉬움
- 아이의 저축 행동을 강화
- 가족 참여를 자연스럽게 유도

```
[설정 화면 — 부모 또는 Gift Giver]
목표: Nintendo Switch Game (70,000원)

후원 방식 선택:
○ Matching  아이 10,000원마다 [____]원 추가
● Milestone 목표의 50% 달성 시 [____]원 보너스
○ 한 번에  [____]원 바로 후원

→ 아이에게 보여지는 방식:
"할머니가 응원 중! 목표의 절반을 넘으면 5,000원 보너스가 와요"
```

## Goal 데이터 모델 (V3에서 보완)

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  title TEXT NOT NULL,
  target_amount BIGINT NOT NULL,
  current_amount BIGINT DEFAULT 0,
  deadline DATE,
  image_emoji TEXT,         -- "🎮" "👟" "📚"
  image_url TEXT,
  status TEXT DEFAULT 'active',   -- active/achieved/paused/cancelled
  created_at TIMESTAMPTZ DEFAULT now(),
  achieved_at TIMESTAMPTZ,
  created_by UUID,         -- 아이 or 부모
  sponsorship_config JSONB -- Matching 설정 JSON
);

CREATE TABLE goal_sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id),
  sponsor_id UUID,           -- FamilyMember.id (Phase 2) or profile_id
  sponsor_name TEXT,         -- 조부모 등 표시용
  sponsorship_type TEXT,     -- 'matching' | 'milestone' | 'one_time'
  config JSONB,              -- 각 타입별 설정
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id),
  contributor_type TEXT,     -- 'child' | 'sponsor'
  contributor_id UUID,
  amount BIGINT NOT NULL,
  contribution_type TEXT,    -- 'direct' | 'matching' | 'milestone_bonus'
  transaction_id UUID REFERENCES money_transactions(id),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

# PART 13: Money Score (전면 개정)

## 설계 원칙

1. **실제 금융행동만 평가**. App Open, 페이지 조회, Push Click 절대 포함 금지.
2. **절대 금액 기반 평가 금지**. 용돈이 적은 아이도 높은 점수를 받을 수 있어야 함.
3. **미리쓰기 자체는 감점 아님**. 미리쓰기 후 상환하는 것은 오히려 긍정적 행동.
4. **부유한 가정이 유리하지 않음**. 저축 금액이 아닌 저축 행동 패턴으로 평가.
5. **아이 압박 도구가 되지 않음**. 부모가 점수로 아이를 통제할 수 없도록 UX 설계.

## 개정 Money Score 구성

```
[계획 실행력]          30점
├ 용돈 수령 후 Allocation 설정 여부 (월별)
└ Allocation 범위 내 소비 유지율

[저축 지속성]          30점
├ 저금 행동 발생 횟수 (금액 아닌 빈도)
├ 목표 배정 행동 발생 여부
└ 미리쓰기 상환 완료율 (사용 시에만)

[목표 관리]            25점
├ 목표 설정 여부
├ 목표 진행 중 중단율 (낮을수록 좋음)
└ 목표 달성 횟수 (기간 대비)

[미션 참여]            15점
├ 미션 달성률 (설정된 미션 대비)
└ 연속 달성 스트릭 (보너스)
```

**제거된 항목**: App Open, 리포트 조회, 또래 비교 조회, 페이지 방문.

## 연령별 Money Score 표현

| Age Stage | 표현 방식 | 이유 |
|---|---|---|
| 7-9세 (EARLY_CHILD) | 숫자 없음. 성장 캐릭터 (씨앗→새싹→꽃) | 숫자 비교보다 성장 시각화 |
| 10-12세 (CHILD) | Level 1-10 + 설명 ("훌륭한 저축가") | 숫자와 의미 함께 |
| 13-15세 (TEEN) | 선택: Level or 0-100 점수 | 아이가 직접 선택 |
| 16-18세 (OLDER_TEEN) | 0-100 점수 + 상세 분해 | 자기 이해 중심 |

## 점수 공개 원칙

- 아이는 자신의 점수만 봄
- 부모는 아이 점수를 볼 수 있음 (단, "통제 도구"가 아님을 UX로 강조)
- 형제 간 점수 비교 기능 없음
- 또래 비교는 Plus에서만, 개인 점수 비교 금지

---

# PART 14: Peer Benchmark (역할 수정)

## 초기 Plus의 핵심 가치는 Peer Benchmark가 아니다

초기 단계에서 사용자 수가 적으면 또래 비교 데이터는 신뢰할 수 없다.  
신뢰할 수 없는 데이터를 Premium Feature로 포장하면 이탈 원인이 된다.

## 단계별 Peer Benchmark 전략

### 초기 (사용자 < 1,000가족)
- 또래 비교 UI: 존재하되 "아직 데이터가 모이는 중이에요" 표시
- 또래 비교로 Premium 전환 유도 금지
- 대신 "내 아이의 성장 추이" 중심

### 중기 (1,000~10,000가족)
- cohort별 sample_size > 30인 지역/연령대부터 순차 공개
- "OO시 초등 5학년 평균 저축률"과 비교 가능
- Plus Feature로 개방

### 장기 (10,000가족 이상)
- 또래 비교가 강력한 Premium Retention Feature
- "우리 아이가 같은 나이 또래 상위 20%에요" → 부모 공유 유도
- 지역별 비교, 연도별 트렌드

## 초기 Plus의 핵심 가치 (Peer Benchmark 대체)

Peer Benchmark 전까지 Plus의 핵심 가치:

1. **6개월 금융 성장 트렌드** — 아이의 Money Level/Score 변화 그래프
2. **Personalized Parent Coaching** — 실제 행동 기반 대화 팁 (고정 문장 아님)
3. **Advanced Family Report** — 다자녀 통합 리포트
4. **상세 소비 카테고리 분석** — 간식/문구/여가 등 카테고리별
5. **Goal Sponsorship 알림** — Matching 조건 달성 시 즉시 알림

---

# PART 15: Parent Report — V3에서 유지 (주간 요약 추가)

---

# PART 16: Child UX (이자율 UX 단순화 추가)

## 이자율 시스템 UX 단순화

행동→이자율 시스템은 삭제하지 않는다. 단, **아이에게 보여주는 방식을 단순화**한다.

### 현재 아이 화면 (문제)

```
현재 이자율: 3.5% (기본 2.0% + 행동 보너스 1.5%)
이번 달 예상 이자: 4,200원
```

→ 이자율 개념이 아이에게 추상적. 숫자가 왜 3.5%인지 아이가 이해하기 어려움.

### 개정 아이 화면 (단순화)

```
[저금 중인 돈 15,000원]

기본 이자     + 150원/월
약속 보너스   + 180원/월  ← 미션 잘 지켰을 때
────────────────────────
이번 달 예상  + 330원

"약속 5개 더 지키면 보너스가 더 올라가요!"
```

→ "기본 이자" + "약속 보너스" 두 개만. 퍼센트 숫자는 숨김.  
→ 더 모으는 것보다 **약속을 지키는 것이 이자를 올린다**는 직관적 이해.

### 부모 화면 (상세 유지)

```
아이 이자율 현황: 3.5%
구성: 기본 2.0% + 약속 달성 보너스 1.5%
이번 달 달성률: 80% (목표 80% 충족)
내달 예상 이자율: 3.5% (유지)
```

→ 부모 설정 화면과 리포트에서는 상세 숫자 유지.

## 구현 방법

기존 `interest_rate_events`, `wallet_snapshots.current_interest_rate` 로직 그대로 유지.  
화면 레이어에서만 표현 방식 변경:

```typescript
// 아이 화면용 표현 변환
function formatInterestForChild(rate: number, baseRate: number): {
  baseAmount: number;
  bonusAmount: number;
  encouragementText: string;
} {
  const bonusRate = rate - baseRate;
  const savingsBalance = /* wallet_snapshots.savings_balance */;
  return {
    baseAmount: Math.floor(savingsBalance * baseRate / 12),
    bonusAmount: Math.floor(savingsBalance * bonusRate / 12),
    encouragementText: bonusRate > 0 
      ? `약속을 잘 지켜서 보너스 이자가 생겼어요!`
      : `약속을 지키면 보너스 이자를 받을 수 있어요`,
  };
}
```

백엔드 로직 변경 없음. 프론트엔드 표현만 변경.

---

# PART 17: Parent UX — V3와 동일

---

# PART 18: New IA — V3와 동일

---

# PART 19: Screen Inventory — V3와 동일 + Goal Sponsorship 화면 추가

---

# PART 20: REVISED MVP P0/P1 (Core Loop 기여도 기준 재정렬)

## P0 기준: Core Loop의 필수 연결점이거나 다른 P0의 선결 조건

| 기능 | Loop 기여 | 이유 |
|---|---|---|
| **Goal System 신규 개발** | Step 2, 4 | Loop의 핵심 Retention 엔진. 없으면 아이가 앱 열 이유 없음 |
| **아이 Home 재설계** | Steps 3, 4, 6 | Loop 진입점. 현재 부모 관리도구 느낌 → 아이 중심으로 |
| **아이 바텀탭 (4탭)** | Steps 3, 4, 6 | Goal/Money/홈/나 탐색 구조 없으면 Loop 탐색 불가 |
| **Family DB Architecture** | Steps 1, 8 | Goal Sponsorship / Gift Giver / 모든 확장의 기반 |
| **Push Notification 완성** | Steps 6, 7, 9 | Loop 재진입 트리거. 없으면 아이가 다시 열 이유 없음 |
| **온보딩 재설계** | Loop 진입 | 행동약속 이자율 시스템을 3분 내 이해 가능하게 |
| Allowance 시스템 | Step 1 | 이미 완료. 안정화만 |
| 행동약속 미션 | Step 3 | 이미 완료. 아이 화면 연결 개선만 |
| 이자율 정산 | Step 5 | 이미 완료. UX 표현만 단순화 |
| 월간 리포트 기본 | Step 7 | 이미 완료. 개선 여지 있지만 신규 개발 아님 |

## P1 기준: Loop를 강화하지만 Loop 자체가 없어도 작동

| 기능 | Loop 기여 | 이유 |
|---|---|---|
| Money Level/Score 개편 | Steps 5, 6 | 아이 피드백 품질 향상. P0 이후 |
| 주간 요약 카드 (부모 Home) | Step 7 | 부모 Engagement 강화 |
| Parent Coaching 개인화 | Steps 7, 8 | 행동 기반 개인화. 현재 고정 문장 → 데이터 기반 |
| Goal Matching UI | Step 8 | 가족 참여 강화. DB 설계 후 구현 |
| 이자율 UX 단순화 | Steps 5, 6 | 아이 이해도 향상. 백엔드 변경 없음 |
| 다자녀 통합 뷰 | Step 7 | 다자녀 부모 Retention |

## MVP에서 제외 (V3와 동일, 이유 명확화)

| 기능 | 제외 이유 |
|---|---|
| 카드 (실물) | FINANCIAL INFRASTRUCTURE TRACK 별도 진행 |
| 친구 송금 | 법적 검토 전 불가. Phase 4 이후 |
| Gift Giver UI | DB 설계 후 Phase 2. UI까지 Phase 1에 넣으면 과부하 |
| Peer Benchmark 강화 | 데이터 충분 후 의미 있음 |
| AI Coaching | 데이터 1년치 필요 |
| 연령별 UX 완전 분기 | Phase 2. Phase 1은 단일 UX에서 age_stage 필드만 준비 |

---

# PART 21: REVISED Roadmap

## Phase 1: Core Loop Foundation (현재~3개월)
**목적**: Core Loop의 빠진 연결고리를 채우고, 아이가 자발적으로 Loop에 진입하는 앱 완성.

| 기능 | 우선순위 |
|---|---|
| Family DB Architecture 설계 + Migration | P0 |
| Goal System (goals, goal_sponsorships, goal_contributions 테이블 + UI) | P0 |
| 아이 Home 재설계 (Wallet + Goal + Mission 통합) | P0 |
| 아이 바텀탭 4탭 구조 | P0 |
| Push Notification 완성 (미션/Goal/알림) | P0 |
| 온보딩 재설계 (이자율 시스템 3분 이해) | P0 |
| 이자율 UX 단순화 (기본 이자 + 보너스 이자) | P1 |
| Money Level/Score 개편 | P1 |
| 주간 요약 카드 | P1 |

**Phase 1 검증 KPI**:
- 등록 아이 중 Goal 설정률 > 60%
- 아이 D30 Retention > 40%
- 부모 D30 Retention > 50%
- WAFK (Weekly Active Financial Kids) > 50% of registered children

---

## Phase 2: Financial Infrastructure Validation (3~9개월)
**이름 변경**: "Real Money Flow" → **"Financial Infrastructure Validation"**

**목적**: 실제 돈이 움직이는 구조의 사업/법률/파트너 타당성 검증.

| 작업 | 항목 |
|---|---|
| **[LEGAL REVIEW REQUIRED]** | 가상 Wallet의 전자금융거래법 적용 여부 검토 |
| **[LEGAL REVIEW REQUIRED]** | 부모 충전 구조의 선불전자지급수단 해당 여부 |
| **[LEGAL REVIEW REQUIRED]** | 미성년자 계좌 관련 법정대리인 동의 요건 |
| BaaS 파트너 탐색 | 갤럭시아머니트리, 핀셋N, KT M하우스 등 미팅 (상용화 조건 별도 협의 필요) |
| Gift Giver UI | 조부모 웹뷰 초대 플로우 |
| Goal Matching 정식 구현 | Phase 1 DB 기반 |
| 용돈 배분 프리셋 | 받을 때 Spend/Save/Goal 설정 저장 |
| 연령별 UX 분기 | 7-12 vs 13-18 기본 분기 |

**실제 사용자 돈 보관/이동 기능은 법무 검토 + 파트너 확정 후에만 구현.**

---

## Phase 3: Card (9~18개월, Go/No-Go 기준 충족 후)
**진입 조건**: PART 10의 다차원 Go/No-Go 기준 참조.

---

## Phase 4: Network (18~30개월)
**진입 조건**: Phase 3 완료 + [LEGAL REVIEW REQUIRED] 미성년자 간 송금 법적 검토.

---

## Phase 5: Intelligence (30개월+)
데이터 1년치 이상 축적 후. AI Coaching, 장기 성장 예측.

---

# PART 22: REVISED Business Model

## 개정 Free vs Plus 경계

**원칙**: Core Loop 체험은 Free. Loop에서 나온 인사이트와 깊은 분석은 Plus.  
아이가 Goal Loop를 충분히 경험해야 Monari의 가치를 체감한다.  
Goal 개수를 초기부터 제한하면 Retention이 무너진다.

---

### FREE (영구 무료)

**아이 기능**
- Wallet (Spend / Save / Goal)
- 목표 저축 무제한 (개수 제한 없음)
- 기본 Goal Progress 시각화
- 행동약속 미션 (최대 5개)
- 저금
- 미리쓰기 / 상환
- 기본 Money Level/Score
- 이번 달 요약 (4주 히스토리)

**부모 기능**
- 자녀 등록 (최대 2명)
- 정기/즉시 용돈
- 미션 생성/승인 (최대 5개)
- 미리쓰기/현금 승인
- 기본 월간 요약
- 알림 (기본)

**설명**: Core Loop 전체를 Free에서 완전히 경험할 수 있다.  
Plus 없이도 Monari의 핵심 가치를 얻을 수 있어야 한다.

---

### PLUS (월 3,900원 / 연 39,000원)

**확장 기능**
- 자녀 무제한 (3명 이상)
- 행동약속 미션 무제한
- Goal Sponsorship (Matching Contribution)
- **6개월 금융 성장 트렌드** — Loop 핵심 가치
- **Personalized Parent Coaching** — 데이터 기반 개인화
- 상세 소비 카테고리 분석
- 다자녀 통합 리포트
- 또래 비교 (데이터 충분 시 활성화)
- Advanced Goal Analytics
- 리포트 내보내기 (PDF)

**설명**: Plus의 가치는 "Loop에서 나온 데이터를 더 깊이 이해하는 것".  
"기능 잠금"이 아닌 "인사이트 잠금".

---

### 무료/Plus Boundary 설계 원칙

| 잠금 OK | 잠금 NG |
|---|---|
| 6개월 성장 트렌드 | Goal 개수 제한 |
| 또래 비교 상세 | 미션 완료 여부 확인 |
| 개인화 코칭 | 기본 저금 기능 |
| 다자녀 통합 리포트 | 기본 잔액 확인 |
| 소비 카테고리 분석 상세 | 미리쓰기 기능 |

---

# PART 23: REVISED Financial Infrastructure (법적 검토 명시)

## 역할 명확화

| 역할 | 기능 | 필요 조건 |
|---|---|---|
| PG사 (현재: PortOne) | 부모 카드 결제 → 부모 지갑 충전 | 현재 구현됨 |
| 가상 Wallet (현재) | DB 잔액 관리. 실제 돈 보관 없음 | 현재 구현됨 |
| **[LEGAL REVIEW]** 선불전자지급수단 | 아이 지갑에 실제 잔액 보관 | 법무 검토 필요 |
| BaaS 업체 | 카드 발급/사용 처리 | 파트너 계약 필요 |
| 은행 제휴 | 실계좌 연동 | 별도 협의 |

## 현재 안전한 영역

```
부모 신용카드 결제 (PortOne V2)
→ Monari DB에 parent_wallet.balance 증가
→ 아이 DB에 wallet_snapshots.balance 증가
```

위 구조는 "부모가 앱에서 용돈을 주는 행위"의 기록.  
실제 자금 보관이 아닌 **가계부 성격**으로 해석 가능.  
단, 법적 지위는 **[LEGAL REVIEW REQUIRED]** — 무결한 해석 근거 확보 필요.

## 실제 자금 이동 시 필요한 사전 작업

1. **[LEGAL REVIEW REQUIRED]** 가상 Wallet → 실 선불 Wallet 전환의 전자금융거래법 해당 여부
2. **[LEGAL REVIEW REQUIRED]** 미성년자 대상 선불수단 발행 관련 특금법 AML/KYC 요건
3. **[LEGAL REVIEW REQUIRED]** 출금/환불 구조의 소비자보호법 요건
4. BaaS 파트너 실제 계약 조건 확인 (본 문서는 공개 정보 기반 참고만)

**결론**: Phase 2의 핵심은 "돈을 이동시키는 것"이 아니라 **"이동시킬 수 있는 구조를 사업/법률적으로 준비하는 것"**이다.

---

# PART 24: REVISED Data Model

## 핵심 추가: Family Architecture

PART 7 참조. 기존 `children.parent_id` + `child_guardians`는 유지하고, `families` + `family_members`를 병렬로 신설.

## Age Stage 정의

```sql
-- children.age_stage 컬럼 추가
-- birth_year 기반으로 자동 계산, 저장

EARLY_CHILD : 7-9세   (초등 1-3학년)
CHILD       : 10-12세 (초등 4-6학년)
TEEN        : 13-15세 (중학교)
OLDER_TEEN  : 16-18세 (고등학교)
```

Phase 1에서 컬럼만 추가. UI 분기는 Phase 2에서 구현.  
단, DB에 `age_stage`가 없으면 이후 분기가 불가능하므로 Phase 1에서 필수.

## Age Stage별 허용 기능 매트릭스 (설계 기준)

| 기능 | EARLY_CHILD | CHILD | TEEN | OLDER_TEEN |
|---|---|---|---|---|
| Wallet 잔액 확인 | ✅ | ✅ | ✅ | ✅ |
| Goal 설정 | ✅ | ✅ | ✅ | ✅ |
| 미리쓰기 요청 | 부모 결정 | ✅ | ✅ | ✅ |
| 소비 카테고리 분석 | ❌ | ✅ | ✅ | ✅ |
| Money Level/Score | Level만 | Level/Score 선택 | Score | Score 상세 |
| 또래 비교 | ❌ | ✅ 기본 | ✅ | ✅ 상세 |
| 카드 사용 (Phase 3) | 부모 결정 | 부모 결정 | ✅ | ✅ |
| 송금 (Phase 4) | ❌ | ❌ | 부모 동의 | ✅ |

---

# PART 25: Privacy — V3와 동일

---

# PART 26: REVISED Metrics

## 새 North Star Metric: WAFK

**WAFK = Weekly Active Financial Kids**  
*(주 1회 이상 자발적으로 의미 있는 금융행동을 수행한 아이 수)*

### Meaningful Financial Action 정의

다음 이벤트 중 하나 이상이 아이에 의해 발생한 주:

| 행동 | 이벤트명 | 포함 이유 |
|---|---|---|
| Goal에 직접 배정 | `child.goal.contribution` | Core Loop Step 2 |
| 저금 실행 | `child.saving.execute` | Core Loop Step 3 |
| Allocation 설정 | `child.allocation.set` | Core Loop Step 2 |
| 미션 체크 | `child.mission.complete` | Core Loop Step 3 |
| 미리쓰기 상환 | `child.borrow.repay` | Core Loop Step 3 |
| Goal 목표 조정 | `child.goal.adjust` | Core Loop Step 4 |
| 소비 후 Reflection | `child.spend.record` | Core Loop Step 3 |

**포함하지 않는 것**: App Open, 홈화면 조회, 잔액 확인만, Push Click.

### WAFK 측정 방법

```sql
-- 주간 WAFK 계산 쿼리 (예시)
SELECT COUNT(DISTINCT child_id) AS wafk
FROM meaningful_financial_events
WHERE 
  event_type IN (
    'child.goal.contribution',
    'child.saving.execute',
    'child.allocation.set',
    'child.mission.complete',
    'child.borrow.repay',
    'child.goal.adjust',
    'child.spend.record'
  )
  AND created_by_child = true   -- 부모가 대신 실행한 것 제외
  AND week_start = current_week;
```

### WAFK 대신 "Financial Growth Participation Rate"도 검토

**WAFK**는 절대 수. 성장 단계에서 비율이 더 유용할 수 있음.

추천: **WAFK Rate** = WAFK / 전체 등록 활성 아이 수

Phase 1 목표: WAFK Rate > 50%

### 보조 지표

| 지표 | 목표 |
|---|---|
| Goal 설정률 | 등록 아이 중 > 60% |
| Goal 달성률 | 설정 목표 중 > 30% |
| 미션 주간 완료율 | > 65% |
| Child D30 Retention | > 40% |
| Parent D30 Retention | > 50% |
| Plus 전환율 | 6개월 사용 후 > 15% |
| Plus D90 Retention | > 70% |

---

# PART 27: Code Migration Plan — V3에서 유지, Family Architecture 추가

**추가 작업**: Phase 1에서 Family DB Migration (PART 7 참조).  
기존 코드에서 `children.parent_id`를 직접 참조하는 쿼리는 점진적으로 `family_members` 조인 방식으로 이관.

---

# PART 28: REVISED Top 10 Product Decisions → 대표 결정 5개로 압축

아래 PART 9 (Section I)에서 처리.

---

# ═══════════════════════════════════════
# CLOSING SECTIONS (A–I)
# ═══════════════════════════════════════

---

## A. REVISED PRODUCT THESIS

**Monari가 존재하는 이유:**

> "아이가 처음 돈을 받는 순간부터,  
> 목표를 세우고, 행동하고, 성장하는 과정을  
> 가족이 함께 경험하고 기억하는 유일한 서비스"

**3가지 핵심 믿음:**

1. **금융습관은 어릴 때 형성된다.** 7-12세는 용돈 관리의 핵심 창(窓). 이 시기의 경험이 성인 재무행동을 결정한다.

2. **가족의 참여가 아이의 습관을 만든다.** 부모가 단순히 용돈을 주는 것이 아니라, 미션을 함께 설계하고, 목표를 후원하고, 성장을 확인할 때 진짜 변화가 생긴다.

3. **데이터는 반복 사용에서 나온다.** 같은 아이가 7세부터 18세까지 Monari를 계속 쓰면, 그 데이터는 대체 불가능한 자산이 된다.

**Product Thesis를 가장 잘 표현하는 한 문장:**

> **"아이의 첫 용돈이 좋은 금융습관으로 연결되는 유일한 Loop"**

---

## B. REVISED CORE LOOP

PART 6에 상세 정의됨. 요약:

```
[돈 받기] → [아이 배분] → [아이 행동] → [목표 진행]
     ↑                                          ↓
[가족 참여] ← [부모 인사이트] ← [피드백] ← [Monari 해석]
```

**Loop의 핵심 특성:**
- 아이가 Loop의 **주인**이다 (부모가 설계하고 아이가 실행)
- Goal이 Loop의 **Retention 엔진**이다
- Monari는 Loop를 **관찰하고 해석**한다
- 부모는 Loop를 **지원하고 조정**한다
- 가족은 Loop를 **강화**한다 (Matching, 선물)

---

## C. REVISED KILLER EXPERIENCE

**Monari의 Killer Feature는 단일 기능이 아니다.**

경쟁사가 쉽게 복사할 수 있는 단일 기능(Goal Saving, 이자율 등)은 Killer가 아니다.

Monari의 Killer Experience는 **Loop 전체가 작동할 때** 발생한다:

```
시나리오: "지호의 Nintendo Switch 여정"

① 아빠가 정기 용돈 30,000원 설정
② 지호가 직접: 사용 15,000 / 저금 8,000 / 목표 7,000으로 배분
③ 지호가 "청소 미션" 완료 → 보상 2,000원 → 목표에 추가 배정
④ 할머니: "지호야, 네가 30,000원 모으면 나도 10,000원 보태줄게"
   (Matching Contribution 설정)
⑤ Monari: "목표까지 18일 남았어요. 이번 주 3,000원 더 모으면 12일로 줄어요"
⑥ 아빠: "지호가 3주 연속 목표 저금했어요. 미션 완료율도 85%예요"
⑦ 목표 달성! 할머니 Matching 10,000원 도착. 축하 화면.
⑧ 다음 목표 설정 → Loop 재시작
```

이 경험은 **Goal + Mission + Matching + Notification + Report**가 모두 연결될 때만 가능하다.  
어떤 경쟁사도 이 전체 Loop를 한 번에 제공하지 않는다.

---

## D. REVISED MVP P0/P1

### Phase 1 P0 (반드시 있어야 함)

| # | 기능 | 현재 상태 | 작업 유형 |
|---|---|---|---|
| 1 | **Goal System** (goals + 기본 UI) | ❌ 없음 | 신규 개발 |
| 2 | **아이 Home 재설계** | ⚠️ 부적합 | 전면 재설계 |
| 3 | **아이 바텀탭 (4탭)** | ❌ 없음 | 신규 개발 |
| 4 | **Family DB Architecture** | ❌ 없음 | DB Migration |
| 5 | **Push Notification 완성** | ⚠️ 미완성 | 완성 |
| 6 | **온보딩 재설계** | ⚠️ 개선 필요 | 개선 |

### Phase 1 P1 (있으면 Loop가 강화됨)

| # | 기능 | 현재 상태 | 작업 유형 |
|---|---|---|---|
| 7 | Money Level/Score 개편 | ⚠️ 개편 필요 | 개선 |
| 8 | 이자율 UX 단순화 | ⚠️ | 프론트엔드만 |
| 9 | 주간 요약 카드 (부모 Home) | ❌ 없음 | 신규 개발 |
| 10 | Parent Coaching 개인화 | ⚠️ 고정 문장 | 개선 |

---

## E. REVISED DATA MODEL

### 핵심 신규 테이블

```
families                 ← Family Domain 기반
family_members           ← PRIMARY_GUARDIAN / GUARDIAN / CHILD / GIFT_GIVER
goals                    ← 목표 저축
goal_sponsorships        ← Matching 설정
goal_contributions       ← 아이 / 가족 기여 기록
```

### 기존 테이블 수정

```
children: + age_stage (EARLY_CHILD | CHILD | TEEN | OLDER_TEEN)
children: + family_id → families (migration 후)

money_transactions: + goal_id (nullable)
money_transactions: + given_by_name (조부모 등)
money_transactions: + contribution_type (direct | matching | bonus)
```

### 불변 원칙

- `children.parent_id`: 보존. 기존 코드 호환성 유지.
- `child_guardians`: 보존. 새 `family_members`와 병렬 운영.
- 데이터 손실 없는 Migration.

---

## F. REVISED FREE vs PLUS

### FREE — Core Loop 전체 경험 가능

| 영역 | 내용 |
|---|---|
| 아이 | Wallet, 목표 무제한, 저금, 미리쓰기, 기본 Money Level |
| 부모 | 자녀 2명, 미션 5개, 기본 월간 요약, 기본 알림 |
| 데이터 | 4주 히스토리 |

### PLUS (3,900원/월 or 39,000원/년) — Loop 인사이트

| 영역 | 내용 |
|---|---|
| 아이 | Money Level/Score 상세, Goal Analytics |
| 부모 | 자녀 무제한, 미션 무제한 |
| 인사이트 | 6개월 성장 트렌드, Personalized Coaching, 소비 카테고리 상세 |
| 가족 | Goal Sponsorship (Matching), 다자녀 통합 리포트 |
| 데이터 | 전체 히스토리, PDF 내보내기 |
| 또래 | 또래 비교 (데이터 충분 시) |

**핵심 원칙**: Plus 없이도 Monari의 핵심 가치를 경험할 수 있어야 함.  
Plus는 "더 깊은 이해"를 위한 것이지, "기본 기능의 잠금"이 아님.

---

## G. CARD / FINANCIAL INFRASTRUCTURE GO-NO GO CONDITIONS

### PRODUCT TRACK Go/No-Go (다차원 기준)

아래 기준 중 **Financial Partner + Legal Review는 필수**.  
나머지는 **7개 중 5개 이상** 충족 시 Go.

| 기준 | Go 임계값 | 측정 방법 |
|---|---|---|
| **[필수]** Financial Partner | BaaS/선불 계약 완료 | 계약서 |
| **[필수]** Legal Review | 법무법인 의견서 완료 | 의견서 |
| Child D30 Retention | > 40% | 코호트 |
| WAFK Rate | > 50% | 주간 이벤트 |
| Goal 달성률 | > 30% | goals 테이블 |
| Core Loop 완주율 | > 50% | 이벤트 퍼널 |
| Parent NPS | > 40 | 월간 서베이 |
| Parent D30 Retention | > 50% | 코호트 |
| LTV/CAC | > 3x | 수익 모델 기반 |

### FINANCIAL INFRASTRUCTURE TRACK (지금 시작)

**병렬로 진행. Product Track 결과와 무관하게 시작.**

- BaaS 업체 미팅 (공개 정보 기반 후보 탐색 후 직접 협의)
- 법무법인 자문 계약
- 사업 구조 설계 (어떤 라이선스를 누가 보유할 것인가)
- 규제 샌드박스 신청 여부 검토

---

## H. TOP 5 RISKS

### Risk 1: 아이가 자발적으로 사용하지 않는다

**시나리오**: 부모가 앱을 설치하지만, 아이는 부모가 "해라"고 할 때만 씀.  
**발생 조건**: Goal 없이 미션만 있는 현재 구조가 지속될 때.  
**대응**: Goal System P0 개발. 아이의 자발적 Return Reason = "목표까지 얼마 남았지?"  
**신호**: WAFK Rate가 30% 이하로 떨어지면 위기.

### Risk 2: 경쟁사가 Loop를 복사한다

**시나리오**: 카카오뱅크 mini가 "행동 미션 + 이자율" 기능을 추가.  
**발생 조건**: Monari 사용자 규모가 작아 데이터 자산이 없을 때.  
**대응**: 첫 2년 내 10,000가족 확보 + 종단 데이터 축적. 데이터가 쌓인 후에는 복사가 불가능.  
**신호**: 경쟁사 공식 발표 + Monari MAU 정체.

### Risk 3: 부모가 미션 설정을 게을리한다

**시나리오**: 바쁜 부모들이 초기에 미션을 설정한 후 업데이트하지 않음.  
Loop의 8단계가 약해지면 9단계(재진입)가 없어짐.  
**발생 조건**: 온보딩 이후 부모 참여 설계 없을 때.  
**대응**: "이달 미션 업데이트 추천" 주간 알림. Parent Coaching이 구체적 미션 제안 포함.  
**신호**: 미션 생성 후 30일 이상 업데이트 없는 가족 비율 > 50%.

### Risk 4: 실물 카드 없이 중학생 이탈

**시나리오**: 13세가 되면 토스 유스카드로 이동. Monari는 "어릴 때 쓰던 앱"으로 인식.  
**발생 조건**: Phase 3가 18개월 이상 지연될 때.  
**대응**: Phase 3 FINANCIAL INFRASTRUCTURE TRACK을 지금 시작. 13세+ 전용 UX(TEEN/OLDER_TEEN) 먼저 개발해 이탈 방어.  
**신호**: 13세 이상 코호트의 이탈률이 12세 이하보다 유의미하게 높을 때.

### Risk 5: Longitudinal Data Thesis가 실현되지 않는다

**시나리오**: 사용자들이 평균 2년 사용하고 이탈. 7-18세 종단 데이터가 없어 데이터 자산 미형성.  
**발생 조건**: Retention이 낮거나, 경쟁사로 이탈하거나, 서비스가 성장 못 할 때.  
**반론**: 종단 데이터 자체의 사업적 가치를 어떻게 수익화할 것인가? B2B 데이터 판매는 개인정보 이슈. 이 Thesis는 "장기 보험"이지 단기 수익원이 아님.  
**대응**: 데이터 자산을 수익화하는 방법을 미리 설계. AI Coaching이 가장 현실적인 방향.

---

## H-BONUS: PRODUCT THESIS 반대 관점에서의 강한 비판

*(Point 15 요청 — 진짜 경쟁우위에 대한 반대 관점)*

**Monari의 Product Thesis에 대한 5가지 강한 반론:**

### 반론 1: "가상 Wallet으로는 진짜 금융습관을 만들 수 없다"

진짜 금융습관은 **실제 돈이 움직일 때** 형성된다.  
앱에서 숫자를 나누는 것은 "금융 교육 게임"이지 "금융 경험"이 아니다.  
아이가 편의점에서 실제로 카드로 결제하고, 잔액이 줄어드는 것을 느끼는 것과  
앱에서 버튼을 눌러 숫자가 바뀌는 것은 근본적으로 다른 경험이다.  
**실물 카드 없이 제공하는 금융습관 서비스는 진짜 금융교육이 아닐 수 있다.**

*반론에 대한 응답*: 맞다. 그러나 실물 카드 이전 단계에서도 "계획 → 배분 → 목표 → 달성"의 Loop는 유효한 훈련이다. 카드는 Loop를 완성하는 요소이지 Loop 자체가 아니다. Phase 3에서 카드가 추가되면 훈련이 실전으로 전환된다.

### 반론 2: "부모가 지속적으로 관여할 수 없다"

Monari의 Core Loop는 부모의 적극적 관여를 전제로 한다.  
실제로 맞벌이 부모, 바쁜 부모가 매주 미션을 설계하고, 승인하고, 리포트를 보는 게 현실적인가?  
한국 부모의 평균 앱 사용 시간과 attention을 과대 평가했을 가능성이 있다.  
**부모 관여도가 낮아지면 Loop 전체가 무너진다.**

*반론에 대한 응답*: 인정. Parent Friction을 최소화하는 설계가 필수. 미션 자동 제안, 승인 알림 최소화, "설정 후 잊기" 용돈 자동화. Loop는 부모 없이도 어느 정도 돌아가야 한다.

### 반론 3: "종단 데이터는 윤리적 지뢰밭이다"

"아이의 7-18세 금융행동 종단 데이터"를 어떻게 사용할 것인가?  
B2B 금융사 판매? → 부모가 알면 탈퇴한다.  
AI Coaching 내부 활용? → 어느 단계에서 부모의 동의를 받아야 하는가?  
GDPR/개인정보보호법상 미성년자 데이터 처리 동의 구조는 매우 복잡하다.  
**데이터 자산 Thesis는 실현되기 전에 규제에 막힐 수 있다.**

*반론에 대한 응답*: 데이터 활용 범위를 처음부터 명확히 제한하고 부모 동의를 얻어야 한다. B2B 원시 데이터 판매는 선택지에서 제거. 데이터는 내부 AI Coaching 개선 + 익명 집계 통계만 활용.

### 반론 4: "Toss가 같은 것을 18개월 내에 만들 수 있다"

토스는 이미 청소년 시장에 있고, 대규모 엔지니어링 조직을 갖추고 있다.  
Monari의 핵심인 "Mission → 이자율 → Goal → Loop" 구조를 6-12개월 내 클론하는 것이 불가능한가?  
**Monari가 데이터 Moat를 구축하기 전에 토스가 따라온다면?**

*반론에 대한 응답*: 맞다. 토스가 복사하면 Monari에게 최악의 시나리오. 방어 전략: (1) 교육/코칭 콘텐츠 영역에서 차별화 (토스는 이 영역에 관심 없음), (2) 학교/교육기관 파트너십 (토스는 B2B 교육 시장 진입 동기 없음), (3) 빠른 가족 네트워크 구축 (부모-조부모 연결은 재현하기 어려운 신뢰 관계). 단, 토스 클론 리스크는 실재한다. 과소평가 금지.

### 반론 5: "초등학생 대상 구독 결제는 시장이 너무 좁다"

한국 초등학생(7-12세) 약 270만 명. 이 중 몇 %가 유료 앱을 쓰는 부모를 갖는가?  
월 3,900원 구독을 지불하는 부모 수 = 전체 TAM의 10%라면 = 27만 가족.  
Plus 전환율 15% = 4만 가족. 연 매출 = 약 18억원.  
이것이 충분한 사업 규모인가?  
**초등학생 + 구독 모델의 조합은 TAM이 너무 좁을 수 있다.**

*반론에 대한 응답*: TAM을 초등학생에서 7-18세로 확장하면 5배 증가. 카드 수수료, B2B 교육 수익, 금융사 파트너십을 추가하면 구독 의존도가 낮아진다. 그러나 초기에는 구독 모델만으로 운영해야 하므로, 초등 + 중학생 부모를 최대한 빠르게 확보하는 것이 핵심.

---

## I. 대표가 지금 승인해야 할 결정 5개

---

**[결정 1] Phase 1 P0 범위 최종 확정**

아래 6개를 Phase 1 P0으로 확정할 것인가?

1. Goal System 신규 개발
2. 아이 Home 전면 재설계
3. 아이 바텀탭 4탭 구조
4. Family DB Architecture + Migration
5. Push Notification 완성
6. 온보딩 재설계

**Claude 추천**: 확정. 이 6개 없이는 Core Loop가 작동하지 않는다.  
**결정 시 필요한 것**: 개발 기간 추정 (Claude는 약 6-10주 예상).

---

**[결정 2] Family DB Architecture 시작 시기**

Family DB 재설계는 이후 모든 확장의 기반이다.  
단, 기존 서비스 중단 없이 Migration해야 한다.

**Claude 추천**: Phase 1에서 즉시 시작. 단, 기존 `children.parent_id`와 `child_guardians`는 보존하고 새 구조를 병렬로 구축.

**대표가 결정할 것**: Migration 중 서비스 중단 허용 여부 (배포 전략).

---

**[결정 3] Goal Sponsorship Matching 모델 확정**

세 가지 옵션:

- **옵션 A** (추천): 아이 N원 저금 시 가족이 M원 Matching
- **옵션 B**: Milestone 달성 시 일괄 보너스
- **옵션 C**: 가족이 자유롭게 선택

**Claude 추천**: MVP에서는 옵션 A만. 단순하고 아이 저축 동기를 가장 강하게 강화.

**대표가 결정할 것**: 어떤 Matching 모델을 Phase 1/2에서 우선 구현할 것인가.

---

**[결정 4] Financial Infrastructure Track 시작**

카드/실물 Wallet 파트너 탐색을 지금 시작할 것인가?  
이것은 Product 개발과 별개로 진행 가능하다.

**Claude 추천**: 즉시 시작. BaaS 파트너 미팅과 법무 자문 계약. Product Track과 독립적으로 진행.

**대표가 결정할 것**: 법무법인 자문 예산 및 BaaS 파트너 탐색 인원 지정.

---

**[결정 5] Launch Core Target 및 마케팅 집중점**

Phase 1에서 마케팅을 어디에 집중할 것인가?

- **옵션 A**: 초등 학부모 커뮤니티 (맘카페) — 비용 효율 높음, 타겟 정확
- **옵션 B**: 초등학교/학원 파트너십 — 클래스 단위 대량 확보 가능
- **옵션 C**: 아동 콘텐츠 채널 (유튜브/인스타) — 브랜드 인지도

**Claude 추천**: 옵션 A + B 동시 진행. 옵션 A로 즉시 시작, 옵션 B는 3개월 내 파일럿.  
**목표**: Phase 1 종료 전 500가족 확보.

---

*이 문서는 대표의 검토와 승인을 위한 전략 수정 문서입니다.*  
*승인 전 코드/DB 변경은 없습니다.*  
*기준 문서: MONARI_PRODUCT_STRATEGY_V3.md (보존)*  
*작성: Claude Code · 2026-08-28*
