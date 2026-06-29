-- A-23 가맹점/카테고리 매핑 + A-13 현금 정정 정책 기본값

create table if not exists public.merchant_category_mappings (
  id uuid primary key default gen_random_uuid(),
  merchant_pattern text not null,
  category text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.merchant_category_mappings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='merchant_category_mappings' and policyname='merchant_category_mappings_admin_all') then
    create policy "merchant_category_mappings_admin_all" on public.merchant_category_mappings
      for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

drop trigger if exists merchant_category_mappings_updated_at on public.merchant_category_mappings;
create trigger merchant_category_mappings_updated_at before update on public.merchant_category_mappings
  for each row execute function public.set_updated_at();

-- A-13 현금 정정 정책 기본값 (app_config 재사용)
insert into public.app_config (key, value, description) values
  ('cash_correction_max_amount', '500000', '현금 정정 1회 최대 허용 금액(원)')
on conflict (key) do nothing;

select
  (select count(*) from public.merchant_category_mappings) as merchant_mappings;
