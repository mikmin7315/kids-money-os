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
      from (select id, parent_id, name, nickname, birth_year, created_at from public.children) c
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
