create unique index if not exists money_transactions_behavior_reward_once
  on public.money_transactions (related_behavior_log_id)
  where related_behavior_log_id is not null and type = 'reward';

create unique index if not exists money_transactions_borrow_credit_once
  on public.money_transactions (related_borrow_request_id)
  where related_borrow_request_id is not null and type = 'borrow';

create or replace function public.approve_behavior_log(
  p_behavior_log_id uuid,
  p_approved_date date
)
returns table (log_id uuid, child_id uuid)
language plpgsql
set search_path = public
as $$
declare
  v_log public.behavior_logs%rowtype;
  v_rule public.behavior_rules%rowtype;
  v_policy public.interest_policies%rowtype;
  v_current_rate numeric(5,2);
  v_next_rate numeric(5,2);
begin
  select bl.* into v_log
  from public.behavior_logs bl
  join public.children c on c.id = bl.child_id
  where bl.id = p_behavior_log_id
    and bl.status = 'pending'
    and c.parent_id = auth.uid()
  for update of bl;

  if not found then
    return;
  end if;

  select * into v_rule
  from public.behavior_rules
  where id = v_log.behavior_rule_id and parent_id = auth.uid();

  if not found then
    raise exception 'Behavior rule does not belong to this family';
  end if;

  update public.behavior_logs
  set status = 'approved', approved_by = auth.uid()
  where id = v_log.id;

  if v_rule.reward_amount > 0 then
    insert into public.money_transactions (
      child_id, tx_date, type, amount, savings_delta, borrowed_delta,
      related_behavior_log_id, memo, created_by
    )
    values (
      v_log.child_id, p_approved_date, 'reward', v_rule.reward_amount, 0, 0,
      v_log.id, v_rule.title || ' 보상 승인', auth.uid()
    );
  end if;

  select ip.* into v_policy from public.interest_policies ip where ip.child_id = v_log.child_id;
  if v_rule.interest_delta <> 0 and found then
    select coalesce(current_interest_rate, v_policy.base_interest_rate)
    into v_current_rate
    from public.wallet_snapshots ws
    where ws.child_id = v_log.child_id;

    v_next_rate := greatest(
      v_policy.min_interest_rate,
      least(coalesce(v_current_rate, v_policy.base_interest_rate) + v_rule.interest_delta, v_policy.max_interest_rate)
    );

    insert into public.interest_rate_events (
      child_id, behavior_rule_id, rate_delta, applied_rate, reason, effective_date
    )
    values (
      v_log.child_id, v_rule.id, v_rule.interest_delta, v_next_rate,
      v_rule.title || ' 승인', p_approved_date
    );
  end if;

  return query select v_log.id, v_log.child_id;
end;
$$;

create or replace function public.approve_borrow_request(
  p_borrow_request_id uuid,
  p_approval_date date
)
returns table (transaction_id uuid, child_id uuid, schedule_count integer)
language plpgsql
set search_path = public
as $$
declare
  v_request public.borrow_requests%rowtype;
  v_transaction_id uuid;
  v_installments integer;
  v_total_repayable integer;
  v_installment_amount integer;
  v_remainder integer;
begin
  select br.* into v_request
  from public.borrow_requests br
  join public.children c on c.id = br.child_id
  where br.id = p_borrow_request_id
    and br.status = 'pending'
    and c.parent_id = auth.uid()
  for update of br;

  if not found then
    return;
  end if;

  v_installments := case
    when v_request.repayment_mode = 'installment' then coalesce(v_request.installment_count, 3)
    else 1
  end;
  v_total_repayable := ceil(v_request.requested_amount * (1 + v_request.interest_rate / 100.0));
  v_installment_amount := floor(v_total_repayable::numeric / v_installments);
  v_remainder := v_total_repayable % v_installments;

  update public.borrow_requests
  set status = 'approved', approved_by_parent = auth.uid()
  where id = v_request.id;

  insert into public.money_transactions (
    child_id, tx_date, type, amount, savings_delta, borrowed_delta,
    related_borrow_request_id, memo, created_by
  )
  values (
    v_request.child_id, p_approval_date, 'borrow', v_request.requested_amount, 0,
    v_request.requested_amount, v_request.id, coalesce(v_request.purpose, '') || ' 미리쓰기 승인', auth.uid()
  )
  returning id into v_transaction_id;

  insert into public.borrow_repayments (borrow_request_id, due_date, amount, paid_amount, status)
  select
    v_request.id,
    p_approval_date + (installment_number * 7),
    v_installment_amount + case when installment_number <= v_remainder then 1 else 0 end,
    0,
    'scheduled'
  from generate_series(1, v_installments) as schedule(installment_number);

  return query select v_transaction_id, v_request.child_id, v_installments;
end;
$$;

revoke all on function public.approve_behavior_log(uuid, date) from public, anon;
grant execute on function public.approve_behavior_log(uuid, date) to authenticated;
revoke all on function public.approve_borrow_request(uuid, date) from public, anon;
grant execute on function public.approve_borrow_request(uuid, date) to authenticated;
