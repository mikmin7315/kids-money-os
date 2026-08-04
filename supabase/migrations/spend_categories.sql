-- 지출 카테고리 추가
-- 1. cash_spend_requests, money_transactions에 category 컬럼 추가
-- 2. approve_cash_spend RPC 업데이트 (category 전달)
-- 3. refresh_peer_stats 업데이트 (spend_breakdown 실제 집계)

alter table public.cash_spend_requests
  add column if not exists category text;

alter table public.money_transactions
  add column if not exists category text;

-- ────────────────────────────────────────────────────────────
-- approve_cash_spend: category 포함해서 money_transactions에 삽입
-- ────────────────────────────────────────────────────────────
create or replace function public.approve_cash_spend(p_request_id uuid)
returns void language plpgsql security definer set search_path = public
as $fn$
declare
  v_req record;
  v_tx_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_req from public.cash_spend_requests
  where id = p_request_id for update;

  if not found then raise exception 'Request not found'; end if;
  if v_req.status <> 'pending' then raise exception 'Request already processed'; end if;
  if not exists (
    select 1 from public.children where id = v_req.child_id and parent_id = auth.uid()
  ) then raise exception 'Not authorized'; end if;

  insert into public.money_transactions (
    child_id, tx_date, type, amount, savings_delta, borrowed_delta, memo, category, created_by
  ) values (
    v_req.child_id, v_req.spend_date, 'spend', v_req.amount, 0, 0,
    coalesce(nullif(trim(coalesce(v_req.memo, '')), ''), '현금 사용'),
    v_req.category,
    auth.uid()
  )
  returning id into v_tx_id;

  update public.cash_spend_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), money_transaction_id = v_tx_id
  where id = p_request_id;
