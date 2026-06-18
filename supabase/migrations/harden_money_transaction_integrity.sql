-- Keep child wallets financially valid for every money transaction write.
-- A "save" transaction moves cash from available balance into savings; it
-- must never be possible without enough available balance first.

create or replace function public.enforce_money_transaction_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer := 0;
  v_savings integer := 0;
  v_borrowed integer := 0;
  v_cash_delta integer := 0;
  v_expected_savings_delta integer := 0;
  v_expected_borrowed_delta integer := 0;
begin
  if new.amount <= 0 then
    raise exception 'Transaction amount must be greater than zero.';
  end if;

  v_cash_delta := case
    when new.type in ('allowance','reward','interest','borrow','unsave') then new.amount
    when new.type in ('spend','save','repay') then -new.amount
    else 0
  end;

  v_expected_savings_delta := case
    when new.type = 'save' then new.amount
    when new.type = 'unsave' then -new.amount
    else 0
  end;

  v_expected_borrowed_delta := case
    when new.type = 'borrow' then new.amount
    when new.type = 'repay' then -new.amount
    else 0
  end;

  if new.savings_delta <> v_expected_savings_delta then
    raise exception 'Transaction type and savings delta do not match.';
  end if;

  if new.borrowed_delta <> v_expected_borrowed_delta then
    raise exception 'Transaction type and borrowed delta do not match.';
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
  where child_id = new.child_id
    and (tg_op = 'INSERT' or id <> old.id);

  v_balance := v_balance + v_cash_delta;
  v_savings := v_savings + v_expected_savings_delta;
  v_borrowed := v_borrowed + v_expected_borrowed_delta;

  if v_balance < 0 then
    raise exception 'Insufficient available balance.';
  end if;

  if v_savings < 0 then
    raise exception 'Insufficient savings balance.';
  end if;

  if v_borrowed < 0 then
    raise exception 'Repayment exceeds borrowed balance.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_money_transaction_limits_before_insert on public.money_transactions;
drop trigger if exists enforce_money_transaction_integrity_before_write on public.money_transactions;
create trigger enforce_money_transaction_integrity_before_write
  before insert or update of child_id, type, amount, savings_delta, borrowed_delta on public.money_transactions
  for each row execute procedure public.enforce_money_transaction_integrity();
