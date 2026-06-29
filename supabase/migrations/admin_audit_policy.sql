-- Admin 감사·정책·제한·삭제 관련 테이블

-- 관리자 행동 감사 로그
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  before_value jsonb,
  after_value jsonb,
  notes text,
  created_at timestamptz not null default now()
);

-- 계정 이용 제한
create table if not exists public.account_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  type text not null check (type in ('full','read_only','suspend')),
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  lifted_by uuid references public.profiles(id) on delete set null,
  lifted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or child_id is not null)
);

-- 앱 설정/기능 플래그
create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 탈퇴/삭제 요청
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending','processing','completed','rejected')),
  scheduled_for timestamptz not null default (now() + interval '30 days'),
  completed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 동의 이력
create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  terms_id uuid references public.terms(id) on delete set null,
  terms_type text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

-- RLS
alter table public.admin_audit_logs enable row level security;
alter table public.account_restrictions enable row level security;
alter table public.app_config enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.consent_logs enable row level security;

-- admin_audit_logs: 어드민 전용 읽기
do $$ begin
  if not exists (select 1 from pg_policies where tablename='admin_audit_logs' and policyname='admin_audit_logs_admin_all') then
    create policy "admin_audit_logs_admin_all" on public.admin_audit_logs
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- account_restrictions: 어드민 전체 / 본인 조회
do $$ begin
  if not exists (select 1 from pg_policies where tablename='account_restrictions' and policyname='account_restrictions_self_select') then
    create policy "account_restrictions_self_select" on public.account_restrictions
      for select to authenticated
      using (user_id = auth.uid() and is_active = true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='account_restrictions' and policyname='account_restrictions_admin_all') then
    create policy "account_restrictions_admin_all" on public.account_restrictions
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- app_config: 어드민 쓰기 / 인증 사용자 읽기
do $$ begin
  if not exists (select 1 from pg_policies where tablename='app_config' and policyname='app_config_read') then
    create policy "app_config_read" on public.app_config
      for select to authenticated using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='app_config' and policyname='app_config_admin_write') then
    create policy "app_config_admin_write" on public.app_config
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- account_deletion_requests: 본인 insert + 어드민 전체
do $$ begin
  if not exists (select 1 from pg_policies where tablename='account_deletion_requests' and policyname='deletion_requests_self') then
    create policy "deletion_requests_self" on public.account_deletion_requests
      for all to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='account_deletion_requests' and policyname='deletion_requests_admin') then
    create policy "deletion_requests_admin" on public.account_deletion_requests
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- consent_logs: 본인 읽기/쓰기 + 어드민 전체
do $$ begin
  if not exists (select 1 from pg_policies where tablename='consent_logs' and policyname='consent_logs_self') then
    create policy "consent_logs_self" on public.consent_logs
      for all to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='consent_logs' and policyname='consent_logs_admin') then
    create policy "consent_logs_admin" on public.consent_logs
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- updated_at triggers
drop trigger if exists account_restrictions_updated_at on public.account_restrictions;
create trigger account_restrictions_updated_at before update on public.account_restrictions
  for each row execute function public.set_updated_at();

drop trigger if exists account_deletion_requests_updated_at on public.account_deletion_requests;
create trigger account_deletion_requests_updated_at before update on public.account_deletion_requests
  for each row execute function public.set_updated_at();

-- 기본 app_config 값
insert into public.app_config (key, value, description) values
  ('min_app_version', '"1.0.0"', '최소 지원 앱 버전'),
  ('maintenance_mode', 'false', '점검 모드 (true면 앱 접근 차단)'),
  ('maintenance_message', '"시스템 점검 중입니다."', '점검 안내 문구'),
  ('feature_cards', 'false', '카드 기능 활성화 여부'),
  ('feature_guardians', 'true', '공동 보호자 기능 활성화 여부')
on conflict (key) do nothing;

select
  (select count(*) from public.admin_audit_logs) as audit_logs,
  (select count(*) from public.account_restrictions) as restrictions,
  (select count(*) from public.app_config) as app_config,
  (select count(*) from public.account_deletion_requests) as deletion_requests,
  (select count(*) from public.consent_logs) as consent_logs;
