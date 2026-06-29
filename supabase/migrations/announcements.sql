-- P-35/C-13/A-N-01: 공지/점검 안내 시스템

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text not null default 'notice'
    check (type in ('notice', 'maintenance', 'update')),
  target text not null default 'all'
    check (target in ('all', 'parent', 'child')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- 부모/아이 모두 active 공지 읽기 가능
create policy "announcements_read_active" on public.announcements
  for select to authenticated
  using (status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));

-- 어드민은 전체 읽기/쓰기
create policy "announcements_admin_all" on public.announcements
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 읽음 처리 테이블
create table if not exists public.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (announcement_id, user_id)
);

alter table public.announcement_reads enable row level security;

create policy "announcement_reads_own" on public.announcement_reads
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- updated_at 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- 확인 쿼리
select
  to_regclass('public.announcements') is not null as has_announcements,
  to_regclass('public.announcement_reads') is not null as has_announcement_reads;
