-- 동네별 또래 비교 기능
-- 1. profiles에 region 컬럼 추가
-- 2. refresh_peer_stats 함수 생성 (주별 전국+지역 집계)
-- 3. run_monthly_settlement 업데이트 (기존 blocked insert → refresh_peer_stats 호출)

-- ────────────────────────────────────────────────────────────
-- 1. profiles.region
-- ────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists region text;

-- ────────────────────────────────────────────────────────────
-- 2. refresh_peer_stats: 월별 전국 + 지역 peer_stats 삽입
-- ────────────────────────────────────────────────────────────
create or replace function public.refresh_peer_stats(p_year integer, p_month integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date;
begin
  v_week_start := date_trunc('week', make_date(p_year, p_month, 1))::date;

  -- 이 주차 데이터 초기화 (멱등)
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
        select sum(mt.amount)
        from public.money_transactions mt
        where mt.child_id = c.id
          and mt.type = 'allowance'
          and extract(year from mt.tx_date) = p_year
          and extract(month from mt.tx_date) = p_month
      ), 0) as total_allowance,
      coalesce((
        select sum(mt.savings_delta)
        from public.money_transactions mt
        where mt.child_id = c.id
          and mt.savings_delta > 0
          and extract(year from mt.tx_date) = p_year
          and extract(month from mt.tx_date) = p_month
      ), 0) as total_saved,
      coalesce(bs.computed_score, 0) as behavior_rate
    from public.children c
    left join public.behavior_scores bs
      on bs.child_id = c.id and bs.year = p_year and bs.month = p_month
    where c.deleted_at is null
  )
  select
    v_week_start,
    age_group,
    null::text,
    round(avg(total_allowance))::integer,
    round(avg(case when total_allowance > 0 then (total_saved::numeric / total_allowance) * 100 else 0 end)::numeric, 1),
    round(avg(behavior_rate)::numeric, 1),
    '[]'::jsonb,
    count(*)::integer
  from child_stats
  group by age_group
  having count(*) >= 1;

  -- 지역별 집계 (region IS NOT NULL, 부모가 지역 설정한 아이만)
  -- 최소 5명 이상인 경우에만 삽입 (개인정보 보호)
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
        select sum(mt.amount)
        from public.money_transactions mt
        where mt.child_id = c.id
          and mt.type = 'allowance'
          and extract(year from mt.tx_date) = p_year
          and extract(month from mt.tx_date) = p_month
      ), 0) as total_allowance,
      coalesce((
        select sum(mt.savings_delta)
        from public.money_transactions mt
        where mt.child_id = c.id
          and mt.savings_delta > 0
          and extract(year from mt.tx_date) = p_year
          and extract(month from mt.tx_date) = p_month
      ), 0) as total_saved,
      coalesce(bs.computed_score, 0) as behavior_rate
    from public.children c
    join public.profiles pr on pr.id = c.parent_id and pr.region is not null
    left join public.behavior_scores bs
      on bs.child_id = c.id and bs.year = p_year and bs.month = p_month
    where c.deleted_at is null
  )
  select
    v_week_start,
    age_group,
    region,
    round(avg(total_allowance))::integer,
    round(avg(case when total_allowance > 0 then (total_saved::numeric / total_allowance) * 100 else 0 end)::numeric, 1),
    round(avg(behavior_rate)::numeric, 1),
    '[]'::jsonb,
    count(*)::integer
  from child_stats
  group by age_group, region
  having count(*) >= 5;
end;
$$;

revoke all on function public.refresh_peer_stats(integer, integer) from public, anon, authenticated;
grant execute on function public.refresh_peer_stats(integer, integer) to service_role;

