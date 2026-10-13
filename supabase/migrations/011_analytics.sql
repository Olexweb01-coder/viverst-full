-- ============================================================================
-- VIVERST · analytics
-- Run after 010. One function the Analytics screen calls; everything is
-- aggregated in the database so no raw rows travel to the browser. Safe to re-run.
-- ============================================================================
create or replace function public.analytics_summary(p_weeks integer default 12) returns jsonb
language sql stable security definer set search_path = public as $$
  with weeks as (
    select generate_series(date_trunc('week', (now() at time zone 'Africa/Lagos') - make_interval(weeks => greatest(p_weeks,1) - 1)),
                           date_trunc('week', now() at time zone 'Africa/Lagos'), interval '1 week') as wk
  ),
  o as (
    select date_trunc('week', created_at at time zone 'Africa/Lagos') as wk, total_kobo, status
    from public.orders where created_at >= now() - make_interval(weeks => greatest(p_weeks,1) + 1)
  ),
  per_week as (
    select w.wk, count(o.wk) filter (where o.status not in ('cancelled','refunded')) as orders,
           coalesce(sum(o.total_kobo) filter (where o.status not in ('cancelled','refunded')), 0) as revenue_kobo
    from weeks w left join o on o.wk = w.wk group by w.wk order by w.wk
  ),
  top_products as (
    select i.name, sum(i.qty) as qty, sum(i.line_kobo) as kobo
    from public.order_items i join public.orders od on od.id = i.order_id
    where od.created_at >= now() - interval '90 days' and od.status not in ('cancelled','refunded')
    group by i.name order by kobo desc limit 8
  ),
  by_status as (select status, count(*) as n from public.orders group by status),
  posts as (select arm, status, count(*) as n from public.posts group by arm, status),
  totals as (
    select (select count(*) from public.orders where status not in ('cancelled','refunded')) as orders_all,
           (select coalesce(sum(total_kobo),0) from public.orders where status in ('paid','packed','shipped','delivered')) as revenue_paid_kobo,
           (select count(*) from public.orders where status = 'awaiting_payment') as awaiting,
           (select count(*) from public.customers) as customers,
           (select count(*) from public.posts where status = 'published') as posts_published,
           (select count(*) from public.events where status = 'published' and starts_at >= now()) as events_upcoming,
           (select count(*) from public.event_registrations where created_at >= now() - interval '30 days') as registrations_30d
  )
  select case when public.is_staff() then jsonb_build_object(
    'weeks', (select jsonb_agg(jsonb_build_object('week', to_char(wk, 'DD Mon'), 'orders', orders, 'revenue_kobo', revenue_kobo)) from per_week),
    'top_products', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'qty', qty, 'kobo', kobo)), '[]'::jsonb) from top_products),
    'by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from by_status),
    'posts', (select coalesce(jsonb_agg(jsonb_build_object('arm', arm, 'status', status, 'n', n)), '[]'::jsonb) from posts),
    'totals', (select to_jsonb(t) from totals t)
  ) else '{}'::jsonb end
$$;
revoke execute on function public.analytics_summary(integer) from public, anon;
grant execute on function public.analytics_summary(integer) to authenticated;
select jsonb_pretty(public.analytics_summary(4)) limit 1;
