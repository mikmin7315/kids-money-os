# 전체 앱 품질 점검 및 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Monari 앱 전체를 순서대로 점검·개선하여 프로덕션 품질로 끌어올린다.

**Architecture:** 시각 점검(브라우저) → 기능 구현 → UX 보완 → 코드 품질 → 보안 문서 순서로 진행.

**Tech Stack:** Next.js 16 App Router, Supabase, Tailwind CSS, TypeScript, Vercel

## Global Constraints
- `.claude/worktrees/distracted-lehmann-9f5767` 절대 수정·스테이징 금지
- DB 직접 조작 금지 — 서버 액션 경유
- 컴포넌트 `'use client'` 명시 필수
- 커밋마다 `git push origin master`

---

### Task 1: 배포 앱 시안성 확인 (브라우저 점검)
- [ ] Vercel 앱 열어서 다크/라이트 모드 각 주요 화면 스크린샷
- [ ] 눈에 띄는 대비 문제 파악 및 즉시 수정
- [ ] 수정 사항 있으면 커밋·푸시

### Task 2: 알림 페이지 점검 및 구현 완성
- [ ] `src/app/notifications/page.tsx` 읽기
- [ ] 빠진 기능 파악 후 구현
- [ ] 커밋·푸시

### Task 3: 어드민 페이지 테마 점검
- [ ] admin 페이지들 CSS 변수 사용 여부 점검
- [ ] 누락된 테마 적용
- [ ] 커밋·푸시

### Task 4: 온보딩 플로우 점검
- [ ] `src/app/onboarding/` 읽기
- [ ] 신규 부모 가입 흐름 UX 점검 및 개선
- [ ] 커밋·푸시

### Task 5: 빈 상태(Empty State) UX 전수 점검
- [ ] 주요 페이지 empty state 코드 점검
- [ ] 밋밋한 empty state 개선
- [ ] 커밋·푸시

### Task 6: 아이 PIN 분실 처리 UI
- [ ] PIN 리셋 경로 파악
- [ ] 부모가 아이 PIN을 재설정하는 UI 추가 또는 개선
- [ ] 커밋·푸시

### Task 7: TypeScript & Lint 정리
- [ ] `npm run lint` 실행 → 에러/경고 목록
- [ ] 주요 이슈 수정
- [ ] 커밋·푸시

### Task 8: Edge Function 크론 보안 문서화
- [ ] `CRON_SECRET` 설정 방법 CLAUDE.md 또는 README에 추가
- [ ] vault 설정 순서 명확화
- [ ] 커밋·푸시
