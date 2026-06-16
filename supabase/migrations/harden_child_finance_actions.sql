-- Prevent duplicate daily promises and enforce parent-configured child finance limits.

with ranked_logs as (
  select
    id,
    row_number() over (
      partition by child_id, behavior_rule_id, behavior_date
      order by created_at, id
    ) as duplicate_number
  from public.behavior_logs
  where status <> 'rejected'
)
update public.behavior_logs
set status = 'rejected'
where id in (select id from ranked_logs where duplicate_number > 1);

create unique index if not exists behavior_logs_daily_once
  on public.behavior_logs (child_id, behavior_rule_id, behavior_date)
  where status <> 'rejected';

create or replace function public.enforce_behavior_log_family()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.children c
    join public.behavior_rules r on r.parent_id = c.parent_id
    where c.id = new.child_id
      and r.id = new.behavior_rule_id
  ) then
    raise exception '약속과 아이가 같은 가족에 속하지 않습니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_behavior_log_family_before_write on public.behavior_logs;
create trigger enforce_behavior_log_family_before_write
  before insert or update of child_id, behavior_rule_id on public.behavior_logs
  for each row execute procedure public.enforce_behavior_log_family();

create or replace function public.enforce_borrow_request_conditions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_amount integer := 10000;
  v_requires_purpose boolean := true;
begin
  select bc.max_amount, bc.requires_purpose
  into v_max_amount, v_requires_purpose
  from public.borrow_conditions bc
  where bc.child_id = new.child_id;

  v_max_amount := coalesce(v_max_amount, 10000);
  v_requires_purpose := coalesce(v_requires_purpose, true);

  if new.requested_amount > v_max_amount then
    raise exception '미리쓰기 한도를 초과했습니다. 최대 %원까지 요청할 수 있습니다.', v_max_amount;
  end if;

  if v_requires_purpose and nullif(btrim(coalesce(new.purpose, '')), '') is null then
    raise exception '미리쓰기 목적을 입력해주세요.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_borrow_request_conditions_before_write on public.borrow_requests;
create trigger enforce_borrow_request_conditions_before_write
  before insert or update of child_id, requested_amount, purpose on public.borrow_requests
  for each row execute procedure public.enforce_borrow_request_conditions();

create or replace function public.enforce_money_transaction_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer := 0;
  v_savings integer := 0;
  v_borrowed integer := 0;
begin
  select ws.balance, ws.savings_balance, ws.borrowed_balance
  into v_balance, v_savings, v_borrowed
  from public.wallet_snapshots ws
  where ws.child_id = new.child_id
  for update;

  v_balance := coalesce(v_balance, 0);
  v_savings := coalesce(v_savings, 0);
  v_borrowed := coalesce(v_borrowed, 0);

  if new.type = 'repay' and new.amount > v_borrowed then
    raise exception '갚아야 할 금액보다 많이 갚을 수 없습니다.';
  end if;

  if new.type in ('spend', 'save', 'repay') and new.amount > v_balance then
    raise exception '사용 가능한 금액이 부족합니다.';
  end if;

  if new.type = 'unsave' and new.amount > v_savings then
    raise exception '저금한 금액이 부족합니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_money_transaction_limits_before_insert on public.money_transactions;
create trigger enforce_money_transaction_limits_before_insert
  before insert on public.money_transactions
  for each row execute procedure public.enforce_money_transaction_limits();
