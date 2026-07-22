# Codex 작업 스펙: peer_stats 백엔드

## 목적
Monari 전체 사용자 데이터를 익명 집계해서 "또래 비교" 리포트에 실데이터를 공급한다.
현재 `/reports` 페이지는 `MOCK_PEER` 상수를 사용 중 — 이 스펙대로 백엔드를 만들면 해당 상수를 실 RPC 호출로 교체한다.

---

## 1. 마이그레이션

파일: `supabase/migrations/peer_stats.sql`

```sql
-- 1-a. peer_stats 테이블
CREATE TABLE peer_stats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start       date NOT NULL,
  age_group        text NOT NULL
    CONSTRAINT peer_stats_age_group_check CHECK (age_group IN ('7-9','10-13','14-16')),
  region           text,                    -- NULL = 전국
  avg_allowance    int  NOT NULL,
  avg_savings_rate numeric(5,2) NOT NULL,
  avg_behavior_rate numeric(5,2) NOT NULL,
  spend_breakdown  jsonb NOT NULL,          -- [{label: string, pct: number}]
  sample_size      int  NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (week_start, age_group, COALESCE(region,'_'))
);

ALTER TABLE peer_stats ENABLE ROW LEVEL SECURITY;

-- 인증된 부모/어드민만 조회 (sample_size < 10은 익명성 보호)
CREATE POLICY "peer_stats_select" ON peer_stats
  FOR SELECT TO authenticated
  USING (sample_size >= 10);

-- 1-b. get_peer_stats RPC (리포트 페이지에서 호출)
CREATE OR REPLACE FUNCTION get_peer_stats(p_age_group text, p_region text DEFAULT NULL)
RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT row_to_json(p)
  FROM peer_stats p
  WHERE p.age_group = p_age_group
    AND (p_region IS NULL OR p.region = p_region)
    AND p.sample_size >= 10
  ORDER BY p.week_start DESC
  LIMIT 1;
$$;
```

---

## 2. Edge Function: `aggregate-peer-stats`

파일: `supabase/functions/aggregate-peer-stats/index.ts`

집계 로직:

```
1. children 테이블에서 birthYear 읽어 age_group 분류 (7-9 / 10-13 / 14-16)
2. money_transactions (type='allowance'|'reward') → 월 합산 → 그룹별 avg_allowance
3. money_transactions (type='save') / allowance → avg_savings_rate
4. behavior_logs (status='approved'|'completed') / total → avg_behavior_rate
5. money_transactions (type='spend', category 컬럼 있으면 사용, 없으면 '기타'로 단일 집계)
   → spend_breakdown: [{label, pct}] 상위 4개
6. sample_size = 해당 그룹 아이 수 (< 10이면 upsert 하지 않음)
7. peer_stats에 UPSERT (week_start = 이번주 월요일 date)
```

인증: `CRON_SECRET` 헤더 검증 (기존 monthly-settlement 함수와 동일 패턴).

---

## 3. 크론 등록 (`supabase/cron.sql` 에 추가)

```sql
SELECT cron.schedule(
  'aggregate-peer-stats',
  '5 0 * * 1',  -- 매주 월요일 00:05 UTC
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/aggregate-peer-stats',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## 4. 프론트엔드 연동 포인트

파일: `src/app/reports/page.tsx`

완성 후 아래 두 곳만 교체하면 됨:

```ts
// Before (mock)
const peer = MOCK_PEER[ageGroup] ?? MOCK_PEER["10-13"];

// After (실 RPC)
const supabase = await getSupabaseServerClient();
const { data: peer } = await supabase.rpc("get_peer_stats", {
  p_age_group: ageGroup,
  p_region: null,   // 추후 지역 필터 추가 가능
});
```

`MOCK_PEER` 상수 및 `getAgeGroup` 함수는 그대로 유지하거나 삭제.

---

## 5. 구독 상태 연동

`IS_PREMIUM`은 이미 `profiles.subscription_tier === 'plus'`로 연동됨.
결제 웹훅(결제선생 or 인앱결제) 완성 후 웹훅 핸들러에서:

```sql
UPDATE profiles SET subscription_tier = 'plus' WHERE id = $parent_id;
-- 해지 시
UPDATE profiles SET subscription_tier = 'free' WHERE id = $parent_id;
```

---

## 참고: 연령 계산 기준

```
children.birthYear (int) 필드 사용
현재 year - birthYear = 나이
7~9  → '7-9'
10~13 → '10-13'
14~  → '14-16'
```

`children` 테이블에 `birth_year` 컬럼 없으면 마이그레이션 추가 필요:
```sql
ALTER TABLE children ADD COLUMN IF NOT EXISTS birth_year int;
```
