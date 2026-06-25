-- Run this read-only checklist in the Supabase SQL editor before applying release migrations.

select
  to_regclass('public.profiles') is not null as has_profiles,
  to_regclass('public.children') is not null as has_children,
  to_regclass('public.interest_policies') is not null as has_interest_policies,
  to_regclass('public.money_transactions') is not null as has_money_transactions,
  to_regclass('public.borrow_requests') is not null as has_borrow_requests,
  to_regclass('public.allowance_rules') is not null as has_allowance_rules,
  to_regclass('public.wallet_snapshots') is not null as has_wallet_snapshots,
  to_regclass('public.parent_wallets') is not null as has_parent_wallets,
  to_regclass('public.parent_wallet_charges') is not null as has_parent_wallet_charges,
  to_regclass('public.interest_rate_confirmations') is not null as has_interest_rate_confirmations;

select
  to_regprocedure('public.give_allowance_from_parent_wallet(uuid,integer,text,date)') is not null as has_atomic_allowance_rpc,
  to_regprocedure('public.confirm_interest_rate(uuid,text)') is not null as has_interest_confirmation_rpc,
  to_regprocedure('public.save_parent_bank_account(text,text,text)') is not null as has_bank_account_rpc,
  to_regprocedure('public.approve_cash_spend(uuid)') is not null as has_approve_cash_spend_rpc,
  to_regprocedure('public.reject_cash_spend(uuid,text)') is not null as has_reject_cash_spend_rpc,
  to_regprocedure('public.approve_parent_wallet_charge(uuid)') is not null as has_approve_wallet_charge_rpc,
  to_regprocedure('public.reject_parent_wallet_charge(uuid)') is not null as has_reject_wallet_charge_rpc;

-- cash_spend_requests RLS 소유권 검증 정책 확인
select
  to_regclass('public.cash_spend_requests') is not null as has_cash_spend_requests,
  to_regclass('public.allowance_executions') is not null as has_allowance_executions,
  exists (
    select 1 from pg_policies
    where tablename = 'cash_spend_requests' and policyname = 'cash_requests_child_insert'
  ) as has_cash_insert_rls_policy;

-- lock_child_wallet_for_transaction 트리거 존재 확인
select exists (
  select 1 from pg_trigger where tgname = 'lock_child_wallet_before_tx'
) as has_wallet_lock_trigger;

select exists (
  select 1 from pg_publication where pubname = 'supabase_realtime'
) as has_supabase_realtime_publication;

select child_id, count(*) as duplicate_count
from public.interest_policies
group by child_id
having count(*) > 1;

select related_behavior_log_id, count(*) as duplicate_count
from public.money_transactions
where related_behavior_log_id is not null and type = 'reward'
group by related_behavior_log_id
having count(*) > 1;

select related_borrow_request_id, count(*) as duplicate_count
from public.money_transactions
where related_borrow_request_id is not null and type = 'borrow'
group by related_borrow_request_id
having count(*) > 1;

select
  count(*) filter (where role = 'admin') as admin_count,
  count(*) filter (where role = 'parent') as parent_count
from public.profiles;
