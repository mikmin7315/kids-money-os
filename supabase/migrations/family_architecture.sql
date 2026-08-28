-- ============================================================
-- Family Architecture Migration
-- V3.1 Product Strategy: Family Domain 설계
-- 기존 children.parent_id / child_guardians 유지 (삭제 금지)
-- 새 구조를 병렬로 생성 후 기존 데이터 자동 이관
-- ============================================================

-- ① family_role enum
DO $$ BEGIN
  CREATE TYPE family_role AS ENUM (
    'PRIMARY_GUARDIAN',  -- 가족 생성자. 모든 권한
    'GUARDIAN',          -- 공동 보호자. 권한 설정 가능
    'CHILD',             -- 아이. 자신의 Wallet/Goal/Mission
    'GIFT_GIVER'         -- 선물 기여자. 용돈 보내기만 (Phase 2)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ② families 테이블
CREATE TABLE IF NOT EXISTS families (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (created_by)
);

-- ③ family_members 테이블
CREATE TABLE IF NOT EXISTS family_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  profile_id   UUID        REFERENCES profiles(id) ON DELETE CASCADE,   -- 성인 (부모/보호자)
  child_id     UUID        REFERENCES children(id) ON DELETE CASCADE,   -- 아이
  role         family_role NOT NULL,
  display_name TEXT,
  invited_by   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  status       TEXT        NOT NULL DEFAULT 'active',                   -- active / invited / removed
  -- 성인 or 아이 둘 중 하나만
  CONSTRAINT check_member_type CHECK (
    (profile_id IS NOT NULL AND child_id IS NULL) OR
    (profile_id IS NULL     AND child_id IS NOT NULL)
  )
);

-- 부분 유니크 인덱스 (NULL은 UNIQUE 제약으로 처리 불가)
CREATE UNIQUE INDEX IF NOT EXISTS family_members_profile_unique
  ON family_members (family_id, profile_id)
  WHERE profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS family_members_child_unique
  ON family_members (family_id, child_id)
  WHERE child_id IS NOT NULL;

-- ④ family_member_permissions 테이블
CREATE TABLE IF NOT EXISTS family_member_permissions (
  id                         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                  UUID    NOT NULL UNIQUE REFERENCES family_members(id) ON DELETE CASCADE,
  can_give_allowance         BOOLEAN NOT NULL DEFAULT false,
  can_approve_behavior       BOOLEAN NOT NULL DEFAULT false,
  can_approve_borrow         BOOLEAN NOT NULL DEFAULT false,
  can_approve_spend          BOOLEAN NOT NULL DEFAULT false,
  can_change_settings        BOOLEAN NOT NULL DEFAULT false,
  can_view_reports           BOOLEAN NOT NULL DEFAULT true,
  max_gift_amount_per_month  BIGINT                             -- NULL = 무제한
);

-- ⑤ children 테이블 확장
-- age_stage: UI 분기 기반 (Phase 2에서 사용)
ALTER TABLE children ADD COLUMN IF NOT EXISTS family_id  UUID REFERENCES families(id) ON DELETE SET NULL;
ALTER TABLE children ADD COLUMN IF NOT EXISTS age_stage  TEXT;

-- ============================================================
-- 기존 데이터 자동 이관
-- ============================================================

-- Step 1: 부모마다 Family 1개 생성
INSERT INTO families (name, created_by, created_at)
SELECT
  p.name || ' 가족',
  p.id,
  p.created_at
FROM profiles p
WHERE p.role = 'parent'
ON CONFLICT (created_by) DO NOTHING;

-- Step 2: 부모를 PRIMARY_GUARDIAN으로 등록
INSERT INTO family_members (family_id, profile_id, child_id, role, display_name, joined_at, status)
SELECT
  f.id,
  p.id,
  NULL,
  'PRIMARY_GUARDIAN',
  p.name,
  p.created_at,
  'active'
FROM profiles p
JOIN families f ON f.created_by = p.id
WHERE p.role = 'parent'
ON CONFLICT DO NOTHING;

-- Step 3: 아이를 CHILD 멤버로 등록
INSERT INTO family_members (family_id, profile_id, child_id, role, display_name, joined_at, status)
SELECT
  f.id,
  NULL,
  c.id,
  'CHILD',
  c.name,
  c.created_at,
  'active'
