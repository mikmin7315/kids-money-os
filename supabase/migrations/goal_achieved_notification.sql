-- 목표 달성 알림 트리거
-- goals.status가 'active' → 'achieved'로 바뀔 때
-- 부모(goal_achieved)와 아이(goal_achieved_child) 알림 자동 생성

CREATE OR REPLACE FUNCTION notify_goal_achieved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID;
  v_child_name TEXT;
BEGIN
  -- active → achieved 전환일 때만 실행
  IF OLD.status != 'active' OR NEW.status != 'achieved' THEN
    RETURN NEW;
  END IF;

  SELECT c.parent_id, c.name
  INTO v_parent_id, v_child_name
  FROM children c WHERE c.id = NEW.child_id;

  IF v_parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 부모 알림
  INSERT INTO notifications (parent_id, child_id, target, type, title, body)
  VALUES (
    v_parent_id, NEW.child_id, 'parent', 'goal_achieved',
    v_child_name || '가 목표를 달성했어요! 🎉',
    '"' || NEW.title || '" 목표를 달성했어요. 함께 축하해주세요!'
  );

  -- 아이 알림
  INSERT INTO notifications (parent_id, child_id, target, type, title, body)
  VALUES (
    v_parent_id, NEW.child_id, 'child', 'goal_achieved_child',
    '목표 달성! 🎊',
    '"' || NEW.title || '" 목표를 달성했어요! 정말 잘했어요!'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_goal_achieved ON goals;
CREATE TRIGGER trg_notify_goal_achieved
  AFTER UPDATE OF status ON goals
  FOR EACH ROW
  EXECUTE FUNCTION notify_goal_achieved();
