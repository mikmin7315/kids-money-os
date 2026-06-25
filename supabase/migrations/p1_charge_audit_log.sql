-- P1: 충전 감사 로그 — parent_wallet_charges에 감사 컬럼 추가

alter table public.parent_wallet_charges
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists balance_before integer,
  add column if not exists balance_after integer;

-- approve_parent_wallet_charge: 감사 정보 기록
create or replace function public.approve_parent_wallet_charge(p_charge_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_charge record;
  v_balance_before integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin required';
  end if;

  select * into v_charge from public.parent_wallet_charges
  where id = p_charge_id and status = 'pending'
  for update;
  if not found then raise exception 'Charge not found or already processed'; end if;

  select balance into v_balance_before from public.parent_wallets
  where parent_id = v_charge.parent_id for update;

  update public.parent_wallets
  set balance = balance + v_charge.amount
  where parent_id = v_charge.parent_id;

  update public.parent_wallet_charges
  set status = 'paid',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      balance_before = v_balance_before,
      balance_after = v_balance_before + v_charge.amount
  where id = p_charge_id;
end;
$$;
revoke all on function public.approve_parent_wallet_charge(uuid) from public, anon;
grant execute on function public.approve_parent_wallet_charge(uuid) to authenticated;

-- reject_parent_wallet_charge: 거절 사유 기록
create or replace function public.reject_parent_wallet_charge(p_charge_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin required';
  end if;

  update public.parent_wallet_charges
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = p_reason
  where id = p_charge_id and status = 'pending';

  if not found then raise exception 'Charge not found or already processed'; end if;
end;
$$;
revoke all on function public.reject_parent_wallet_charge(uuid, text) from public, anon;
grant execute on function public.reject_parent_wallet_charge(uuid, text) to authenticated;

-- 확인
select
  (select count(*) from information_schema.columns
   where table_name = 'parent_wallet_charges' and column_name = 'reviewed_by') > 0 as has_reviewed_by,
  (select count(*) from information_schema.columns
   where table_name = 'parent_wallet_charges' and column_name = 'balance_before') > 0 as has_balance_audit;
