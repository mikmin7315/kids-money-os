-- 빌링키 저장 — 자동 갱신 정기결제용
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS billing_key TEXT,
  ADD COLUMN IF NOT EXISTS billing_key_issued_at TIMESTAMPTZ;
