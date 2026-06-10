alter table public.children
  add column if not exists pin_failed_attempts integer not null default 0
    check (pin_failed_attempts >= 0),
  add column if not exists pin_locked_until timestamptz;

drop function if exists public.record_child_pin_failure(uuid);

create or replace function public.consume_child_pin_attempt(p_child_id uuid)
returns table (attempt_allowed boolean, failed_attempts integer, locked_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.children
  set
    pin_failed_attempts = case
      when pin_locked_until > now() then pin_failed_attempts
      when pin_locked_until is not null then 1
      else pin_failed_attempts + 1
    end,
    pin_locked_until = case
      when pin_locked_until > now() then pin_locked_until
      when (case when pin_locked_until is not null then 1 else pin_failed_attempts + 1 end) > 5
        then now() + interval '15 minutes'
      else null
    end
  where id = p_child_id
  returning pin_locked_until is null or pin_locked_until <= now(), pin_failed_attempts, pin_locked_until;
end;
$$;

revoke all on function public.consume_child_pin_attempt(uuid) from public, anon, authenticated;
grant execute on function public.consume_child_pin_attempt(uuid) to service_role;
