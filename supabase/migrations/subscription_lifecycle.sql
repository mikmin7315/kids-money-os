-- 구독 생명주기: 만료일·해지일·결제 내역·만료 함수

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid', -- paid | cancelled | failed
  plan TEXT NOT NULL DEFAULT 'plus',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_records_select_by_owner"
  ON payment_records FOR SELECT
  USING (auth.uid() = user_id);

-- 만료된 구독 다운그레이드 (expire-subscriptions Edge Function에서 호출)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE profiles
  SET subscription_tier = 'free'
  WHERE subscription_tier = 'plus'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
