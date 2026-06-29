-- 알림 환경설정/템플릿/발송로그 기반 (notifications 테이블은 기존에 존재)

-- 알림 수신 설정 (부모/아이 각자 타입별 on/off)
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('parent','child')),
  owner_id uuid not null,
  notif_type text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id, notif_type)
);

-- 알림 템플릿 (어드민 관리)
create table if not exists public.notification_templates (
  notif_type text primary key,
  label text not null,
  title_template text not null,
  body_template text not null,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;
alter table public.notification_templates enable row level security;

-- notification_preferences: 본인(parent) 또는 본인 자녀(child)만 조회/수정. 단순화를 위해 parent 소유 전체 허용.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notification_preferences' and policyname='notification_preferences_owner_parent') then
    create policy "notification_preferences_owner_parent" on public.notification_preferences
      for all to authenticated
      using (owner_type = 'parent' and owner_id = auth.uid())
      with check (owner_type = 'parent' and owner_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notification_preferences' and policyname='notification_preferences_owner_child_parent') then
    create policy "notification_preferences_owner_child_parent" on public.notification_preferences
      for all to authenticated
      using (owner_type = 'child' and exists (select 1 from public.children c where c.id = owner_id and c.parent_id = auth.uid()))
      with check (owner_type = 'child' and exists (select 1 from public.children c where c.id = owner_id and c.parent_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notification_preferences' and policyname='notification_preferences_admin_all') then
    create policy "notification_preferences_admin_all" on public.notification_preferences
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

-- notification_templates: 모두 읽기 가능, 어드민만 쓰기
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notification_templates' and policyname='notification_templates_read') then
    create policy "notification_templates_read" on public.notification_templates
      for select to authenticated using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notification_templates' and policyname='notification_templates_admin_write') then
    create policy "notification_templates_admin_write" on public.notification_templates
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

drop trigger if exists notification_preferences_updated_at on public.notification_preferences;
create trigger notification_preferences_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists notification_templates_updated_at on public.notification_templates;
create trigger notification_templates_updated_at before update on public.notification_templates
  for each row execute function public.set_updated_at();

-- 기본 템플릿 시드
insert into public.notification_templates (notif_type, label, title_template, body_template) values
  ('behavior_check_requested', '행동약속 확인 요청', '행동 약속 확인 요청', '아이가 행동 약속을 기록했습니다. 확인 후 승인해주세요.'),
  ('behavior_approved', '행동약속 승인', '행동 약속 승인', '약속이 승인됐어요! 보상이 지급됩니다.'),
  ('behavior_rejected', '행동약속 반려', '행동 약속 반려', '이번 행동 약속이 반려됐어요. 다시 도전해봐요!'),
  ('borrow_requested', '미리쓰기 요청', '미리쓰기 요청', '아이가 미리쓰기를 요청했습니다. 확인 후 승인해주세요.'),
  ('borrow_auto_approved', '미리쓰기 자동승인', '미리쓰기 자동 승인', '미리쓰기가 자동으로 승인되어 지급됐어요!'),
  ('borrow_approved', '미리쓰기 승인', '미리쓰기 승인', '미리쓰기가 승인되어 지급됐어요!'),
  ('borrow_rejected', '미리쓰기 반려', '미리쓰기 반려', '미리쓰기 요청이 반려됐어요.'),
  ('allowance_failed', '용돈 지급 실패', '정기 용돈 지급 실패', '정기 용돈 지급에 실패했습니다. 지갑 잔액을 확인해주세요.')
on conflict (notif_type) do nothing;

select
  (select count(*) from public.notification_preferences) as preferences,
  (select count(*) from public.notification_templates) as templates;
