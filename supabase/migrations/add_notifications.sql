-- Run once in Supabase SQL editor
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  child_id    uuid references public.children(id) on delete set null,
  target      text not null check (target in ('parent', 'child')),
  type        text not null,
  title       text not null,
  body        text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "parent_can_read_own_notifications"
  on public.notifications for select
  using (parent_id = auth.uid());

create policy "parent_can_update_own_notifications"
  on public.notifications for update
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

create index if not exists notifications_parent_id_idx
  on public.notifications (parent_id, is_read, created_at desc);

create index if not exists notifications_child_id_idx
  on public.notifications (child_id, target, is_read);
