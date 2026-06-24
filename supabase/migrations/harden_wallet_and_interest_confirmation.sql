-- Make parent-wallet writes and child money movements server-controlled and atomic.

drop policy if exists "parent_wallet_owner" on public.parent_wallets;
create policy "parent_wallet_read_own" on public.parent_wallets
  for select to authenticated
  using (parent_id = auth.uid());

revoke insert, update, delete on public.parent_wallets from authenticated;
grant select on public.parent_wallets to authenticated;

drop policy if exists "parent_charges_owner" on public.parent_wallet_charges;
create policy "parent_charges_read_own" on public.parent_wallet_charges
  for select to authenticated
  using (parent_id = auth.uid());
create policy "parent_charges_request_own" on public.parent_wallet_charges
  for insert to authenticated
  with check (parent_id = auth.uid() and status = 'pending');

revoke update, delete on public.parent_wallet_charges from authenticated;
grant select, insert on public.parent_wallet_charges to authenticated;

create or replace function public.save_parent_bank_account(
  p_bank_name text,
  p_account_number text,
  p_account_holder text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(p_bank_name), '') is null
    or nullif(trim(p_account_number), '') is null
    or nullif(trim(p_account_holder), '') is null then
    raise exception 'Bank account fields are required';
  end if;

  insert into public.parent_wallets (parent_id, balance, bank_name, account_number, account_holder)
  values (auth.uid(), 0, trim(p_bank_name), trim(p_account_number), trim(p_account_holder))
  on conflict (parent_id) do update
  set bank_name = excluded.bank_name,
      account_number = excluded.account_number,
      account_holder = excluded.account_holder;
end;
$$;

revoke all on function public.save_parent_bank_account(text, text, text) from public, anon;
grant execute on function public.save_parent_bank_account(text, text, text) to authenticated;

create or replace function public.lock_child_wallet_for_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1
  from public.wallet_snapshots
  where child_id = new.child_id
  for update;
  return new;
end;
$$;

drop trigger if exists a_lock_child_wallet_before_transaction on public.money_transactions;
create trigger a_lock_child_wallet_before_transaction
  before insert or update of child_id, type, amount, savings_delta, borrowed_delta
  on public.money_transactions
  for each row execute procedure public.lock_child_wallet_for_transaction();

create or replace function public.give_allowance_from_parent_wallet(
  p_child_id uuid,
  p_amount integer,
  p_memo text,
  p_tx_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
  v_transaction_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_amount <= 0 or p_amount > 100000000 then
    raise exception 'Invalid allowance amount';
  end if;
  if not exists (
    select 1 from public.children
    where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'Child does not belong to current parent';
  end if;

  select balance into v_balance
  from public.parent_wallets
  where parent_id = auth.uid()
  for update;

  if not found or v_balance < p_amount then
    raise exception 'Insufficient parent wallet balance';
  end if;

  update public.parent_wallets
  set balance = balance - p_amount
  where parent_id = auth.uid();

  insert into public.money_transactions (
    child_id, tx_date, type, amount, savings_delta, borrowed_delta, memo, created_by
  ) values (
    p_child_id, p_tx_date, 'allowance', p_amount, 0, 0,
    coalesce(nullif(trim(p_memo), ''), '용돈 지급'), auth.uid()
  )
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

revoke all on function public.give_allowance_from_parent_wallet(uuid, integer, text, date) from public, anon;
grant execute on function public.give_allowance_from_parent_wallet(uuid, integer, text, date) to authenticated;

create table if not exists public.interest_rate_confirmations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  month_key date not null,
  confirmed_rate numeric(5,2) not null check (confirmed_rate >= 0 and confirmed_rate <= 100),
  confirmed_by uuid not null references public.profiles(id),
  confirmed_at timestamptz not null default now(),
  unique (child_id, month_key),
  check (month_key = date_trunc('month', month_key)::date)
);

alter table public.interest_rate_confirmations enable row level security;
drop policy if exists "interest_rate_confirmations_by_parent" on public.interest_rate_confirmations;
create policy "interest_rate_confirmations_by_parent" on public.interest_rate_confirmations
  for select to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create or replace function public.confirm_interest_rate(p_child_id uuid, p_month text)
returns table (confirmed_rate numeric(5,2))
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date;
  v_rate numeric(5,2);
  v_min numeric(5,2);
  v_max numeric(5,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_month !~ '^[0-9]{4}-[0-9]{2}$' then
    raise exception 'Invalid confirmation month';
  end if;
  v_month := to_date(p_month || '-01', 'YYYY-MM-DD');

  if not exists (
    select 1 from public.children
    where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'Child does not belong to current parent';
  end if;

  select ip.min_interest_rate, ip.max_interest_rate
  into v_min, v_max
  from public.interest_policies ip
  where ip.child_id = p_child_id and ip.parent_id = auth.uid();
  if not found then
    raise exception 'Interest policy not found';
  end if;

  select greatest(v_min, least(ws.current_interest_rate, v_max))
  into v_rate
  from public.wallet_snapshots ws
  where ws.child_id = p_child_id
  for update;
  if v_rate is null then
    raise exception 'Wallet snapshot not found';
  end if;

  insert into public.interest_rate_confirmations (child_id, month_key, confirmed_rate, confirmed_by)
  values (p_child_id, v_month, v_rate, auth.uid())
  on conflict (child_id, month_key) do update
  set confirmed_rate = interest_rate_confirmations.confirmed_rate
  returning interest_rate_confirmations.confirmed_rate into v_rate;

  return query select v_rate;
end;
$$;

revoke all on function public.confirm_interest_rate(uuid, text) from public, anon;
grant execute on function public.confirm_interest_rate(uuid, text) to authenticated;

create or replace function public.sync_interest_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmed_rate numeric(5,2);
begin
  select confirmed_rate into v_confirmed_rate
  from public.interest_rate_confirmations
  where child_id = new.child_id
    and month_key = date_trunc('month', new.effective_date)::date;

  update public.wallet_snapshots
  set current_interest_rate = coalesce(v_confirmed_rate, new.applied_rate), updated_at = now()
  where child_id = new.child_id;
  return new;
end;
$$;
