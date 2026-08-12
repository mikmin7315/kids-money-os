# Cron & Edge Function 운영 가이드

Monari의 자동화 배치 작업 설정, 검증, 트러블슈팅을 위한 독립 런북.

---

## 크론 작업 목록

| 작업명 | 스케줄 (UTC) | KST | 기능 |
|--------|------------|-----|------|
| `monthly-interest-settlement` | `5 0 1 * *` | 매월 1일 09:05 | 전월 행동 달성률 → 이자율 이벤트 생성 |
| `daily-process-allowances` | `5 15 * * *` | 매일 00:05 | 정기 용돈 배치 (부모 → 아이 이체) |
| `daily-behavior-reminders` | `0 23 * * *` | 매일 08:00 | 행동 기록 독려 알림 발송 |
| `aggregate-peer-stats` | `5 0 * * 1` | 매주 월 09:05 | 익명 또래 통계 집계 |
| `daily-expire-subscriptions` | `5 1 * * *` | 매일 10:05 | 만료된 구독 상태 전환 |

---

## 새 환경 설정 (필수 순서 준수)

### 1단계 — Supabase Extension 활성화

**Supabase Dashboard → Database → Extensions**에서 확인:

- `pg_cron` — 크론 스케줄러
- `pg_net` — HTTP 아웃바운드 요청

비활성 상태면 토글로 활성화. 이미 활성이면 건너뜀.

### 2단계 — CRON_SECRET 생성

```bash
# macOS / Linux
openssl rand -base64 32

# PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

생성된 값을 안전한 곳에 보관. 다음 두 곳에 동일한 값을 설정한다.

### 3단계 — Edge Function Secrets 등록

**Supabase Dashboard → Edge Functions → Secrets** (또는 CLI):

```
CRON_SECRET=<2단계에서 생성한 값>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

> ⚠️ `SUPABASE_URL`은 trailing slash 없이. `SUPABASE_SERVICE_ROLE_KEY`는 Dashboard → Settings → API → `service_role` 키.

### 4단계 — Vault 시크릿 등록

**Supabase SQL Editor**에서 실행 (값은 따옴표 안에):

```sql
SELECT vault.create_secret('<CRON_SECRET값>', 'cron_secret');
SELECT vault.create_secret('https://<project-ref>.supabase.co', 'supabase_url');
SELECT vault.create_secret('<service_role_key>', 'supabase_service_role_key');
```

Vault 등록 확인:

```sql
SELECT name, decrypted_secret FROM vault.decrypted_secrets
WHERE name IN ('cron_secret', 'supabase_url', 'supabase_service_role_key');
-- 3행이 반환되어야 한다 (decrypted_secret 컬럼으로 조회; value 컬럼은 존재하지 않음)
```

### 5단계 — 크론 잡 등록

**SQL Editor**에서 `supabase/cron.sql` 전체 실행. 등록 확인:

```sql
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
-- 5개 잡이 active = true로 표시되어야 한다
```

### 6단계 — 로컬 `.env.local` 업데이트

```env
CRON_SECRET=<2단계에서 생성한 동일한 값>
```

---

## 정상 동작 확인

### Edge Function 수동 호출 (즉시 테스트)

```bash
# 용돈 배치 즉시 실행
curl -X POST \
  "https://<project-ref>.supabase.co/functions/v1/process-allowances" \
  -H "Authorization: Bearer <service_role_key>" \
  -H "x-cron-secret: <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{}'

# 월말 정산 즉시 실행 (이전 달 데이터가 있어야 의미 있음)
curl -X POST \
  "https://<project-ref>.supabase.co/functions/v1/monthly-settlement" \
  -H "Authorization: Bearer <service_role_key>" \
  -H "x-cron-secret: <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

기대 응답: `{"ok": true, ...}` 또는 처리 결과 JSON.

### pg_cron 실행 이력 조회

```sql
-- 최근 20건 실행 이력
SELECT
  j.jobname,
  r.runid,
  r.start_time AT TIME ZONE 'Asia/Seoul' AS kst_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
