-- ============================================================================
-- VIVERST · call the ai-draft function on a schedule
-- Run after 006 AND after the function is deployed and CRON_SECRET is set.
-- Needs one secret in the Vault named cron_secret (same value as the
-- function's CRON_SECRET). Safe to re-run.
-- ============================================================================

create extension if not exists pg_net with schema extensions;

create or replace function public.ai_draft_tick() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_secret text; v_req bigint;
begin
  if not public.ai_post_due() then return; end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1;
  if v_secret is null then raise notice 'cron_secret missing from vault'; return; end if;
  select net.http_post(
    url := 'https://puuouftwclqkrrnnzkay.supabase.co/functions/v1/ai-draft',
    headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into v_req;
end $$;
revoke execute on function public.ai_draft_tick() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'viverst-ai-draft';
select cron.schedule('viverst-ai-draft', '7 * * * *', $$ select public.ai_draft_tick(); $$);

select jobname, schedule, active from cron.job where jobname like 'viverst-%' order by jobname;
