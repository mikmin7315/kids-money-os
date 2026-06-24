-- ① cash_spend_requests: 아이 현금 사용 요청 (부모 승인 필요)
create table if not exists public.cash_spend_requests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  amount integer not null check (amount > 0 and amount <= 100000000),
  spend_date date not null,
  memo text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  money_transaction_id uuid references public.money_transactions(id),
  created_at timestamptz not null default now()
);
alter table public.cash_spend_requests enable row level security;
drop policy if exists "cash_requests_by_family" on public.cash_spend_requests;
create policy "cash_requests_by_family" on public.cash_spend_requests
  for select to authenticated
  using (
    child_id in (select id from public.children where parent_id = auth.uid())
  );
drop policy if exists "cash_requests_child_insert" on public.cash_spend_requests;
create policy "cash_requests_child_insert" on public.cash_spend_requests
  for insert to authenticated
  with check (true);

-- ② allowance_executions: 정기 용돈 실행 로그 (중복 지급 방지 unique key)
create table if not exists public.allowance_executions (
  id uuid primary key default gen_random_uuid(),
  allowance_rule_id uuid not null references public.allowance_rules(id) on delete cascade,
  scheduled_date date not null,
  status text not null default 'pending' check (status in ('pending','success','failed','skipped')),
  money_transaction_id uuid references public.money_transactions(id),
  failure_reason text,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (allowance_rule_id, scheduled_date)
);
alter table public.allowance_executions enable row level security;
drop policy if exists "allowance_executions_by_parent" on public.allowance_executions;
create policy "allowance_executions_by_parent" on public.allowance_executions
  for select to authenticated
  using (
    allowance_rule_id in (
      select ar.id from public.allowance_rules ar
      join public.children c on c.id = ar.child_id
      where c.parent_id = auth.uid()
    )
  );

-- ③ approve_cash_spend RPC
create or replace function public.approve_cash_spend(p_request_id uuid)
returns void
language plpgsql security definer set search_path = public
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

  insert into public.money_transactions (child_id, tx_date, type, amount, savings_delta, borrowed_delta, memo, created_by)
  values (v_req.child_id, v_req.spend_date, 'spend', v_req.amount, 0, 0, coalesce(nullif(trim(coalesce(v_req.memo,'')), ''), '현금 사용'), auth.uid())
  returning id into v_tx_id;

  update public.cash_spend_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), money_transaction_id = v_tx_id
  where id = p_request_id;
end;
$fn$;
revoke all on function public.approve_cash_spend(uuid) from public, anon;
grant execute on function public.approve_cash_spend(uuid) to authenticated;

-- ④ reject_cash_spend RPC
create or replace function public.reject_cash_spend(p_request_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $fn$
declare v_req record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_req from public.cash_spend_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if v_req.status <> 'pending' then raise exception 'Already processed'; end if;
  if not exists (
    select 1 from public.children where id = v_req.child_id and parent_id = auth.uid()
  ) then raise exception 'Not authorized'; end if;

  update public.cash_spend_requests
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = p_reason
  where id = p_request_id;
end;
$fn$;
revoke all on function public.reject_cash_spend(uuid, text) from public, anon;
grant execute on function public.reject_cash_spend(uuid, text) to authenticated;

-- ⑤ approve_parent_wallet_charge RPC (Admin 전용)
create or replace function public.approve_parent_wallet_charge(p_charge_id uuid)
returns void
language plpgsql security definer set search_path = public
as $fn$
declare
  v_charge record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin only';
  end if;

  select * into v_charge from public.parent_wallet_charges where id = p_charge_id for update;
  if not found then raise exception 'Charge not found'; end if;
  if v_charge.status <> 'pending' then raise exception 'Already processed'; end if;

  update public.parent_wallet_charges set status = 'paid' where id = p_charge_id;

  insert into public.parent_wallets (parent_id, balance)
  values (v_charge.parent_id, v_charge.amount)
  on conflict (parent_id) do update
  set balance = public.parent_wallets.balance + excluded.balance;
end;
$fn$;
revoke all on function public.approve_parent_wallet_charge(uuid) from public, anon;
grant execute on function public.approve_parent_wallet_charge(uuid) to authenticated;

-- ⑥ reject_parent_wallet_charge RPC (Admin 전용)
create or replace function public.reject_parent_wallet_charge(p_charge_id uuid)
returns void
language plpgsql security definer set search_path = public
as $fn$
declare v_charge record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin only';
  end if;

  select * into v_charge from public.parent_wallet_charges where id = p_charge_id for update;
  if not found then raise exception 'Charge not found'; end if;
  if v_charge.status <> 'pending' then raise exception 'Already processed'; end if;

  update public.parent_wallet_charges set status = 'rejected' where id = p_charge_id;
end;
$fn$;
revoke all on function public.reject_parent_wallet_charge(uuid) from public, anon;
grant execute on function public.reject_parent_wallet_charge(uuid) to authenticated;
