-- 공동 보호자 초대 및 권한 관리

create table if not exists public.guardian_invites (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  status text not null default 'pending' check (status in ('pending','accepted','expired','cancelled')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.child_guardians (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  guardian_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  -- 권한 플래그
  can_view boolean not null default true,
  can_give_allowance boolean not null default false,
  can_approve_behavior boolean not null default false,
  can_approve_borrow boolean not null default false,
  can_change_settings boolean not null default false,
  can_invite_guardian boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, guardian_id)
);

alter table public.guardian_invites enable row level security;
alter table public.child_guardians enable row level security;

-- guardian_invites: 초대한 부모만 열람/수정
do $$ begin
  if not exists (select 1 from pg_policies where tablename='guardian_invites' and policyname='guardian_invites_parent_all') then
    create policy "guardian_invites_parent_all" on public.guardian_invites
      for all to authenticated
      using (parent_id = auth.uid())
      with check (parent_id = auth.uid());
  end if;
end $$;

-- guardian_invites: 이메일 수신자가 자신의 초대 확인 (token으로 조회)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='guardian_invites' and policyname='guardian_invites_recipient_select') then
    create policy "guardian_invites_recipient_select" on public.guardian_invites
      for select to authenticated
      using (
        email = (select email from public.profiles where id = auth.uid())
        and status = 'pending'
        and expires_at > now()
      );
  end if;
end $$;

-- child_guardians: 초대한 부모 또는 보호자 본인만
do $$ begin
  if not exists (select 1 from pg_policies where tablename='child_guardians' and policyname='child_guardians_select') then
    create policy "child_guardians_select" on public.child_guardians
      for select to authenticated
      using (
        guardian_id = auth.uid()
        or invited_by = auth.uid()
        or exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
      );
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='child_guardians' and policyname='child_guardians_parent_manage') then
    create policy "child_guardians_parent_manage" on public.child_guardians
      for all to authenticated
      using (
        invited_by = auth.uid()
        or exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
      )
      with check (
        invited_by = auth.uid()
        or exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
      );
  end if;
end $$;

-- updated_at triggers
drop trigger if exists guardian_invites_updated_at on public.guardian_invites;
create trigger guardian_invites_updated_at before update on public.guardian_invites
  for each row execute function public.set_updated_at();

drop trigger if exists child_guardians_updated_at on public.child_guardians;
create trigger child_guardians_updated_at before update on public.child_guardians
  for each row execute function public.set_updated_at();

select
  (select count(*) from public.guardian_invites) as guardian_invites,
  (select count(*) from public.child_guardians) as child_guardians;
