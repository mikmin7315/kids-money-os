-- Enable extensions (run once in Supabase SQL editor as postgres)
create extension if not exists pg_cron schema extensions;
create extension if not exists pg_net schema extensions;

-- ① monthly-interest-settlement: 매월 1일 00:05 UTC (KST 09:05)
select cron.unschedule('monthly-interest-settlement')
where exists (select 1 from cron.job where jobname = 'monthly-interest-settlement');

select cron.schedule(
  'monthly-interest-settlement',
  '5 0 1 * *',
  $$
  select net.http_post(
    url     := (select value from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/monthly-settlement',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || (select value from vault.decrypted_secrets where name = 'supabase_service_role_key'),
      'x-cron-secret',  (select value from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ② process-allowances: 매일 15:05 UTC (KST 00:05)
select cron.unschedule('daily-process-allowances')
where exists (select 1 from cron.job where jobname = 'daily-process-allowances');

select cron.schedule(
  'daily-process-allowances',
  '5 15 * * *',
  $$
  select net.http_post(
    url     := (select value from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/process-allowances',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || (select value from vault.decrypted_secrets where name = 'supabase_service_role_key'),
      'x-cron-secret',  (select value from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- process-behavior-reminders: every day at 23:00 UTC (KST 08:00)
select cron.unschedule('daily-behavior-reminders')
where exists (select 1 from cron.job where jobname = 'daily-behavior-reminders');

select cron.schedule(
  'daily-behavior-reminders',
  '0 23 * * *',
  $$
  select net.http_post(
    url     := (select value from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/process-behavior-reminders',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || (select value from vault.decrypted_secrets where name = 'supabase_service_role_key'),
      'x-cron-secret',  (select value from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);
