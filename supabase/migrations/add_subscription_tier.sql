-- 구독 등급 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free'
  CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'plus'));

-- 어드민이 구독 등급 변경 가능하도록 (추후 결제 웹훅에서 자동 처리)
CREATE POLICY "admin_update_subscription" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid() AND admin_p.role = 'admin'
    )
  );

COMMENT ON COLUMN profiles.subscription_tier IS
  '''free'' = 기본, ''plus'' = 모나리 플러스 구독 중';
