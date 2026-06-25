-- P0 재점검 보완: deleted_at 필터 / get_app_data_bundle 갱신 / children RLS 분리

-- ① get_app_data_bundle: 삭제된 아이 제외 + parent_wallet/charges/cash_requests 포함
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
      from (
        select id, parent_id, name, nickname, birth_year, created_at
        from public.children
        where deleted_at is null
      ) c
    ), '[]'::jsonb),
    'behavior_rules', coalesce((select jsonb_agg(row_to_json(r) order by r.created_at) from public.behavior_rules r), '[]'::jsonb),
    'behavior_logs', coalesce((select jsonb_agg(row_to_json(l) order by l.behavior_date desc) from public.behavior_logs l), '[]'::jsonb),
    'allowance_rules', coalesce((select jsonb_agg(row_to_json(a) order by a.created_at) from public.allowance_rules a), '[]'::jsonb),
    'money_transactions', coalesce((select jsonb_agg(row_to_json(t) order by t.tx_date desc) from public.money_transactions t), '[]'::jsonb),
    'borrow_requests', coalesce((select jsonb_agg(row_to_json(b) order by b.created_at desc) from public.borrow_requests b), '[]'::jsonb),
    'borrow_repayments', coalesce((select jsonb_agg(row_to_json(p) order by p.due_date) from public.borrow_repayments p), '[]'::jsonb),
    'interest_policies', coalesce((select jsonb_agg(row_to_json(i) order by i.created_at) from public.interest_policies i), '[]'::jsonb),
    'interest_rate_events', coalesce((select jsonb_agg(row_to_json(e) order by e.effective_date desc) from public.interest_rate_events e), '[]'::jsonb),
    'wallet_snapshots', coalesce((select jsonb_agg(row_to_json(w) order by w.child_id) from public.wallet_snapshots w), '[]'::jsonb),
    'parent_wallet', (
      select row_to_json(pw)
      from public.parent_wallets pw
      where pw.parent_id = auth.uid()
      limit 1
    ),
    'parent_wallet_charges', coalesce((
      select jsonb_agg(row_to_json(c) order by c.created_at desc)
      from public.parent_wallet_charges c
      where c.parent_id = auth.uid()
    ), '[]'::jsonb),
    'cash_spend_requests', coalesce((
      select jsonb_agg(row_to_json(r) order by r.created_at desc)
      from public.cash_spend_requests r
      join public.children ch on ch.id = r.child_id
      where ch.parent_id = auth.uid()
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_app_data_bundle() from public, anon;
grant execute on function public.get_app_data_bundle() to authenticated;

-- ② children RLS: select만 deleted_at 필터, insert/update는 별도 정책
drop policy if exists "children_by_parent" on public.children;
drop policy if exists "children_select_by_parent" on public.children;
drop policy if exists "children_insert_by_parent" on public.children;
drop policy if exists "children_update_by_parent" on public.children;

-- SELECT: 삭제되지 않은 아이만
create policy "children_select_by_parent" on public.children
  for select to authenticated
  using (parent_id = auth.uid() and deleted_at is null);

-- INSERT: 본인 소유로만 생성 가능
create policy "children_insert_by_parent" on public.children
  for insert to authenticated
  with check (parent_id = auth.uid());

-- UPDATE: 삭제되지 않은 본인 아이만 수정 (PIN 설정, 소프트 삭제 포함)
create policy "children_update_by_parent" on public.children
  for update to authenticated
  using (parent_id = auth.uid() and deleted_at is null)
  with check (parent_id = auth.uid());

-- 확인
select
  (select count(*) from public.children where deleted_at is not null) as soft_deleted_count,
  to_regprocedure('public.get_app_data_bundle()') is not null as has_bundle_rpc,
  (select count(*) from pg_policies where tablename = 'children' and policyname = 'children_select_by_parent') > 0 as has_select_policy,
  (select count(*) from pg_policies where tablename = 'children' and policyname = 'children_insert_by_parent') > 0 as has_insert_policy,
  (select count(*) from pg_policies where tablename = 'children' and policyname = 'children_update_by_parent') > 0 as has_update_policy;
