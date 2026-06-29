-- A-T-01/A-T-02/A-18: 약관 관리

create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('service', 'privacy', 'marketing')),
  version text not null,
  title text not null,
  body text not null,
  is_active boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, version)
);

alter table public.terms enable row level security;

-- 모든 인증 사용자가 활성 약관 읽기 가능
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'terms' and policyname = 'terms_read_active') then
    create policy "terms_read_active" on public.terms
      for select to authenticated
      using (is_active = true);
  end if;
end $$;

-- 어드민만 전체 관리 가능
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'terms' and policyname = 'terms_admin_all') then
    create policy "terms_admin_all" on public.terms
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

drop trigger if exists terms_updated_at on public.terms;
create trigger terms_updated_at
  before update on public.terms
  for each row execute function public.set_updated_at();

-- 기본 약관 데이터 (현재 static 페이지 내용 요약)
insert into public.terms (type, version, title, body, is_active, published_at)
values
  ('service', '1.0', '서비스 이용약관', '본 약관은 Monari 서비스 이용에 관한 기본 사항을 규정합니다.', true, now()),
  ('privacy', '1.0', '개인정보 처리방침', '본 방침은 Monari가 수집·이용하는 개인정보 처리에 관한 사항을 규정합니다.', true, now())
on conflict (type, version) do nothing;

select count(*) as terms_count from public.terms;
