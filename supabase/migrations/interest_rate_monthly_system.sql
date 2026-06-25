-- 이자율 월말 반영 시스템
-- behavior_rules에 약속 유형 추가:
--   recurring     = 매일/매주 반복하는 습관. 월 달성률이 monthly_target_rate 이상이면 다음 달 이자율 반영
--   monthly_goal  = 한 달 단위 목표. 한 번이라도 승인되면 다음 달 이자율 반영

alter table public.behavior_rules
  add column if not exists rule_category text not null default 'recurring'
    check (rule_category in ('recurring', 'monthly_goal')),
  add column if not exists monthly_target_rate integer not null default 80
    check (monthly_target_rate between 1 and 100);

comment on column public.behavior_rules.rule_category is
  'recurring: 반복 습관(달성률 기준), monthly_goal: 월 목표(한번 달성시 반영)';
comment on column public.behavior_rules.monthly_target_rate is
  'recurring 유형: 이 비율 이상 달성 시 interest_delta 반영 (기본 80%)';

-- approve_behavior_log: 이자율 즉시 변경 로직 제거
-- 이자율은 월말 정산(monthly-settlement)에서만 조정됨
-- 보상금(reward)은 그대로 즉시 지급
create or replace function public.approve_behavior_log(
  p_behavior_log_id uuid,
  p_approved_date date
)
returns table (log_id uuid, child_id uuid)
language plpgsql
set search_path = public
as $$
declare
  v_log public.behavior_logs%rowtype;
  v_rule public.behavior_rules%rowtype;
begin
  select bl.* into v_log
  from public.behavior_logs bl
  join public.children c on c.id = bl.child_id
  where bl.id = p_behavior_log_id
    and bl.status = 'pending'
    and c.parent_id = auth.uid()
  for update of bl;

  if not found then
    return;
  end if;

  select * into v_rule
  from public.behavior_rules
  where id = v_log.behavior_rule_id and parent_id = auth.uid();

  if not found then
    raise exception 'Behavior rule does not belong to this family';
  end if;

  update public.behavior_logs
  set status = 'approved', approved_by = auth.uid()
  where id = v_log.id;

  -- 보상금 즉시 지급 (이자율은 월말 정산에서만 조정)
  if v_rule.reward_amount > 0 then
    insert into public.money_transactions (
      child_id, tx_date, type, amount, savings_delta, borrowed_delta,
      related_behavior_log_id, memo, created_by
    )
    values (
      v_log.child_id, p_approved_date, 'reward', v_rule.reward_amount, 0, 0,
      v_log.id, v_rule.title || ' 보상 승인', auth.uid()
    );
  end if;

  return query select v_log.id, v_log.child_id;
end;
$$;

-- 확인 쿼리
select
  (exists (
    select 1 from information_schema.columns
    where table_name = 'behavior_rules' and column_name = 'rule_category'
  )) as has_rule_category,
  (exists (
    select 1 from information_schema.columns
    where table_name = 'behavior_rules' and column_name = 'monthly_target_rate'
  )) as has_monthly_target_rate;
