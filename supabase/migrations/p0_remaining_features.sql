-- P0 나머지 기능: 미리쓰기 상환 / 정기 용돈 배치 / 아이 수정·삭제

-- ① repay_borrow_installment: 상환 회차 처리 (원자적)
create or replace function public.repay_borrow_installment(p_repayment_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_rep record;
  v_req record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select r.*, br.child_id, br.requested_amount, br.status as borrow_status
  into v_rep
  from public.borrow_repayments r
  join public.borrow_requests br on br.id = r.borrow_request_id
  join public.children c on c.id = br.child_id
  where r.id = p_repayment_id
    and r.status in ('scheduled', 'overdue')
    and c.parent_id = auth.uid()
  for update of r;

  if not found then raise exception 'Repayment not found or not authorized'; end if;

  -- 상환 거래 생성
  insert into public.money_transactions (
    child_id, tx_date, type, amount, savings_delta, borrowed_delta,
    related_borrow_request_id, memo, created_by
  ) values (
    v_rep.child_id, current_date, 'repay', v_rep.amount, 0, -v_rep.amount,
    v_rep.borrow_request_id, '미리쓰기 상환', auth.uid()
  );

  -- 상환 회차 완료 처리
  update public.borrow_repayments
  set paid_amount = amount, status = 'paid'
  where id = p_repayment_id;

  -- 모든 회차 상환 완료 시 borrow_request 상태 업데이트
  if not exists (
    select 1 from public.borrow_repayments
    where borrow_request_id = v_rep.borrow_request_id
      and status not in ('paid')
  ) then
    update public.borrow_requests
    set status = 'repaid', repaid_at = now()
    where id = v_rep.borrow_request_id;
  end if;
end;
$$;
revoke all on function public.repay_borrow_installment(uuid) from public, anon;
grant execute on function public.repay_borrow_installment(uuid) to authenticated;

-- ② process_scheduled_allowances: 정기 용돈 배치 (원자적, idempotent)
create or replace function public.process_scheduled_allowances(p_target_date date default current_date)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_rule record;
  v_result jsonb := '{"success": 0, "skipped": 0, "failed": 0, "errors": []}'::jsonb;
  v_success int := 0;
  v_skipped int := 0;
  v_failed int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_tx_id uuid;
begin
  for v_rule in
    select ar.*, c.parent_id
    from public.allowance_rules ar
    join public.children c on c.id = ar.child_id
    where ar.is_active = true
      and ar.deleted_at is null
      and (
        -- 매주: p_target_date의 요일이 weekday와 일치
        (ar.type = 'weekly' and extract(dow from p_target_date) = ar.weekday)
        -- 매월: p_target_date의 일이 day_of_month와 일치
        or (ar.type = 'monthly' and extract(day from p_target_date) = ar.day_of_month)
      )
  loop
    -- 중복 방지: 이미 처리된 경우 건너뜀
    if exists (
      select 1 from public.allowance_executions
      where allowance_rule_id = v_rule.id
        and scheduled_date = p_target_date
        and status = 'success'
    ) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    -- 실행 로그 선점 (중복 실행 방지)
    insert into public.allowance_executions (allowance_rule_id, scheduled_date, status)
    values (v_rule.id, p_target_date, 'pending')
    on conflict (allowance_rule_id, scheduled_date) do nothing;

    -- 부모 지갑 잔액 확인 및 차감
    begin
      perform id from public.parent_wallets
      where parent_id = v_rule.parent_id
        and balance >= v_rule.amount
      for update;

      if not found then
        update public.allowance_executions
        set status = 'failed', failure_reason = '부모 지갑 잔액 부족', executed_at = now()
        where allowance_rule_id = v_rule.id and scheduled_date = p_target_date;

        v_failed := v_failed + 1;
        v_errors := v_errors || jsonb_build_object('ruleId', v_rule.id, 'reason', '잔액 부족');
        continue;
      end if;

      update public.parent_wallets
      set balance = balance - v_rule.amount
      where parent_id = v_rule.parent_id;

      insert into public.money_transactions (
        child_id, tx_date, type, amount, savings_delta, borrowed_delta, memo, created_by
      ) values (
        v_rule.child_id, p_target_date, 'allowance', v_rule.amount, 0, 0,
        v_rule.title || ' 정기 용돈', v_rule.parent_id
      ) returning id into v_tx_id;

      update public.allowance_executions
      set status = 'success', money_transaction_id = v_tx_id, executed_at = now()
      where allowance_rule_id = v_rule.id and scheduled_date = p_target_date;

      v_success := v_success + 1;

    exception when others then
      update public.allowance_executions
      set status = 'failed', failure_reason = sqlerrm, executed_at = now()
      where allowance_rule_id = v_rule.id and scheduled_date = p_target_date;

      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('ruleId', v_rule.id, 'reason', sqlerrm);
    end;
  end loop;

  return jsonb_build_object(
    'success', v_success,
    'skipped', v_skipped,
    'failed', v_failed,
    'errors', v_errors
  );
end;
$$;
revoke all on function public.process_scheduled_allowances(date) from public, anon;
-- service role만 호출 (Edge Function에서 호출)

-- ③ 아이 정보 수정
create or replace function public.update_child(
  p_child_id uuid,
  p_name text,
  p_nickname text,
  p_birth_year integer
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  update public.children
  set name = p_name, nickname = coalesce(nullif(trim(p_nickname), ''), p_name), birth_year = p_birth_year
  where id = p_child_id and parent_id = auth.uid();

  if not found then raise exception 'Child not found or not authorized'; end if;
end;
$$;
revoke all on function public.update_child(uuid, text, text, integer) from public, anon;
grant execute on function public.update_child(uuid, text, text, integer) to authenticated;

-- ④ 아이 삭제 (소프트 삭제 — children에 deleted_at 추가)
alter table public.children add column if not exists deleted_at timestamptz;

create or replace function public.delete_child(p_child_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  update public.children
  set deleted_at = now()
  where id = p_child_id and parent_id = auth.uid() and deleted_at is null;

  if not found then raise exception 'Child not found or already deleted'; end if;
end;
$$;
revoke all on function public.delete_child(uuid) from public, anon;
grant execute on function public.delete_child(uuid) to authenticated;

-- 확인
select
  to_regprocedure('public.repay_borrow_installment(uuid)') is not null as has_repay_rpc,
  to_regprocedure('public.process_scheduled_allowances(date)') is not null as has_allowance_batch_rpc,
  to_regprocedure('public.update_child(uuid,text,text,integer)') is not null as has_update_child_rpc,
  to_regprocedure('public.delete_child(uuid)') is not null as has_delete_child_rpc,
  (select count(*) from information_schema.columns
   where table_name = 'children' and column_name = 'deleted_at') > 0 as has_deleted_at;
