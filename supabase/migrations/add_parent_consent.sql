alter table public.profiles
  add column if not exists consent_version text,
  add column if not exists consent_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, name, consent_version, consent_at)
  values (
    new.id,
    'parent',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, 'parent'), '@', 1)),
    case when new.raw_user_meta_data ->> 'consent_version' = '2026-06-10' then '2026-06-10' else null end,
    case when new.raw_user_meta_data ->> 'consent_version' = '2026-06-10' then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
