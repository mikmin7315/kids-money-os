-- Weekly anonymous cohort statistics for peer-comparison reports.
-- Older installations already have a monthly peer_stats table. The legacy
-- columns remain nullable so the existing settlement function stays valid;
-- its obsolete inserts are skipped by the trigger below.

create table if not exists public.peer_stats (
  id uuid primary key default gen_random_uuid(),
  week_start date,
  age_group text,
  region text,
  avg_allowance integer,
  avg_savings_rate numeric(5,2),
  avg_behavior_rate numeric(5,2),
  spend_breakdown jsonb,
  sample_size integer,
  created_at timestamptz default now()
);

alter table public.peer_stats
  add column if not exists week_start date,
  add column if not exists region text,
  add column if not exists avg_allowance integer,
  add column if not exists avg_behavior_rate numeric(5,2),
  add column if not exists spend_breakdown jsonb,
  add column if not exists sample_size integer,
  add column if not exists year integer,
  add column if not exists month integer,
  add column if not exists avg_behavior_score numeric(5,2),
  add column if not exists avg_interest_rate numeric(5,2),
  add column if not exists sample_count integer;

-- Preserve the superseded monthly aggregates before switching to weekly rows.
create table if not exists public.peer_stats_monthly_archive
  (like public.peer_stats including all);
alter table public.peer_stats_monthly_archive enable row level security;

insert into public.peer_stats_monthly_archive
select * from public.peer_stats where week_start is null
on conflict (id) do nothing;

delete from public.peer_stats where week_start is null;

alter table public.peer_stats
  alter column year drop not null,
  alter column month drop not null,
  alter column avg_behavior_score drop not null,
  alter column avg_interest_rate drop not null,
  alter column sample_count drop not null,
  alter column week_start set not null,
  alter column age_group set not null,
  alter column avg_allowance set not null,
  alter column avg_savings_rate set not null,
  alter column avg_behavior_rate set not null,
  alter column spend_breakdown set not null,
  alter column sample_size set default 0,
  alter column sample_size set not null,
  alter column created_at set default now();

alter table public.peer_stats
  drop constraint if exists peer_stats_age_group_check;

alter table public.peer_stats
  add constraint peer_stats_age_group_check
  check (age_group in ('7-9', '10-13', '14-16'));

drop index if exists public.peer_stats_week_region_unique;
create unique index peer_stats_week_region_unique
  on public.peer_stats (week_start, age_group, region) nulls not distinct;

create or replace function public.skip_legacy_peer_stats_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.week_start is null then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists skip_legacy_peer_stats_insert on public.peer_stats;
create trigger skip_legacy_peer_stats_insert
  before insert on public.peer_stats
  for each row execute function public.skip_legacy_peer_stats_insert();

alter table public.peer_stats enable row level security;

drop policy if exists "peer_stats_read" on public.peer_stats;
drop policy if exists "peer_stats_select" on public.peer_stats;
create policy "peer_stats_select" on public.peer_stats
  for select to authenticated
  using (
    sample_size >= 10
    and exists (
      select 1
      from public.profiles
      where id = auth.uid() and role in ('parent', 'admin')
    )
  );

create or replace function public.get_peer_stats(
  p_age_group text,
  p_region text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('parent', 'admin')
  ) then
    raise exception 'parent or admin session required' using errcode = '42501';
  end if;

  if p_age_group not in ('7-9', '10-13', '14-16') then
    raise exception 'invalid age group' using errcode = '22023';
  end if;

  select row_to_json(stats)
  into result
  from (
    select
      p.id,
      p.week_start,
      p.age_group,
      p.region,
      p.avg_allowance,
      p.avg_savings_rate,
      p.avg_behavior_rate,
      p.spend_breakdown,
      p.sample_size,
      p.created_at
    from public.peer_stats p
    where p.age_group = p_age_group
      and (
        (p_region is null and p.region is null)
        or p.region = p_region
      )
      and p.sample_size >= 10
    order by p.week_start desc
    limit 1
  ) stats;

  return result;
end;
$$;

revoke all on function public.get_peer_stats(text, text) from public;
grant execute on function public.get_peer_stats(text, text) to authenticated;