-- ────────────────────────────────────────────────────────────
-- 3. run_monthly_settlement 업데이트:
--    기존 blocked insert → refresh_peer_stats 호출
-- ────────────────────────────────────────────────────────────
create or replace function public.run_monthly_settlement(p_year integer, p_month integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_run_id uuid;
  v_run_status text;
  v_child record;
  v_wallet record;
  v_policy record;
  v_rule record;
  v_first_day date;
  v_last_day date;
  v_next_month_first date;
  v_total_attempts integer;
  v_success_count integer;
  v_computed_score numeric;
  v_rate_delta numeric;
  v_achieved_rules text[];
  v_interest_amount integer;
  v_period_rate numeric;
  v_new_rate numeric;
  v_reason text;
  v_success_total integer := 0;
  v_failure_total integer := 0;
  v_skip_total integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_log_total integer;
  v_log_approved integer;
  v_rule_rate numeric;
  v_achieved boolean;
  v_allowance_sum integer;
  v_spend_sum integer;
  v_save_sum integer;
  v_interest_sum integer;
  v_borrow_sum integer;
begin
  -- service role(uid=null)은 항상 허용, authenticated는 admin만
  if auth.uid() is not null then
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
      raise exception 'Admin required';
    end if;
  end if;

  v_first_day        := make_date(p_year, p_month, 1);
  v_last_day         := (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date;
  v_next_month_first := (make_date(p_year, p_month, 1) + interval '1 month')::date;

  -- run 생성 (이미 success면 그대로 반환)
  insert into public.settlement_runs (year, month, status)
  values (p_year, p_month, 'running')
  on conflict (year, month) do update
    set status = case when settlement_runs.status = 'success' then 'success' else 'running' end,
        started_at = case when settlement_runs.status = 'success' then settlement_runs.started_at else now() end
  returning id, status into v_run_id, v_run_status;

  if v_run_status = 'success' then
    select success_count, failure_count into v_success_total, v_failure_total
    from public.settlement_runs where id = v_run_id;
    return jsonb_build_object('ok', true, 'alreadyDone', true,
      'year', p_year, 'month', p_month,
      'successCount', v_success_total, 'failureCount', v_failure_total);
  end if;

  for v_child in
    select c.id, c.birth_year, c.parent_id
    from public.children c
    where c.deleted_at is null
  loop
    -- 이미 성공한 아이 skip
    if exists (
      select 1 from public.settlement_child_runs
      where run_id = v_run_id and child_id = v_child.id and status = 'success'
    ) then
      v_skip_total := v_skip_total + 1;
      continue;
    end if;

    insert into public.settlement_child_runs (run_id, child_id, status)
    values (v_run_id, v_child.id, 'pending')
    on conflict (run_id, child_id) do update set status = 'pending', failure_reason = null;

    begin
      select * into v_wallet from public.wallet_snapshots where child_id = v_child.id;
      select * into v_policy from public.interest_policies where child_id = v_child.id;

      if v_wallet is null or v_policy is null then
        update public.settlement_child_runs
        set status = 'skipped', failure_reason = '지갑 또는 이자 정책 미설정', processed_at = now()
        where run_id = v_run_id and child_id = v_child.id;
        v_skip_total := v_skip_total + 1;
        continue;
      end if;

      select count(*), count(*) filter (where bl.status = 'approved')
      into v_total_attempts, v_success_count
      from public.behavior_logs bl
      where bl.child_id = v_child.id
        and bl.behavior_date between v_first_day and v_last_day;

      v_computed_score := case when v_total_attempts > 0
        then (v_success_count::numeric / v_total_attempts) * 100 else 0 end;

      v_rate_delta := 0;
      v_achieved_rules := array[]::text[];

      for v_rule in
        select br.id, br.title, br.interest_delta, br.rule_category, br.monthly_target_rate
        from public.behavior_rules br
        where br.parent_id = v_child.parent_id and br.is_active = true
      loop
        select count(*), count(*) filter (where bl.status = 'approved')
        into v_log_total, v_log_approved
        from public.behavior_logs bl
        where bl.child_id = v_child.id
          and bl.behavior_rule_id = v_rule.id
          and bl.behavior_date between v_first_day and v_last_day;

        if v_rule.rule_category = 'monthly_goal' then
          v_achieved := v_log_approved >= 1;
        else
          v_rule_rate := case when v_log_total > 0
            then (v_log_approved::numeric / v_log_total) * 100 else 0 end;
          v_achieved := v_rule_rate >= coalesce(v_rule.monthly_target_rate, 80);
        end if;

        if v_achieved and v_rule.interest_delta <> 0 then
          v_rate_delta := v_rate_delta + v_rule.interest_delta;
          v_achieved_rules := v_achieved_rules || v_rule.title;
        end if;
      end loop;

      v_rate_delta := round(v_rate_delta::numeric, 2);
      v_new_rate := least(v_policy.max_interest_rate,
                    greatest(v_policy.min_interest_rate,
                      v_wallet.current_interest_rate + v_rate_delta));

      v_period_rate := case when v_policy.settlement_cycle = 'monthly'
        then v_wallet.current_interest_rate / 100.0 / 12
        else v_wallet.current_interest_rate / 100.0 / 52 end;
      v_interest_amount := round(v_wallet.savings_balance * v_period_rate);

      insert into public.behavior_scores (child_id, year, month, total_attempts, success_count, computed_score, rate_adjustment)
      values (v_child.id, p_year, p_month, v_total_attempts, v_success_count, v_computed_score, v_rate_delta)
      on conflict (child_id, year, month) do update
        set total_attempts = excluded.total_attempts, success_count = excluded.success_count,
            computed_score = excluded.computed_score, rate_adjustment = excluded.rate_adjustment;

      if v_interest_amount > 0 then
        insert into public.money_transactions (child_id, tx_date, type, amount, savings_delta, borrowed_delta, memo)
        values (v_child.id, v_last_day, 'interest', v_interest_amount, 0, 0,
                p_year || '년 ' || p_month || '월 이자 정산');
      end if;

      if v_rate_delta <> 0 then
        v_reason := case when array_length(v_achieved_rules, 1) > 0
          then p_year || '년 ' || p_month || '월 달성: ' || array_to_string(v_achieved_rules, ', ')
               || ' → 다음 달 이자율 '
               || case when v_rate_delta > 0 then '+' else '' end
               || v_rate_delta || '%p 반영'
          else p_year || '년 ' || p_month || '월 달성 약속 없음' end;

        insert into public.interest_rate_events (child_id, rate_delta, applied_rate, reason, effective_date)
        values (v_child.id, v_rate_delta, v_new_rate, v_reason, v_next_month_first);
      end if;

      select
        coalesce(sum(amount) filter (where type in ('allowance','reward')), 0),
        coalesce(sum(amount) filter (where type = 'spend'), 0),
        coalesce(sum(amount) filter (where type = 'save'), 0),
        coalesce(sum(amount) filter (where type = 'interest'), 0),
        coalesce(sum(amount) filter (where type = 'borrow'), 0)
      into v_allowance_sum, v_spend_sum, v_save_sum, v_interest_sum, v_borrow_sum
      from public.money_transactions
      where child_id = v_child.id and tx_date between v_first_day and v_last_day;

      insert into public.monthly_reports (child_id, year, month, total_allowance, total_spend, total_save, total_interest, total_borrowed, behavior_success_rate)
      values (v_child.id, p_year, p_month, v_allowance_sum, v_spend_sum, v_save_sum, v_interest_sum, v_borrow_sum, v_computed_score)
      on conflict (child_id, year, month) do update
        set total_allowance = excluded.total_allowance, total_spend = excluded.total_spend,
            total_save = excluded.total_save, total_interest = excluded.total_interest,
            total_borrowed = excluded.total_borrowed, behavior_success_rate = excluded.behavior_success_rate;

      insert into public.notifications (parent_id, child_id, target, type, title, body)
      values (v_child.parent_id, v_child.id, 'parent', 'monthly_settlement',
              p_year || '년 ' || p_month || '월 이자 정산 완료',
              '이자 ' || v_interest_amount || '원 지급. ' ||
              case when v_rate_delta > 0 then '이자율 +' || v_rate_delta || '%p'
                   when v_rate_delta < 0 then '이자율 ' || v_rate_delta || '%p'
                   else '이자율 변동 없음' end || '.');

      insert into public.notifications (parent_id, child_id, target, type, title, body)
      values (v_child.parent_id, v_child.id, 'child', 'monthly_settlement',
              p_year || '년 ' || p_month || '월 이자가 들어왔어요!',
              '이자 ' || v_interest_amount || '원을 받았어요.');

      update public.settlement_child_runs
      set status = 'success', interest_amount = v_interest_amount,
          rate_adjustment = v_rate_delta, processed_at = now()
      where run_id = v_run_id and child_id = v_child.id;

      v_success_total := v_success_total + 1;

    exception when others then
      update public.settlement_child_runs
      set status = 'failed', failure_reason = sqlerrm, processed_at = now()
      where run_id = v_run_id and child_id = v_child.id;
      v_failure_total := v_failure_total + 1;
      v_errors := v_errors || jsonb_build_object('childId', v_child.id, 'reason', sqlerrm);
    end;
  end loop;

  -- peer_stats 집계: 전국 + 지역별 (refresh_peer_stats 호출)
  begin
    perform public.refresh_peer_stats(p_year, p_month);
  exception when others then
    null; -- peer_stats 집계 실패는 settlement 전체를 실패로 만들지 않음
  end;

  update public.settlement_runs
  set status = case when v_failure_total = 0 then 'success'
                    when v_success_total = 0 then 'failed'
                    else 'partial' end,
      success_count = v_success_total,
      failure_count = v_failure_total,
      completed_at = now()
  where id = v_run_id;

  return jsonb_build_object(
    'ok', true, 'year', p_year, 'month', p_month,
    'successCount', v_success_total,
    'failureCount', v_failure_total,
    'skipCount', v_skip_total,
    'errors', v_errors
  );
end;
$func$;

revoke all on function public.run_monthly_settlement(integer, integer) from public, anon, authenticated;
grant execute on function public.run_monthly_settlement(integer, integer) to service_role;
