-- child_save_to_goal RPC
-- 아이가 자신의 지갑 잔액에서 목표 저금통에 직접 저금
-- - money_transactions에 type='save' 삽입 → 잔액 차감 (트리거 자동 처리)
-- - goal_contributions에 contributor_type='child' 삽입 → 목표 진행률 자동 갱신 (트리거 자동)
-- - 잔액 부족 시 enforce_money_transaction_limits 트리거가 예외 발생

CREATE OR REPLACE FUNCTION child_save_to_goal(
  p_goal_id UUID,
  p_amount  BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_id UUID;
  v_goal     goals%ROWTYPE;
  v_tx_id    UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', '인증이 필요합니다.');
  END IF;

  IF p_amount < 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', '최소 100원 이상 저금할 수 있어요.');
  END IF;

  SELECT * INTO v_goal FROM goals WHERE id = p_goal_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '목표를 찾을 수 없습니다.');
  END IF;
  IF v_goal.status != 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', '진행 중인 목표가 아닙니다.');
  END IF;

  v_child_id := v_goal.child_id;

  -- 아이의 부모가 auth.uid()인지 확인 (child mode도 부모 세션 사용)
  IF NOT EXISTS (
    SELECT 1 FROM children
    WHERE id = v_child_id
      AND parent_id = auth.uid()
      AND deleted_at IS NULL
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', '권한이 없습니다.');
  END IF;

  -- 잔액 차감: enforce_money_transaction_limits 트리거가 부족 시 예외 발생
  -- savings_delta=0: 목표 저금은 일반 savings와 별도 추적
  INSERT INTO money_transactions (
    child_id, tx_date, type, amount, savings_delta, borrowed_delta, memo, created_by
  ) VALUES (
    v_child_id, CURRENT_DATE, 'save', p_amount, 0, 0,
    '목표 저금: ' || v_goal.title,
    auth.uid()
  )
  RETURNING id INTO v_tx_id;

  -- 목표 기여 기록: trg_sync_goal_amount 트리거가 current_amount + 달성 상태 자동 갱신
  INSERT INTO goal_contributions (
    goal_id, contributor_type, contributor_profile,
    amount, contribution_type, transaction_id, memo
  ) VALUES (
    p_goal_id, 'child', auth.uid(),
    p_amount, 'direct', v_tx_id, '직접 저금'
  );

  RETURN jsonb_build_object('ok', true, 'transaction_id', v_tx_id);

EXCEPTION WHEN others THEN
  IF SQLERRM LIKE '%잔액%' OR SQLERRM ILIKE '%insufficient%' OR SQLERRM ILIKE '%balance%' THEN
    RETURN jsonb_build_object('ok', false, 'error', '잔액이 부족해요.');
  END IF;
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION child_save_to_goal(UUID, BIGINT) TO authenticated;
