-- Fix: repay_borrow_installment RPC writes borrow_requests.repaid_at.
-- Older environments may not have the column yet.

alter table public.borrow_requests
  add column if not exists repaid_at timestamptz;

select
  (select count(*)
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'borrow_requests'
     and column_name = 'repaid_at') > 0 as has_borrow_requests_repaid_at;
