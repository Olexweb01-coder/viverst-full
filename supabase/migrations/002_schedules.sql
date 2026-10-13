-- ============================================================================
-- VIVERST · scheduled jobs
-- Run AFTER 001_foundation.sql, in Supabase → SQL Editor.
-- Uses pg_cron (built into Supabase; not available on plain Postgres, so this
-- file is small and readable rather than machine-tested). Safe to re-run:
-- each job is unscheduled first if it already exists.
-- ============================================================================

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;

-- keep-alive: touch the heartbeat every 6 hours so the project is never idle
-- for the 7 days that would pause it on the free plan.
select cron.unschedule(jobid) from cron.job where jobname = 'viverst-heartbeat';
select cron.schedule('viverst-heartbeat', '0 */6 * * *', $$ select public.beat(); $$);

-- blog: publish anything whose 24-hour review window has lapsed, hourly.
select cron.unschedule(jobid) from cron.job where jobname = 'viverst-publish-due-posts';
select cron.schedule('viverst-publish-due-posts', '5 * * * *', $$ select public.publish_due_posts(); $$);

-- show what is scheduled (expect two rows)
select jobname, schedule, active from cron.job where jobname like 'viverst-%' order by jobname;
