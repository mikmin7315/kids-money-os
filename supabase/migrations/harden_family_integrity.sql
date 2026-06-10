create unique index if not exists interest_policies_child_id_key
  on public.interest_policies (child_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'money_transactions_related_borrow_request_id_fkey'
      and conrelid = 'public.money_transactions'::regclass
  ) then
    alter table public.money_transactions
      add constraint money_transactions_related_borrow_request_id_fkey
      foreign key (related_borrow_request_id) references public.borrow_requests(id) on delete set null;
  end if;
end;
$$;

drop policy if exists "allowance_rules_by_parent" on public.allowance_rules;
create policy "allowance_rules_by_parent" on public.allowance_rules
  for all
  using (parent_id = auth.uid())
  with check (
    parent_id = auth.uid()
    and (child_id is null or child_id in (select id from public.children where parent_id = auth.uid()))
  );

drop policy if exists "interest_policies_by_parent" on public.interest_policies;
create policy "interest_policies_by_parent" on public.interest_policies
  for all
  using (parent_id = auth.uid())
  with check (
    parent_id = auth.uid()
    and (child_id is null or child_id in (select id from public.children where parent_id = auth.uid()))
  );

drop policy if exists "borrow_conditions_by_parent" on public.borrow_conditions;
create policy "borrow_conditions_by_parent" on public.borrow_conditions
  for all
  using (parent_id = auth.uid())
  with check (
    parent_id = auth.uid()
    and child_id in (select id from public.children where parent_id = auth.uid())
  );

drop policy if exists "wallet_snapshots_by_parent" on public.wallet_snapshots;
create policy "wallet_snapshots_by_parent" on public.wallet_snapshots
  for select
  using (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "money_transactions_by_parent" on public.money_transactions;
create policy "money_transactions_by_parent" on public.money_transactions
  for select
  using (child_id in (select id from public.children where parent_id = auth.uid()));

drop policy if exists "money_transactions_insert_by_parent" on public.money_transactions;
create policy "money_transactions_insert_by_parent" on public.money_transactions
  for insert
  with check (child_id in (select id from public.children where parent_id = auth.uid()));
