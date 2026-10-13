-- ============================================================================
-- VIVERST · email digest schedule
-- Run after 009 and after the notify-email function is deployed. Every 10
-- minutes, if anything is unsent, call the function. It does nothing until a
-- Resend key exists. Safe to re-run.
-- ============================================================================
create or replace function public.notify_email_tick() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_secret text; v_req bigint;
begin
  if not exists (select 1 from public.notifications where emailed_at is null) then return; end if;
  if not exists (select 1 from public.secrets where key = 'resend_api_key' and value <> '') then return; end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1;
  if v_secret is null then return; end if;
  select net.http_post(
    url := 'https://puuouftwclqkrrnnzkay.supabase.co/functions/v1/notify-email',
    headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', v_secret),
    body := '{}'::jsonb, timeout_milliseconds := 30000) into v_req;
end $$;
revoke execute on function public.notify_email_tick() from public, anon, authenticated;
select cron.unschedule(jobid) from cron.job where jobname = 'viverst-notify-email';
select cron.schedule('viverst-notify-email', '*/10 * * * *', $$ select public.notify_email_tick(); $$);
select jobname, schedule, active from cron.job where jobname like 'viverst-%' order by jobname;
