-- Keep wallet snapshots accurate when transactions are deleted without
-- recreating a snapshot while the owning child is being cascade-deleted.
create or replace function public.sync_wallet_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id uuid;
  v_balance integer;
  v_savings integer;
  v_borrowed integer;
begin
  v_child_id := case when tg_op = 'DELETE' then old.child_id else new.child_id end;

  if not exists (select 1 from public.children where id = v_child_id) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

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
  where child_id = v_child_id;

  insert into public.wallet_snapshots (child_id, balance, savings_balance, borrowed_balance, updated_at)
  values (v_child_id, v_balance, v_savings, v_borrowed, now())
  on conflict (child_id) do update set
    balance = excluded.balance,
    savings_balance = excluded.savings_balance,
    borrowed_balance = excluded.borrowed_balance,
    updated_at = excluded.updated_at;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists on_money_transaction_change on public.money_transactions;
create trigger on_money_transaction_change
  after insert or update or delete on public.money_transactions
  for each row execute procedure public.sync_wallet_snapshot();
