create extension if not exists "pgcrypto";

create type public.app_role as enum ('parent', 'child', 'admin');
create type public.behavior_log_status as enum ('pending', 'completed', 'approved', 'rejected');
create type public.allowance_rule_type as enum ('weekly', 'monthly', 'behavior_based', 'manual');
create type public.money_transaction_type as enum ('allowance', 'reward', 'spend', 'save', 'unsave', 'borrow', 'repay', 'interest');
create type public.borrow_status as enum ('pending', 'approved', 'rejected', 'partial', 'repaid');
create type public.repayment_mode as enum ('next_allowance', 'installment');
create type public.repayment_status as enum ('scheduled', 'partial', 'paid', 'overdue');
create type public.interest_settlement_cycle as enum ('weekly', 'monthly');

-- ────────────────────────────────────────────────────────────
-- Core tables
-- ────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'parent',
  email text unique,
  name text not null,
  consent_version text,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  nickname text,
  birth_year integer not null,
  pin_code text,
  pin_failed_attempts integer not null default 0 check (pin_failed_attempts >= 0),
  pin_locked_until timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz                                    -- 소프트 삭제 (delete_child RPC)
);

create table if not exists public.behavior_rules (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  reward_amount integer not null default 0,
  interest_delta numeric(5,2) not null default 0,
  requires_parent_approval boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  rule_category text not null default 'recurring'
    check (rule_category in ('recurring', 'monthly_goal')),
  monthly_target_rate integer not null default 80
    check (monthly_target_rate between 1 and 100)
);

create table if not exists public.behavior_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  behavior_rule_id uuid not null references public.behavior_rules(id) on delete cascade,
  behavior_date date not null,
  status public.behavior_log_status not null default 'pending',
  memo text,
  photo_path text,                                          -- private bucket 경로 (signed URL로 조회)
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

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

-- Aggregated monthly behavior score per child (used by settlement engine)
create table if not exists public.behavior_scores (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  year integer not null,
  month integer not null,
  total_attempts integer not null default 0,
  success_count integer not null default 0,
  computed_score numeric(5,2) not null default 0,   -- 0–100 percentage
  rate_adjustment numeric(5,2) not null default 0,  -- net rate delta applied this month
  created_at timestamptz not null default now(),
  unique (child_id, year, month)
);

create table if not exists public.allowance_rules (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  type public.allowance_rule_type not null,
  title text not null,
  amount integer not null,
  weekday integer,
  day_of_month integer,
  behavior_rule_id uuid references public.behavior_rules(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_snapshots (
  child_id uuid primary key references public.children(id) on delete cascade,
  balance integer not null default 0,
  savings_balance integer not null default 0,
  borrowed_balance integer not null default 0,
  current_interest_rate numeric(5,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.money_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  tx_date date not null,
  type public.money_transaction_type not null,
  amount integer not null,
  savings_delta integer not null default 0,
  borrowed_delta integer not null default 0,
  related_behavior_log_id uuid references public.behavior_logs(id) on delete set null,
  related_borrow_request_id uuid,
  memo text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.interest_policies (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  base_interest_rate numeric(5,2) not null,
  min_interest_rate numeric(5,2) not null default 0,
  max_interest_rate numeric(5,2) not null default 20,
  settlement_cycle public.interest_settlement_cycle not null default 'monthly',
  created_at timestamptz not null default now(),
  unique (child_id)
);

create table if not exists public.interest_rate_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  behavior_rule_id uuid references public.behavior_rules(id) on delete set null,
  rate_delta numeric(5,2) not null,
  applied_rate numeric(5,2) not null,
  reason text not null,
  effective_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.borrow_requests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  requested_amount integer not null check (requested_amount > 0),
  purpose text,
  status public.borrow_status not null default 'pending',
  approved_by_parent uuid references public.profiles(id) on delete set null,
  repayment_mode public.repayment_mode not null default 'next_allowance',
  installment_count integer,
  interest_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.money_transactions
  add constraint money_transactions_related_borrow_request_id_fkey
  foreign key (related_borrow_request_id) references public.borrow_requests(id) on delete set null;

create table if not exists public.borrow_repayments (
  id uuid primary key default gen_random_uuid(),
  borrow_request_id uuid not null references public.borrow_requests(id) on delete cascade,
  due_date date not null,
  amount integer not null,
  paid_amount integer not null default 0,
  status public.repayment_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

-- Borrow conditions per child (P-L-01)
create table if not exists public.borrow_conditions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  max_amount integer not null default 10000,
  requires_purpose boolean not null default true,
  auto_approve_below integer not null default 0,
  created_at timestamptz not null default now(),
  unique (child_id)
);

create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  year integer not null,
  month integer not null,
  total_allowance integer not null default 0,
  total_spend integer not null default 0,
  total_save integer not null default 0,
  total_interest integer not null default 0,
  total_borrowed integer not null default 0,
  behavior_success_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (child_id, year, month)
);

-- Anonymous cohort stats for peer comparison (익명 비교 통계)
create table if not exists public.peer_stats (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null,
  age_group text not null,             -- '7-9', '10-12', '13-15'
  avg_behavior_score numeric(5,2) not null default 0,
  avg_savings_rate numeric(5,2) not null default 0,
  avg_interest_rate numeric(5,2) not null default 0,
  sample_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (year, month, age_group)
);

-- ────────────────────────────────────────────────────────────
-- Functions & triggers
-- ────────────────────────────────────────────────────────────

-- Create profile on first sign-up (always parent role)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, name, consent_version, consent_at)
  values (
    new.id,
    'parent',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, 'parent'), '@', 1)),
    case when new.raw_user_meta_data ->> 'consent_version' = '2026-06-10' then '2026-06-10' else null end,
    case when new.raw_user_meta_data ->> 'consent_version' = '2026-06-10' then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Initialise wallet_snapshot row when a child is created
