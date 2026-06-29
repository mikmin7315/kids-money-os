-- P-37/P-38/A-CS-01/A-CS-02: 문의 시스템

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'general'
    check (category in ('general', 'account', 'finance', 'borrow', 'allowance', 'bug', 'other')),
  title text not null,
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'resolved', 'closed')),
  admin_reply text,
  admin_note text,
  replied_by uuid references public.profiles(id) on delete set null,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;

-- 본인 문의 읽기/쓰기
create policy "inquiries_own_read" on public.inquiries
  for select to authenticated
  using (user_id = auth.uid());

create policy "inquiries_own_insert" on public.inquiries
  for insert to authenticated
  with check (user_id = auth.uid());

-- 어드민 전체 읽기/쓰기
create policy "inquiries_admin_all" on public.inquiries
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create trigger inquiries_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

select to_regclass('public.inquiries') is not null as has_inquiries;
