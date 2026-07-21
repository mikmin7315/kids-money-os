# Monari 앱 기획 로드맵 (Claude Code + Codex 협업)

> 최종 업데이트: 2026-07-21  
> Claude Code 담당: UI/UX, 복잡한 비즈니스 로직, 서버 액션  
> Codex 담당: 반복 기능, 타입 개선, 테스트, 데이터 패칭

---

## ✅ 완료된 작업

### 온보딩 위저드 (`/setup/1~5`)
- 신규 사용자(아이 없음) → 자동 리다이렉트 (`bundle.children.length === 0`)
- 5단계 순차 플로우: 부모확인 → 아이추가(복수) → 용돈(아이별) → 이자율(아이별) → 행동약속
- 스텝 2: 아이 여러 명 추가 가능, 삭제 가능
- 스텝 3/4: `childIds`, `childNames`, `childIndex` URL 파라미터로 아이별 순환
- 뒤로가기: 스텝 내 이전 아이 → 이전 스텝 순서로 처리
- 완료 화면: 설정 항목 체크리스트

### 이자율 월간 리포트
- 부모 홈: 아이별 "이자율 리포트" 카드 (`/reports/interest/[childId]`)
- 아이 홈: 이자율 변동 배너 (올랐으면 🎉 보라, 내렸으면 😢 빨강)
- 상세 페이지: 달성 약속별 +N% 표시, 미달성 약속 표시, 다음 달 동기부여

---

## 🔄 진행 중 / 예정 작업

### [CODEX 우선] 타입 안전성 개선
- `settlement-report.ts`의 Supabase 쿼리 반환값 타입 명시
- `BehaviorLog`, `AllowanceRule` 등 공통 타입 완성도 점검
- `getAppDataBundle` 반환 타입과 실제 DB 컬럼 불일치 체크

### [CODEX] 행동 약속 알림 개선
현황: 부모가 아이 행동 기록을 승인할 때만 알림 발생  
목표: 
- 매일 아침 8시 "오늘 약속 체크했나요?" 아이 리마인더 푸시
- 미승인 행동 로그가 3일 이상 쌓이면 부모 알림
- 파일: `supabase/functions/process-allowances/index.ts` 참고하여 새 Edge Function 작성 또는 확장

### [CODEX] 설정 페이지 - 아이별 이자율 수정
현황: `/settings/interest` 에서 이자율 수정 가능하지만 UI가 단조로움  
목표: 아이 카드 형태로 이자율 범위(min/base/max) 슬라이더 또는 3단계 선택 UI로 개선  
파일: `src/app/settings/interest/page.tsx`

### [Claude Code] 용돈 기록 필터/검색
현황: `/records` 페이지에 전체 트랜잭션 목록만 있음  
목표:
- 아이별 필터 탭
- 월별 필터 (이달, 지난달, 전체)
- 거래 유형 필터 (용돈/저금/지출/이자/미리쓰기)
- 파일: `src/app/records/page.tsx`

### [Claude Code] 아이 홈 - 저금 목표 설정
현황: 저금 달성률 도넛 차트가 있지만 목표 금액을 설정 못함  
목표:
- 아이 또는 부모가 저금 목표 금액 설정
- DB: `wallet_snapshots.savings_goal` 컬럼 추가 마이그레이션 필요
- 아이 홈 달성률 계산을 실제 목표 기준으로 변경

### [Claude Code] 부모 홈 리포트 차트 개선
현황: 이달 저금/지출 숫자만 표시  
목표:
- 지난 3개월 트렌드 미니 라인차트 추가
- 아이별 이자율 히스토리 스파크라인

### [공통] Google Play 스토어 등록 완료 체크리스트
- [x] AAB 업로드 완료 (1.0.0)
- [ ] 스토어 등록정보 (한국어 스크린샷 5장 이상)
- [ ] 개인정보처리방침 URL 등록
- [ ] 앱 아이콘 512×512px
- [ ] 콘텐츠 등급 설문 완료
- [ ] 금융 기능 선언 (아이 금융 교육 도구, 실제 결제 없음)
- [ ] 타겟층: 만 18세 이상만 선택

---

## 아키텍처 원칙 (AI 협업 시 공통 준수)

```
1. DB 직접 조작 금지 → 반드시 서버 액션 경유
2. 미리쓰기 이자율은 클라이언트에서 받지 않음 → 서버에서 interestPolicies.baseInterestRate
3. 계좌번호는 마지막 4자리만 표시 (maskAccountNumber())
4. behavior-photos 버킷은 private → signed URL만
5. .claude/worktrees/distracted-lehmann-9f5767 절대 수정 금지
6. 'use client' 컴포넌트 명시 필수
7. 서버 액션은 src/actions/ 하위
```

---

## 데이터 흐름 핵심

```
부모 로그인
  └→ getAppDataBundle() → children, behaviorRules, interestPolicies, allowanceRules
  
매월 1일 KST 09:05
  └→ Edge Function: monthly-settlement
      └→ run_monthly_settlement(year, month)
          └→ behavior_scores (달성률)
          └→ interest_rate_events (이자율 변동)
          └→ monthly_reports (재무 요약)
          └→ notifications (부모/아이에게 알림)

매일 KST 00:05  
  └→ Edge Function: process-allowances
      └→ process_scheduled_allowances(date)
          └→ 부모 지갑 차감 → 아이 계좌 입금
```
