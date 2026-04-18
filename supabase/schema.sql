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
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  nickname text,
  birth_year integer not null,
  pin_code text,
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

create table if not exists public.behavior_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  behavior_rule_id uuid not null references public.behavior_rules(id) on delete cascade,
  behavior_date date not null,
  status public.behavior_log_status not null default 'pending',
  memo text,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
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
  insert into public.profiles (id, role, email, name)
  values (
    new.id,
    'parent',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, 'parent'), '@', 1))
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

-- Keep wallet_snapshots.balance in sync with money_transactions
create or replace function public.sync_wallet_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_savings integer;
  v_borrowed integer;
begin
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
  where child_id = new.child_id;

  insert into public.wallet_snapshots (child_id, balance, savings_balance, borrowed_balance, updated_at)
  values (new.child_id, v_balance, v_savings, v_borrowed, now())
  on conflict (child_id) do update set
    balance = excluded.balance,
    savings_balance = excluded.savings_balance,
    borrowed_balance = excluded.borrowed_balance,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

drop trigger if exists on_money_transaction_change on public.money_transactions;
create trigger on_money_transaction_change
  after insert or update on public.money_transactions
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

drop trigger if exists on_interest_rate_event on public.interest_rate_events;
create trigger on_interest_rate_event
  after insert on public.interest_rate_events
  for each row execute procedure public.sync_interest_rate();

-- ────────────────────────────────────────────────────────────
-- Row-level security
-- ────────────────────────────────────────────────────────────

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

-- children: parent owns rows
create policy "children_by_parent" on public.children
  for all using (parent_id = auth.uid());

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
  for all using (parent_id = auth.uid());

-- wallet_snapshots
create policy "wallet_snapshots_by_parent" on public.wallet_snapshots
  for all using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- money_transactions
create policy "money_transactions_by_parent" on public.money_transactions
  for all using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- interest_policies
create policy "interest_policies_by_parent" on public.interest_policies
  for all using (parent_id = auth.uid());

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
  for all using (parent_id = auth.uid());

-- monthly_reports
create policy "monthly_reports_by_parent" on public.monthly_reports
  for all using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );

-- peer_stats: read-only for everyone (anonymous aggregate data)
create policy "peer_stats_read" on public.peer_stats
  for select using (true);
