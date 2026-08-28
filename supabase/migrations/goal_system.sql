-- ============================================================
-- Goal System Migration
-- V3.1 Product Strategy: Core Loop Step 2, 4 — Retention 엔진
-- ============================================================

-- ① goals 테이블
CREATE TABLE IF NOT EXISTS goals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID        NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  target_amount   BIGINT      NOT NULL CHECK (target_amount > 0),
  current_amount  BIGINT      NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline        DATE,
  image_emoji     TEXT        DEFAULT '🎯',
  image_url       TEXT,
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'achieved', 'paused', 'cancelled')),
  created_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,  -- 부모 or NULL(아이)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  achieved_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goals_child_id_idx     ON goals (child_id);
CREATE INDEX IF NOT EXISTS goals_child_status_idx ON goals (child_id, status);

-- ② goal_sponsorships 테이블 — Matching Contribution 설정
CREATE TABLE IF NOT EXISTS goal_sponsorships (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id           UUID        NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  sponsor_profile_id UUID       REFERENCES profiles(id) ON DELETE SET NULL,
  sponsor_name      TEXT        NOT NULL,                     -- 표시용 (조부모 등)
  sponsorship_type  TEXT        NOT NULL
                                CHECK (sponsorship_type IN ('matching', 'milestone', 'one_time')),
  -- matching: child가 match_child_amount 저금할 때마다 match_sponsor_amount 추가
  -- milestone: goal의 milestone_pct % 도달 시 milestone_bonus 지급
  -- one_time: 즉시 one_time_amount 후원
  config            JSONB       NOT NULL DEFAULT '{}',
  /*
    matching 예시:
    { "matchChildAmount": 10000, "matchSponsorAmount": 2000, "maxTotal": 20000 }
    milestone 예시:
    { "milestonePct": 50, "milestoneBonus": 5000 }
    one_time 예시:
    { "amount": 10000, "message": "화이팅!" }
  */
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goal_sponsorships_goal_id_idx ON goal_sponsorships (goal_id);

-- ③ goal_contributions 테이블 — 아이/가족 기여 기록
CREATE TABLE IF NOT EXISTS goal_contributions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id             UUID        NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  contributor_type    TEXT        NOT NULL CHECK (contributor_type IN ('child', 'sponsor')),
  contributor_profile UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  contributor_name    TEXT,       -- 표시용
  amount              BIGINT      NOT NULL CHECK (amount > 0),
  contribution_type   TEXT        NOT NULL
                                  CHECK (contribution_type IN ('direct', 'matching', 'milestone_bonus', 'one_time')),
  transaction_id      UUID        REFERENCES money_transactions(id) ON DELETE SET NULL,
  memo                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goal_contributions_goal_id_idx ON goal_contributions (goal_id);
CREATE INDEX IF NOT EXISTS goal_contributions_child_idx   ON goal_contributions (goal_id, contributor_type);

-- ============================================================
-- 트리거: goals.current_amount 자동 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION sync_goal_current_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE goals
  SET
    current_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM goal_contributions
      WHERE goal_id = NEW.goal_id
    ),
    updated_at = now()
  WHERE id = NEW.goal_id;

  -- 달성 확인
  UPDATE goals
  SET
    status      = 'achieved',
    achieved_at = now()
  WHERE id = NEW.goal_id
    AND status = 'active'
    AND current_amount >= target_amount;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_goal_amount
  AFTER INSERT OR UPDATE ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION sync_goal_current_amount();

-- goals.updated_at 자동 갱신
CREATE OR REPLACE FUNCTION touch_goal_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION touch_goal_updated_at();

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE goals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_sponsorships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- goals: 부모는 자신 아이 목표 전체, 아이는 자신 목표만
CREATE POLICY goals_select ON goals
  FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid() AND deleted_at IS NULL
    )
    OR child_id IN (
      SELECT child_id FROM child_guardians WHERE guardian_id = auth.uid()
    )
  );

CREATE POLICY goals_insert_by_parent ON goals
  FOR INSERT TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY goals_update_by_parent ON goals
  FOR UPDATE TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- goal_sponsorships: 같은 아이 보호자만 조회
CREATE POLICY goal_sponsorships_select ON goal_sponsorships
  FOR SELECT TO authenticated
  USING (
    goal_id IN (
      SELECT g.id FROM goals g
      WHERE g.child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid() AND deleted_at IS NULL
        UNION
        SELECT child_id FROM child_guardians WHERE guardian_id = auth.uid()
      )
    )
  );

CREATE POLICY goal_sponsorships_insert_by_parent ON goal_sponsorships
  FOR INSERT TO authenticated
  WITH CHECK (
    goal_id IN (
      SELECT g.id FROM goals g
      WHERE g.child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

-- goal_contributions: 보호자는 모두 조회, 기여는 서버 액션 경유
CREATE POLICY goal_contributions_select ON goal_contributions
  FOR SELECT TO authenticated
  USING (
    goal_id IN (
      SELECT g.id FROM goals g
      WHERE g.child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid() AND deleted_at IS NULL
        UNION
        SELECT child_id FROM child_guardians WHERE guardian_id = auth.uid()
      )
    )
  );

-- ============================================================
-- RPC: 아이 목표에 직접 기여 (서버 액션 경유)
-- ============================================================

CREATE OR REPLACE FUNCTION contribute_to_goal(
  p_goal_id           UUID,
  p_amount            BIGINT,
  p_contributor_type  TEXT DEFAULT 'child',
  p_memo              TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal          goals%ROWTYPE;
  v_contribution  UUID;
BEGIN
  -- 목표 조회 및 잠금
  SELECT * INTO v_goal FROM goals WHERE id = p_goal_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'goal_not_found');
  END IF;
  IF v_goal.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'goal_not_active');
  END IF;
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;

  -- 기여 기록
  INSERT INTO goal_contributions (goal_id, contributor_type, amount, contribution_type, memo)
  VALUES (p_goal_id, p_contributor_type, p_amount, 'direct', p_memo)
  RETURNING id INTO v_contribution;

  RETURN jsonb_build_object(
    'ok', true,
    'contribution_id', v_contribution,
    'new_amount', (SELECT current_amount FROM goals WHERE id = p_goal_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION contribute_to_goal(UUID, BIGINT, TEXT, TEXT) TO authenticated;
