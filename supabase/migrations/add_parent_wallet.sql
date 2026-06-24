-- 부모 지갑 테이블 (충전 잔액 + 연결 계좌 정보)
CREATE TABLE IF NOT EXISTS parent_wallets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance       BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  bank_name     TEXT,
  account_number TEXT,
  account_holder TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id)
);

-- RLS
ALTER TABLE parent_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_wallet_owner"
  ON parent_wallets
  FOR ALL
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- 충전 내역 테이블
CREATE TABLE IF NOT EXISTS parent_wallet_charges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount        BIGINT NOT NULL CHECK (amount > 0),
  method        TEXT NOT NULL DEFAULT 'card',  -- 'card' | 'bank_transfer' | 'virtual_account'
  payment_id    TEXT,  -- PortOne payment ID
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE parent_wallet_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_charges_owner"
  ON parent_wallet_charges
  FOR ALL
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- 자동 updated_at
CREATE OR REPLACE FUNCTION update_parent_wallet_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_parent_wallet_ts
  BEFORE UPDATE ON parent_wallets
  FOR EACH ROW EXECUTE FUNCTION update_parent_wallet_ts();

-- get_app_data_bundle에 parent_wallet 포함 (기존 RPC 확장)
-- 실제로는 Supabase 대시보드에서 RPC 업데이트 필요
-- 임시: 별도 select로 처리