FROM children c
JOIN families f ON f.created_by = c.parent_id
WHERE c.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Step 4: child_guardians → GUARDIAN 멤버로 이관
INSERT INTO family_members (family_id, profile_id, child_id, role, display_name, joined_at, invited_by, status)
SELECT DISTINCT ON (f.id, cg.guardian_id)
  f.id,
  cg.guardian_id,
  NULL,
  'GUARDIAN',
  p.name,
  cg.created_at,
  cg.invited_by,
  'active'
FROM child_guardians cg
JOIN children c ON c.id = cg.child_id
JOIN families f ON f.created_by = c.parent_id
JOIN profiles p ON p.id = cg.guardian_id
ON CONFLICT DO NOTHING;

-- Step 5: GUARDIAN permissions child_guardians → family_member_permissions로 이관
INSERT INTO family_member_permissions (
  member_id,
  can_give_allowance,
  can_approve_behavior,
  can_approve_borrow,
  can_change_settings,
  can_view_reports
)
SELECT DISTINCT ON (fm.id)
  fm.id,
  bool_or(cg.can_give_allowance),
  bool_or(cg.can_approve_behavior),
  bool_or(cg.can_approve_borrow),
  bool_or(cg.can_change_settings),
  bool_or(cg.can_view)
FROM child_guardians cg
JOIN children c ON c.id = cg.child_id
JOIN families f ON f.created_by = c.parent_id
JOIN family_members fm ON fm.family_id = f.id AND fm.profile_id = cg.guardian_id
GROUP BY fm.id
ON CONFLICT (member_id) DO NOTHING;

-- Step 6: PRIMARY_GUARDIAN permissions (모든 권한)
INSERT INTO family_member_permissions (
  member_id,
  can_give_allowance,
  can_approve_behavior,
  can_approve_borrow,
  can_approve_spend,
  can_change_settings,
  can_view_reports
)
SELECT
  fm.id,
  true, true, true, true, true, true
FROM family_members fm
WHERE fm.role = 'PRIMARY_GUARDIAN'
ON CONFLICT (member_id) DO NOTHING;

-- Step 7: children.family_id 채우기
UPDATE children c
SET family_id = f.id
FROM families f
WHERE f.created_by = c.parent_id
  AND c.family_id IS NULL;

-- Step 8: children.age_stage 채우기 (현재 연도 기준)
UPDATE children SET age_stage =
  CASE
    WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 7  AND 9  THEN 'EARLY_CHILD'
    WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 10 AND 12 THEN 'CHILD'
    WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 13 AND 15 THEN 'TEEN'
    ELSE 'OLDER_TEEN'
  END;

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE families                ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_member_permissions ENABLE ROW LEVEL SECURITY;

-- families: 자신이 속한 family만 조회
CREATE POLICY families_select_by_member ON families
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.profile_id = auth.uid()
        AND fm.status = 'active'
    )
  );

-- families: 부모(PRIMARY_GUARDIAN)만 생성
CREATE POLICY families_insert_by_parent ON families
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- family_members: 같은 family 멤버만 조회
CREATE POLICY family_members_select_by_family ON family_members
  FOR SELECT TO authenticated
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.profile_id = auth.uid()
        AND fm.status = 'active'
    )
  );

-- family_members: PRIMARY_GUARDIAN만 추가
CREATE POLICY family_members_insert_by_guardian ON family_members
  FOR INSERT TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.profile_id = auth.uid()
        AND fm.role = 'PRIMARY_GUARDIAN'
        AND fm.status = 'active'
    )
  );

-- family_member_permissions: 같은 family 멤버만 조회
CREATE POLICY fmp_select_by_family ON family_member_permissions
  FOR SELECT TO authenticated
  USING (
    member_id IN (
      SELECT fm2.id FROM family_members fm2
      WHERE fm2.family_id IN (
        SELECT fm.family_id FROM family_members fm
        WHERE fm.profile_id = auth.uid()
          AND fm.status = 'active'
      )
    )
  );

-- ============================================================
-- 헬퍼 RPC: 아이가 속한 family 조회
-- ============================================================

CREATE OR REPLACE FUNCTION get_child_family(p_child_id UUID)
RETURNS TABLE (
  family_id   UUID,
  family_name TEXT,
  member_role family_role,
  member_name TEXT
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT
    f.id,
    f.name,
    fm.role,
    fm.display_name
  FROM family_members fm
  JOIN families f ON f.id = fm.family_id
  WHERE fm.child_id = p_child_id
    AND fm.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION get_child_family(UUID) TO authenticated;
