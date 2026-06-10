-- Run this read-only checklist in the Supabase SQL editor before applying release migrations.

select
  to_regclass('public.profiles') is not null as has_profiles,
  to_regclass('public.children') is not null as has_children,
  to_regclass('public.interest_policies') is not null as has_interest_policies,
  to_regclass('public.money_transactions') is not null as has_money_transactions,
  to_regclass('public.borrow_requests') is not null as has_borrow_requests,
  to_regclass('public.allowance_rules') is not null as has_allowance_rules,
  to_regclass('public.wallet_snapshots') is not null as has_wallet_snapshots;

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