ORDER BY r.start_time DESC
LIMIT 20;
```

`status`가 `succeeded`이면 정상. `failed`이면 `return_message`로 원인 파악.

### Edge Function 로그 확인

**Supabase Dashboard → Edge Functions → [함수명] → Logs**

또는 Supabase CLI:

```bash
supabase functions logs monthly-settlement --project-ref <project-ref>
```

---

## 트러블슈팅

### 크론이 실행되지 않는다

1. **Extension 확인**: pg_cron, pg_net 모두 활성 상태인지 확인
2. **잡 등록 확인**: `SELECT * FROM cron.job;` — 잡이 없으면 `cron.sql` 재실행
3. **실행 이력 없음**: 등록은 됐지만 아직 스케줄 시간이 안 됐을 수 있음. 수동 호출로 함수 자체 동작 먼저 확인

### `Unauthorized` 401 응답

`x-cron-secret` 헤더값과 Edge Function에 등록된 `CRON_SECRET`이 다른 경우.

1. Edge Function Secrets의 `CRON_SECRET` 값을 복사
2. Vault의 `cron_secret` 값 확인:
   ```sql
   SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';
   ```
3. 두 값이 다르면 Vault 시크릿을 삭제 후 재등록:
   ```sql
   DELETE FROM vault.secrets WHERE name = 'cron_secret';
   SELECT vault.create_secret('<올바른값>', 'cron_secret');
   ```

### `Missing Supabase function secrets` 500 오류

Edge Function이 `SUPABASE_URL` 또는 `SUPABASE_SERVICE_ROLE_KEY`를 못 읽는 상태.

- Edge Function Secrets에 두 값이 등록됐는지 확인 (대소문자 구분)
- 함수를 재배포하면 시크릿 주입이 갱신됨: `supabase functions deploy <name>`

### 용돈 배치 실패 (`allowance_executions.status = 'failed'`)

```sql
-- 실패한 실행 내역 조회
SELECT child_id, scheduled_date, failure_reason, created_at
FROM allowance_executions
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

부모 지갑 잔액 부족이 가장 흔한 원인. 부모에게 알림이 이미 발송됐는지 확인:

```sql
SELECT * FROM notifications
WHERE type = 'allowance_failed'
ORDER BY created_at DESC
LIMIT 5;
```

### 월말 정산 결과가 없다

`monthly-settlement` 함수는 이전 달 데이터를 처리한다. 월 초 즉시 호출하면 이전 달 행동 기록이 있어야 결과가 생긴다.

```sql
-- 정산 실행 이력 확인
SELECT run_date, status, processed_at FROM settlement_runs ORDER BY run_date DESC LIMIT 5;
```

---

## 로컬 개발 테스트

### Edge Function 로컬 실행

```bash
supabase start
supabase functions serve monthly-settlement --env-file .env.local
```

별도 터미널에서 호출:

```bash
curl -X POST http://localhost:54321/functions/v1/monthly-settlement \
  -H "Authorization: Bearer <anon_key>" \
  -H "x-cron-secret: <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

> `.env.local`에 `CRON_SECRET`이 없으면 인증 검증을 건너뜀 (개발 편의 목적).  
> 운영 환경에서는 반드시 설정해야 한다.

---

## 보안 원칙

- `CRON_SECRET`은 최소 32자 이상의 무작위 문자열 사용
- 값은 Supabase Edge Function Secrets와 pg_cron vault 두 곳에만 보관; `.env.local`은 로컬 테스트 전용
- 팀원 간 공유 금지 — 새 환경마다 별도 생성
- 시크릿 노출 의심 시: 새 값 생성 → Edge Function Secrets 업데이트 → Vault 재등록 → `cron.sql` 재실행
