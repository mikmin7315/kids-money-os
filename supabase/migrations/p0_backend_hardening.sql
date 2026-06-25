-- P0 보안 하드닝
-- 1. cash_spend_requests INSERT RLS: 소유권 검증
drop policy if exists "cash_requests_child_insert" on public.cash_spend_requests;
create policy "cash_requests_child_insert" on public.cash_spend_requests
  for insert to authenticated
  with check (
    child_id in (
      select id from public.children where parent_id = auth.uid()
    )
  );

-- 2. behavior_logs: photo_url → photo_path (signed URL용 경로만 저장)
-- 기존 컬럼이 있는 경우에만 변경 (없으면 추가)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'behavior_logs' and column_name = 'photo_url'
  ) then
    alter table public.behavior_logs rename column photo_url to photo_path;
  elsif not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'behavior_logs' and column_name = 'photo_path'
  ) then
    alter table public.behavior_logs add column photo_path text;
  end if;
end;
$$;

-- 3. parent_wallet_charges: status CHECK 제약 보강
alter table public.parent_wallet_charges
  drop constraint if exists parent_wallet_charges_status_check;
alter table public.parent_wallet_charges
  add constraint parent_wallet_charges_status_check
  check (status in ('pending', 'paid', 'rejected', 'failed', 'cancelled'));

-- 확인용 쿼리 (release-preflight에서 재사용)
select
  (exists (select 1 from pg_policies where tablename = 'cash_spend_requests' and policyname = 'cash_requests_child_insert')) as has_cash_insert_rls,
  (exists (select 1 from information_schema.columns where table_name = 'behavior_logs' and column_name = 'photo_path')) as has_photo_path_column;
