-- ============================================================================
-- VIVERST · shop payments and order emails
-- Run after 014. Records when a customer was emailed about an order, stores
-- the shop's public address for payment callbacks, and lets the email job
-- run when there are orders to confirm. Safe to re-run.
-- ============================================================================
alter table public.orders add column if not exists customer_emailed_at timestamptz;

-- order_detail was created with o.*, which Postgres expands once: rebuild it so
-- it includes the new column (the email function reads it from this view)
drop view if exists public.order_detail;
create view public.order_detail as
  select o.*, coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'product_id', i.product_id, 'name', i.name, 'unit', i.unit,
      'unit_price_kobo', i.unit_price_kobo, 'qty', i.qty, 'line_kobo', i.line_kobo) order by i.id)
      filter (where i.id is not null), '[]'::jsonb) as items
  from public.orders o left join public.order_items i on i.order_id = o.id
  group by o.id;
alter view public.order_detail set (security_invoker = true);
grant select on public.order_detail to authenticated;
update public.settings set value = value || '{"url":"https://shopagro.viverst.com"}'::jsonb where key = 'shop' and not (value ? 'url');

create or replace function public.notify_email_tick() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_secret text; v_req bigint;
begin
  if not exists (select 1 from public.notifications where emailed_at is null)
     and not exists (select 1 from public.orders where customer_emailed_at is null and status <> 'cancelled') then return; end if;
  if not exists (select 1 from public.secrets where key = 'resend_api_key' and value <> '') then return; end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1;
  if v_secret is null then return; end if;
  select net.http_post(
    url := 'https://puuouftwclqkrrnnzkay.supabase.co/functions/v1/notify-email',
    headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', v_secret),
    body := '{}'::jsonb, timeout_milliseconds := 30000) into v_req;
end $$;
-- run every 2 minutes now, so customers hear back quickly
select cron.unschedule(jobid) from cron.job where jobname = 'viverst-notify-email';
select cron.schedule('viverst-notify-email', '*/2 * * * *', $$ select public.notify_email_tick(); $$);
select jobname, schedule from cron.job where jobname = 'viverst-notify-email';

-- one saved address per label per customer, so the shop can upsert "Home"
create unique index if not exists addresses_customer_label_idx on public.addresses (customer_id, label);
