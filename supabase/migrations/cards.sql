-- 카드 도메인: card_applications / child_cards / card_transactions / card_integration_logs

-- 카드 신청
create table if not exists public.card_applications (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  status text not null default 'initiated'
    check (status in ('initiated','submitted','reviewing','approved','rejected','issued','delivery','cancelled')),
  partner text not null default 'mock',
  external_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 아이 카드
create table if not exists public.child_cards (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.card_applications(id) on delete set null,
  status text not null default 'active'
    check (status in ('active','frozen','lost','cancelled','expired')),
  is_enabled boolean not null default true,
  daily_limit integer not null default 50000,
  monthly_limit integer not null default 300000,
  last4 text,
  partner text not null default 'mock',
  issued_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 카드 거래
create table if not exists public.card_transactions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.child_cards(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  merchant_name text not null default '',
  merchant_category text not null default 'other',
  amount integer not null,
  status text not null default 'approved'
    check (status in ('approved','declined','cancelled','reversed')),
  approved_at timestamptz not null default now(),
  raw_payload jsonb,
  money_transaction_id uuid,
  created_at timestamptz not null default now()
);

-- 카드 연동 로그
create table if not exists public.card_integration_logs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.child_cards(id) on delete set null,
  event_type text not null,
  request jsonb,
  response jsonb,
  status_code integer,
  error_message text,
  retried boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.card_applications enable row level security;
alter table public.child_cards enable row level security;
alter table public.card_transactions enable row level security;
alter table public.card_integration_logs enable row level security;

-- card_applications: 부모 본인만 열람
do $$ begin
  if not exists (select 1 from pg_policies where tablename='card_applications' and policyname='card_applications_parent_select') then
    create policy "card_applications_parent_select" on public.card_applications
      for select to authenticated
      using (parent_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='card_applications' and policyname='card_applications_parent_insert') then
    create policy "card_applications_parent_insert" on public.card_applications
      for insert to authenticated
      with check (parent_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='card_applications' and policyname='card_applications_admin_all') then
    create policy "card_applications_admin_all" on public.card_applications
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- child_cards: 부모 본인만
do $$ begin
  if not exists (select 1 from pg_policies where tablename='child_cards' and policyname='child_cards_parent_select') then
    create policy "child_cards_parent_select" on public.child_cards
      for select to authenticated
      using (parent_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='child_cards' and policyname='child_cards_parent_update') then
    create policy "child_cards_parent_update" on public.child_cards
      for update to authenticated
      using (parent_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='child_cards' and policyname='child_cards_admin_all') then
    create policy "child_cards_admin_all" on public.child_cards
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- card_transactions: 부모 본인 (child_id → child_cards → parent_id)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='card_transactions' and policyname='card_transactions_parent_select') then
    create policy "card_transactions_parent_select" on public.card_transactions
      for select to authenticated
      using (exists (select 1 from public.child_cards cc where cc.id = card_id and cc.parent_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='card_transactions' and policyname='card_transactions_admin_all') then
    create policy "card_transactions_admin_all" on public.card_transactions
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- card_integration_logs: 어드민 전용
do $$ begin
  if not exists (select 1 from pg_policies where tablename='card_integration_logs' and policyname='card_integration_logs_admin_all') then
    create policy "card_integration_logs_admin_all" on public.card_integration_logs
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- updated_at triggers
drop trigger if exists card_applications_updated_at on public.card_applications;
create trigger card_applications_updated_at before update on public.card_applications
  for each row execute function public.set_updated_at();

drop trigger if exists child_cards_updated_at on public.child_cards;
create trigger child_cards_updated_at before update on public.child_cards
  for each row execute function public.set_updated_at();

select
  (select count(*) from public.card_applications) as card_applications,
  (select count(*) from public.child_cards) as child_cards,
  (select count(*) from public.card_transactions) as card_transactions;
