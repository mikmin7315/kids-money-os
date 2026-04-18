-- Enable extensions (run once in Supabase SQL editor as postgres)
create extension if not exists pg_cron schema extensions;
create extension if not exists pg_net schema extensions;

-- Remove existing job if re-running this script
select cron.unschedule('monthly-interest-settlement')
where exists (
  select 1 from cron.job where jobname = 'monthly-interest-settlement'
);

-- Schedule: 1st of every month at 00:05 UTC
select cron.schedule(
  'monthly-interest-settlement',
  '5 0 1 * *',
  $$
  select net.http_post(
    url    := (select value from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/monthly-settlement',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select value from vault.decrypted_secrets where name = 'supabase_service_role_key')
    ),
    body   := '{}'::jsonb
  );
  $$
);
