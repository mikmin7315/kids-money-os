-- A-21/A-22: card_transactions에 분쟁 필드 추가 + A-18: 재동의 캠페인

-- A-21/A-22: 분쟁 컬럼
alter table public.card_transactions
  add column if not exists dispute_status text check (dispute_status in ('none','open','reviewing','resolved','rejected')) default 'none',
  add column if not exists dispute_memo text,
  add column if not exists dispute_opened_at timestamptz,
  add column if not exists dispute_resolved_at timestamptz;

-- A-18: 재동의 캠페인
create table if not exists public.consent_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  terms_type text not null,
  target_terms_version text,
  grace_period_days integer not null default 30,
  block_on_expire boolean not null default false,
  status text not null default 'draft' check (status in ('draft','active','ended')),
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consent_campaigns enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='consent_campaigns' and policyname='consent_campaigns_admin_all') then
    create policy "consent_campaigns_admin_all" on public.consent_campaigns
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

drop trigger if exists consent_campaigns_updated_at on public.consent_campaigns;
create trigger consent_campaigns_updated_at before update on public.consent_campaigns
  for each row execute function public.set_updated_at();

select
  (select count(*) from public.consent_campaigns) as campaigns,
  (select count(*) from information_schema.columns
     where table_name = 'card_transactions' and column_name = 'dispute_status') as has_dispute_col;
