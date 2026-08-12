-- allowance_rules 테이블에 누락된 deleted_at 컬럼 추가
-- process_scheduled_allowances RPC가 ar.deleted_at is null을 참조하지만
-- 해당 컬럼이 테이블에 존재하지 않아 500 에러 발생
alter table public.allowance_rules add column if not exists deleted_at timestamptz;
