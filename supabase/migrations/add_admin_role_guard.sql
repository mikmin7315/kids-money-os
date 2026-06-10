create or replace function public.change_profile_role(
  p_profile_id uuid,
  p_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_role public.app_role;
  v_admin_count integer;
begin
  lock table public.profiles in share row exclusive mode;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  if p_role not in ('parent', 'admin') then
    raise exception 'Unsupported role';
  end if;

  select role into v_target_role
  from public.profiles
  where id = p_profile_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_target_role = 'admin' and p_role = 'parent' then
    select count(*) into v_admin_count from public.profiles where role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'The last admin cannot be demoted';
    end if;
  end if;

  update public.profiles set role = p_role where id = p_profile_id;
end;
$$;

revoke all on function public.change_profile_role(uuid, public.app_role) from public, anon;
grant execute on function public.change_profile_role(uuid, public.app_role) to authenticated;