create or replace function public.initialize_wallet_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallet_snapshots (child_id, balance, savings_balance, borrowed_balance, current_interest_rate)
  values (new.id, 0, 0, 0, 0)
  on conflict (child_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_child_created on public.children;
create trigger on_child_created
  after insert on public.children
  for each row execute procedure public.initialize_wallet_snapshot();

-- Atomically reserve a PIN attempt before the expensive hash comparison.
create or replace function public.consume_child_pin_attempt(p_child_id uuid)
returns table (attempt_allowed boolean, failed_attempts integer, locked_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.children
  set
    pin_failed_attempts = case
      when pin_locked_until > now() then pin_failed_attempts
      when pin_locked_until is not null then 1
      else pin_failed_attempts + 1
    end,
    pin_locked_until = case
      when pin_locked_until > now() then pin_locked_until
      when (case when pin_locked_until is not null then 1 else pin_failed_attempts + 1 end) > 5
        then now() + interval '15 minutes'
      else null
    end
  where id = p_child_id
  returning pin_locked_until is null or pin_locked_until <= now(), pin_failed_attempts, pin_locked_until;
end;
$$;

revoke all on function public.consume_child_pin_attempt(uuid) from public, anon, authenticated;
grant execute on function public.consume_child_pin_attempt(uuid) to service_role;

-- Keep wallet_snapshots.balance in sync with money_transactions
create or replace function public.sync_wallet_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id uuid;
  v_balance integer;
  v_savings integer;
  v_borrowed integer;
begin
  v_child_id := case when tg_op = 'DELETE' then old.child_id else new.child_id end;

  if not exists (select 1 from public.children where id = v_child_id) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select
    coalesce(sum(case
      when type in ('allowance','reward','interest','borrow','unsave') then amount
      when type in ('spend','save','repay') then -amount
      else 0
    end), 0),
    coalesce(sum(savings_delta), 0),
    coalesce(sum(borrowed_delta), 0)
  into v_balance, v_savings, v_borrowed
  from public.money_transactions
  where child_id = v_child_id;

  insert into public.wallet_snapshots (child_id, balance, savings_balance, borrowed_balance, updated_at)
  values (v_child_id, v_balance, v_savings, v_borrowed, now())
  on conflict (child_id) do update set
    balance = excluded.balance,
    savings_balance = excluded.savings_balance,
    borrowed_balance = excluded.borrowed_balance,
    updated_at = excluded.updated_at;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists on_money_transaction_change on public.money_transactions;
create trigger on_money_transaction_change
  after insert or update or delete on public.money_transactions
  for each row execute procedure public.sync_wallet_snapshot();

-- Keep wallet_snapshots.current_interest_rate in sync with interest_rate_events
create or replace function public.sync_interest_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wallet_snapshots
  set current_interest_rate = new.applied_rate, updated_at = now()
  where child_id = new.child_id;
  return new;
end;
$$;

-- Enforce child finance limits even when a client bypasses the application UI.
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
    where c.id = new.child_id and r.id = new.behavior_rule_id
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
  select bc.max_amount, bc.requires_purpose into v_max_amount, v_requires_purpose
  from public.borrow_conditions bc where bc.child_id = new.child_id;
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

create or replace function public.enforce_money_transaction_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer := 0;
  v_savings integer := 0;
  v_borrowed integer := 0;
  v_cash_delta integer := 0;
  v_expected_savings_delta integer := 0;
  v_expected_borrowed_delta integer := 0;
begin
  if new.amount <= 0 then
    raise exception 'Transaction amount must be greater than zero.';
  end if;

  v_cash_delta := case
    when new.type in ('allowance','reward','interest','borrow','unsave') then new.amount
    when new.type in ('spend','save','repay') then -new.amount
    else 0
  end;

  v_expected_savings_delta := case
    when new.type = 'save' then new.amount
    when new.type = 'unsave' then -new.amount
    else 0
  end;

  v_expected_borrowed_delta := case
    when new.type = 'borrow' then new.amount
    when new.type = 'repay' then -new.amount
    else 0
  end;

  if new.savings_delta <> v_expected_savings_delta then
    raise exception 'Transaction type and savings delta do not match.';
  end if;

  if new.borrowed_delta <> v_expected_borrowed_delta then
    raise exception 'Transaction type and borrowed delta do not match.';
  end if;

  select
    coalesce(sum(case
      when type in ('allowance','reward','interest','borrow','unsave') then amount
      when type in ('spend','save','repay') then -amount
      else 0
    end), 0),
    coalesce(sum(savings_delta), 0),
    coalesce(sum(borrowed_delta), 0)
  into v_balance, v_savings, v_borrowed
  from public.money_transactions
  where child_id = new.child_id
    and (tg_op = 'INSERT' or id <> old.id);

  v_balance := v_balance + v_cash_delta;
  v_savings := v_savings + v_expected_savings_delta;
  v_borrowed := v_borrowed + v_expected_borrowed_delta;

  if v_balance < 0 then
    raise exception 'Insufficient available balance.';
  end if;

  if v_savings < 0 then
    raise exception 'Insufficient savings balance.';
  end if;

  if v_borrowed < 0 then
    raise exception 'Repayment exceeds borrowed balance.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_money_transaction_limits_before_insert on public.money_transactions;
drop trigger if exists enforce_money_transaction_integrity_before_write on public.money_transactions;
create trigger enforce_money_transaction_integrity_before_write
  before insert or update of child_id, type, amount, savings_delta, borrowed_delta on public.money_transactions
  for each row execute procedure public.enforce_money_transaction_integrity();

drop trigger if exists on_interest_rate_event on public.interest_rate_events;
create trigger on_interest_rate_event
  after insert on public.interest_rate_events
  for each row execute procedure public.sync_interest_rate();

-- ────────────────────────────────────────────────────────────
-- Row-level security
-- ────────────────────────────────────────────────────────────

-- Fetch the authenticated family's application data in one PostgREST request.
-- SECURITY INVOKER keeps every table's existing RLS policy in effect.
create or replace function public.get_app_data_bundle()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'children', coalesce((
      select jsonb_agg(row_to_json(c) order by c.created_at)
      from (select id, parent_id, name, nickname, birth_year, created_at from public.children where deleted_at is null) c
    ), '[]'::jsonb),
    'behavior_rules', coalesce((select jsonb_agg(row_to_json(r) order by r.created_at) from public.behavior_rules r), '[]'::jsonb),
    'behavior_logs', coalesce((select jsonb_agg(row_to_json(l) order by l.behavior_date desc) from public.behavior_logs l), '[]'::jsonb),
    'allowance_rules', coalesce((select jsonb_agg(row_to_json(a) order by a.created_at) from public.allowance_rules a), '[]'::jsonb),
    'money_transactions', coalesce((select jsonb_agg(row_to_json(t) order by t.tx_date desc) from public.money_transactions t), '[]'::jsonb),
    'borrow_requests', coalesce((select jsonb_agg(row_to_json(b) order by b.created_at desc) from public.borrow_requests b), '[]'::jsonb),
    'borrow_repayments', coalesce((select jsonb_agg(row_to_json(p) order by p.due_date) from public.borrow_repayments p), '[]'::jsonb),
    'interest_policies', coalesce((select jsonb_agg(row_to_json(i) order by i.created_at) from public.interest_policies i), '[]'::jsonb),
    'interest_rate_events', coalesce((select jsonb_agg(row_to_json(e) order by e.effective_date desc) from public.interest_rate_events e), '[]'::jsonb),
    'wallet_snapshots', coalesce((select jsonb_agg(row_to_json(w) order by w.child_id) from public.wallet_snapshots w), '[]'::jsonb)
  );
$$;

revoke all on function public.get_app_data_bundle() from public, anon;
grant execute on function public.get_app_data_bundle() to authenticated;

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.behavior_rules enable row level security;
alter table public.behavior_logs enable row level security;
alter table public.behavior_scores enable row level security;
alter table public.allowance_rules enable row level security;
alter table public.wallet_snapshots enable row level security;
alter table public.money_transactions enable row level security;
alter table public.interest_policies enable row level security;
alter table public.interest_rate_events enable row level security;
alter table public.borrow_requests enable row level security;
alter table public.borrow_repayments enable row level security;
alter table public.borrow_conditions enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.peer_stats enable row level security;

-- profiles: own row only (admin sees all via service role)
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- children: select는 소프트 삭제 제외, insert/update는 별도 정책
create policy "children_select_by_parent" on public.children
  for select to authenticated
  using (parent_id = auth.uid() and deleted_at is null);

create policy "children_insert_by_parent" on public.children
  for insert to authenticated
  with check (parent_id = auth.uid());

create policy "children_update_by_parent" on public.children
  for update to authenticated
  using (parent_id = auth.uid() and deleted_at is null)
  with check (parent_id = auth.uid());

-- behavior_rules: parent owns rows
create policy "behavior_rules_by_parent" on public.behavior_rules
  for all using (parent_id = auth.uid());

-- behavior_logs: parent whose child owns the log
create policy "behavior_logs_by_parent" on public.behavior_logs
  for all using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- behavior_scores
create policy "behavior_scores_by_parent" on public.behavior_scores
  for all using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- allowance_rules
create policy "allowance_rules_by_parent" on public.allowance_rules
  for all using (parent_id = auth.uid())
  with check (
    parent_id = auth.uid()
    and (child_id is null or child_id in (select id from public.children where parent_id = auth.uid()))
  );

-- wallet_snapshots
create policy "wallet_snapshots_by_parent" on public.wallet_snapshots
  for select using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- money_transactions
create policy "money_transactions_by_parent" on public.money_transactions
  for select using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

create policy "money_transactions_insert_by_parent" on public.money_transactions
  for insert with check (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- interest_policies
create policy "interest_policies_by_parent" on public.interest_policies
  for all using (parent_id = auth.uid())
  with check (
    parent_id = auth.uid()
    and (child_id is null or child_id in (select id from public.children where parent_id = auth.uid()))
  );

-- interest_rate_events
create policy "interest_rate_events_by_parent" on public.interest_rate_events
  for all using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- borrow_requests
create policy "borrow_requests_by_parent" on public.borrow_requests
  for all using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- borrow_repayments
create policy "borrow_repayments_by_parent" on public.borrow_repayments
  for all using (
    borrow_request_id in (
      select br.id from public.borrow_requests br
      join public.children c on c.id = br.child_id
      where c.parent_id = auth.uid()
    )
  );

-- borrow_conditions
create policy "borrow_conditions_by_parent" on public.borrow_conditions
  for all using (parent_id = auth.uid())
  with check (
    parent_id = auth.uid()
    and child_id in (select id from public.children where parent_id = auth.uid())
  );

-- monthly_reports
create policy "monthly_reports_by_parent" on public.monthly_reports
  for all using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- peer_stats: read-only for everyone (anonymous aggregate data)
create policy "peer_stats_read" on public.peer_stats
  for select using (true);

-- Atomic approval workflows keep status changes and financial side effects in one transaction.
create unique index if not exists money_transactions_behavior_reward_once
  on public.money_transactions (related_behavior_log_id)
  where related_behavior_log_id is not null and type = 'reward';

create unique index if not exists money_transactions_borrow_credit_once
  on public.money_transactions (related_borrow_request_id)
  where related_borrow_request_id is not null and type = 'borrow';

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
  v_policy public.interest_policies%rowtype;
  v_current_rate numeric(5,2);
  v_next_rate numeric(5,2);
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

  select ip.* into v_policy from public.interest_policies ip where ip.child_id = v_log.child_id;
  if v_rule.interest_delta <> 0 and found then
    select coalesce(current_interest_rate, v_policy.base_interest_rate)
    into v_current_rate
    from public.wallet_snapshots ws
    where ws.child_id = v_log.child_id;

    v_next_rate := greatest(
      v_policy.min_interest_rate,
      least(coalesce(v_current_rate, v_policy.base_interest_rate) + v_rule.interest_delta, v_policy.max_interest_rate)
    );

    insert into public.interest_rate_events (
      child_id, behavior_rule_id, rate_delta, applied_rate, reason, effective_date
    )
    values (
      v_log.child_id, v_rule.id, v_rule.interest_delta, v_next_rate,
      v_rule.title || ' 승인', p_approved_date
    );
  end if;

  return query select v_log.id, v_log.child_id;
end;
$$;

create or replace function public.approve_borrow_request(
  p_borrow_request_id uuid,
  p_approval_date date
)
returns table (transaction_id uuid, child_id uuid, schedule_count integer)
language plpgsql
set search_path = public
as $$
declare
  v_request public.borrow_requests%rowtype;
  v_transaction_id uuid;
  v_installments integer;
  v_total_repayable integer;
  v_installment_amount integer;
  v_remainder integer;
begin
  select br.* into v_request
  from public.borrow_requests br
  join public.children c on c.id = br.child_id
  where br.id = p_borrow_request_id
    and br.status = 'pending'
    and c.parent_id = auth.uid()
  for update of br;

  if not found then
    return;
  end if;

  v_installments := case
    when v_request.repayment_mode = 'installment' then coalesce(v_request.installment_count, 3)
    else 1
  end;
  v_total_repayable := ceil(v_request.requested_amount * (1 + v_request.interest_rate / 100.0));
  v_installment_amount := floor(v_total_repayable::numeric / v_installments);
  v_remainder := v_total_repayable % v_installments;

  update public.borrow_requests
  set status = 'approved', approved_by_parent = auth.uid()
  where id = v_request.id;

  insert into public.money_transactions (
    child_id, tx_date, type, amount, savings_delta, borrowed_delta,
    related_borrow_request_id, memo, created_by
  )
  values (
    v_request.child_id, p_approval_date, 'borrow', v_request.requested_amount, 0,
    v_request.requested_amount, v_request.id, coalesce(v_request.purpose, '') || ' 미리쓰기 승인', auth.uid()
  )
  returning id into v_transaction_id;

  insert into public.borrow_repayments (borrow_request_id, due_date, amount, paid_amount, status)
  select
    v_request.id,
    p_approval_date + (installment_number * 7),
    v_installment_amount + case when installment_number <= v_remainder then 1 else 0 end,
    0,
    'scheduled'
  from generate_series(1, v_installments) as schedule(installment_number);

  return query select v_transaction_id, v_request.child_id, v_installments;
end;
$$;

revoke all on function public.approve_behavior_log(uuid, date) from public, anon;
grant execute on function public.approve_behavior_log(uuid, date) to authenticated;
revoke all on function public.approve_borrow_request(uuid, date) from public, anon;
grant execute on function public.approve_borrow_request(uuid, date) to authenticated;

create or replace function public.change_profile_role(
  p_profile_id uuid,
  p_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_role public.app_role;
  v_admin_count integer;
begin
  lock table public.profiles in share row exclusive mode;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  if p_role not in ('parent', 'admin') then
    raise exception 'Unsupported role';
  end if;

  select role into v_target_role
  from public.profiles
  where id = p_profile_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_target_role = 'admin' and p_role = 'parent' then
    select count(*) into v_admin_count from public.profiles where role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'The last admin cannot be demoted';
    end if;
  end if;

  update public.profiles set role = p_role where id = p_profile_id;
end;
$$;

revoke all on function public.change_profile_role(uuid, public.app_role) from public, anon;
grant execute on function public.change_profile_role(uuid, public.app_role) to authenticated;