end;
$fn$;
revoke all on function public.approve_cash_spend(uuid) from public, anon;
grant execute on function public.approve_cash_spend(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────
-- refresh_peer_stats: spend_breakdown 실제 카테고리 집계
-- (category IS NOT NULL인 거래만 집계 — NULL은 구 데이터)
-- ────────────────────────────────────────────────────────────
create or replace function public.refresh_peer_stats(p_year integer, p_month integer)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_week_start date;
begin
  v_week_start := date_trunc('week', make_date(p_year, p_month, 1))::date;

  delete from public.peer_stats where week_start = v_week_start;

  -- 전국 집계 (region = NULL)
  insert into public.peer_stats (
    week_start, age_group, region,
    avg_allowance, avg_savings_rate, avg_behavior_rate,
    spend_breakdown, sample_size
  )
  with child_stats as (
    select
      c.id,
      case
        when (p_year - c.birth_year) <= 9  then '7-9'
        when (p_year - c.birth_year) <= 13 then '10-13'
        else '14-16'
      end as age_group,
      coalesce((
        select sum(mt.amount) from public.money_transactions mt
        where mt.child_id = c.id and mt.type = 'allowance'
          and extract(year from mt.tx_date) = p_year
          and extract(month from mt.tx_date) = p_month
      ), 0) as total_allowance,
      coalesce((
        select sum(mt.savings_delta) from public.money_transactions mt
        where mt.child_id = c.id and mt.savings_delta > 0
          and extract(year from mt.tx_date) = p_year
          and extract(month from mt.tx_date) = p_month
      ), 0) as total_saved,
      coalesce(bs.computed_score, 0) as behavior_rate
    from public.children c
    left join public.behavior_scores bs
      on bs.child_id = c.id and bs.year = p_year and bs.month = p_month
    where c.deleted_at is null
  ),
  spend_by_ag as (
    select
      case
        when (p_year - c.birth_year) <= 9  then '7-9'
        when (p_year - c.birth_year) <= 13 then '10-13'
        else '14-16'
      end as age_group,
      mt.category,
      count(*) as cnt
    from public.money_transactions mt
    join public.children c on c.id = mt.child_id
    where mt.type = 'spend'
      and mt.category is not null
      and extract(year from mt.tx_date) = p_year
      and extract(month from mt.tx_date) = p_month
      and c.deleted_at is null
    group by 1, 2
  )
  select
    v_week_start,
    cs.age_group,
    null::text,
    round(avg(cs.total_allowance))::integer,
    round(avg(case when cs.total_allowance > 0
                   then (cs.total_saved::numeric / cs.total_allowance) * 100
                   else 0 end)::numeric, 1),
    round(avg(cs.behavior_rate)::numeric, 1),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('label', s.category, 'pct', round(s.cnt * 100.0 / s.total_cnt, 1))
          order by s.cnt desc
        ) filter (where s.rn <= 4),
        '[]'::jsonb
      )
      from (
        select sa.category, sa.cnt,
               sum(sa.cnt) over () as total_cnt,
               row_number() over (order by sa.cnt desc) as rn
        from spend_by_ag sa
        where sa.age_group = cs.age_group
      ) s
    ),
    count(cs.id)::integer
  from child_stats cs
  group by cs.age_group
  having count(cs.id) >= 1;

  -- 지역별 집계 (region IS NOT NULL, 최소 5명)
  insert into public.peer_stats (
    week_start, age_group, region,
    avg_allowance, avg_savings_rate, avg_behavior_rate,
    spend_breakdown, sample_size
  )
  with child_stats as (
    select
      c.id,
      case
        when (p_year - c.birth_year) <= 9  then '7-9'
        when (p_year - c.birth_year) <= 13 then '10-13'
        else '14-16'
      end as age_group,
      pr.region,
      coalesce((
        select sum(mt.amount) from public.money_transactions mt
        where mt.child_id = c.id and mt.type = 'allowance'
          and extract(year from mt.tx_date) = p_year
          and extract(month from mt.tx_date) = p_month
      ), 0) as total_allowance,
      coalesce((
        select sum(mt.savings_delta) from public.money_transactions mt
        where mt.child_id = c.id and mt.savings_delta > 0
          and extract(year from mt.tx_date) = p_year
          and extract(month from mt.tx_date) = p_month
      ), 0) as total_saved,
      coalesce(bs.computed_score, 0) as behavior_rate
    from public.children c
    join public.profiles pr on pr.id = c.parent_id and pr.region is not null
    left join public.behavior_scores bs
      on bs.child_id = c.id and bs.year = p_year and bs.month = p_month
    where c.deleted_at is null
  ),
  spend_by_ag_region as (
    select
      case
        when (p_year - c.birth_year) <= 9  then '7-9'
        when (p_year - c.birth_year) <= 13 then '10-13'
        else '14-16'
      end as age_group,
      pr.region,
      mt.category,
      count(*) as cnt
    from public.money_transactions mt
    join public.children c on c.id = mt.child_id
    join public.profiles pr on pr.id = c.parent_id
    where mt.type = 'spend'
      and mt.category is not null
      and extract(year from mt.tx_date) = p_year
      and extract(month from mt.tx_date) = p_month
      and c.deleted_at is null
      and pr.region is not null
    group by 1, 2, 3
  )
  select
    v_week_start,
    cs.age_group,
    cs.region,
    round(avg(cs.total_allowance))::integer,
    round(avg(case when cs.total_allowance > 0
                   then (cs.total_saved::numeric / cs.total_allowance) * 100
                   else 0 end)::numeric, 1),
    round(avg(cs.behavior_rate)::numeric, 1),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('label', s.category, 'pct', round(s.cnt * 100.0 / s.total_cnt, 1))
          order by s.cnt desc
        ) filter (where s.rn <= 4),
        '[]'::jsonb
      )
      from (
        select sa.category, sa.cnt,
               sum(sa.cnt) over () as total_cnt,
               row_number() over (order by sa.cnt desc) as rn
        from spend_by_ag_region sa
        where sa.age_group = cs.age_group and sa.region = cs.region
      ) s
    ),
    count(cs.id)::integer
  from child_stats cs
  group by cs.age_group, cs.region
  having count(cs.id) >= 5;
end;
$$;

revoke all on function public.refresh_peer_stats(integer, integer) from public, anon, authenticated;
grant execute on function public.refresh_peer_stats(integer, integer) to service_role;
