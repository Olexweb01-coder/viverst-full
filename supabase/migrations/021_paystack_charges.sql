-- ============================================================================
-- VIVERST · Paystack charges paid by the customer
-- Run after 020, in Supabase → SQL Editor. Safe to re-run.
-- Paystack takes 1.5% + NGN 100 of each local payment (the NGN 100 waived under
-- NGN 2,500, the whole charge capped at NGN 2,000). An order paid through
-- Paystack now adds that charge, once per payment, on the whole order, so the
-- shop receives the full price. It is the smallest whole-naira amount that
-- leaves the full price after Paystack's cut. Bank transfer has no charge.
--   1. orders.fee_kobo: the Paystack charges on that order (0 for transfer)
--   2. paystack_fee / paystack_charge: the calculation, in one place
--   3. place_order: adds the charge to Paystack orders; everything else as 020
--   4. order_detail rebuilt so the order email can show the charge
--   5. analytics revenue counts what the shop keeps, without the charge
-- Foreign cards cost Paystack 3.9% + NGN 100; on those the shop keeps a little
-- less. If Paystack changes its pricing, change paystack_fee below.
-- ============================================================================

alter table public.orders add column if not exists fee_kobo bigint not null default 0 check (fee_kobo >= 0);

-- what Paystack takes from a local payment of p_gross kobo (1.5% rounded up to the kobo)
create or replace function public.paystack_fee(p_gross bigint) returns bigint
language sql immutable as $$
  select least(ceil(p_gross * 15 / 1000.0)::bigint + case when p_gross >= 250000 then 10000 else 0 end, 200000)
$$;

-- the charge to add to p_net kobo so that, after Paystack's cut, p_net is left:
-- the smallest whole-naira total that does it
create or replace function public.paystack_charge(p_net bigint) returns bigint
language plpgsql immutable as $$
declare
  v_best bigint := null;
  v_c bigint;
  v_try bigint;
begin
  if p_net is null or p_net <= 0 then return 0; end if;
  foreach v_try in array array[
    ceil(p_net * 1000 / 985.0)::bigint,             -- 1.5%, NGN 100 waived
    ceil((p_net + 10000) * 1000 / 985.0)::bigint,   -- 1.5% + NGN 100
    p_net + 200000                                  -- capped at NGN 2,000
  ] loop
    v_c := ceil(v_try / 100.0)::bigint * 100;       -- whole naira
    while v_c - public.paystack_fee(v_c) < p_net loop v_c := v_c + 100; end loop;
    if v_best is null or v_c < v_best then v_best := v_c; end if;
  end loop;
  -- the best estimate is within a naira or two of the answer: step down to the smallest that still works
  while v_best - 100 >= p_net and (v_best - 100) - public.paystack_fee(v_best - 100) >= p_net loop v_best := v_best - 100; end loop;
  return v_best - p_net;
end $$;
grant execute on function public.paystack_charge(bigint) to anon, authenticated;
grant execute on function public.paystack_fee(bigint) to anon, authenticated;

create or replace function public.place_order(
  p_items          jsonb,     -- [{product_id, qty}, ...]
  p_contact        jsonb,     -- {name, email, phone}
  p_address        jsonb,     -- {name, phone, line1, line2, city, state}
  p_payment_method text,
  p_note           text default ''
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item      jsonb;
  v_product   public.products%rowtype;
  v_qty       integer;
  v_subtotal  bigint := 0;
  v_delivery  bigint := 0;
  v_fee       bigint := 0;
  v_order_id  uuid;
  v_number    text;
  v_lines     jsonb := '[]'::jsonb;
  v_paystack_ready boolean;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;
  if coalesce(p_contact->>'email','') = '' or coalesce(p_contact->>'phone','') = '' or coalesce(p_contact->>'name','') = '' then
    raise exception 'name, email and phone are required';
  end if;
  if coalesce(p_address->>'line1','') = '' or coalesce(p_address->>'city','') = '' or coalesce(p_address->>'state','') = '' then
    raise exception 'delivery address is incomplete';
  end if;
  if p_payment_method not in ('transfer','paystack') then
    raise exception 'unknown payment method';
  end if;
  if p_payment_method = 'paystack' then
    select exists (select 1 from public.secrets where key = 'paystack_secret_key' and value <> '') into v_paystack_ready;
    if not v_paystack_ready then raise exception 'card payment is not enabled yet'; end if;
  end if;
  -- with bank transfer switched off in Settings, only Paystack is accepted
  if p_payment_method = 'transfer' and coalesce((select (value->'transfer'->>'enabled')::boolean from public.settings where key = 'payments'), true) = false then
    raise exception 'bank transfer is not offered right now';
  end if;

  -- validate lines and build snapshot
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty <= 0 then raise exception 'bad quantity'; end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and active;
    if not found then raise exception 'product unavailable: %', v_item->>'product_id'; end if;
    -- marked out of stock on the Stock page: shown in the shop, but not for sale
    if v_product.out_of_stock then raise exception 'one of the items is out of stock'; end if;
    v_subtotal := v_subtotal + v_product.price_kobo * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id, 'name', v_product.name, 'unit', v_product.unit,
      'unit_price_kobo', v_product.price_kobo, 'qty', v_qty, 'line_kobo', v_product.price_kobo * v_qty);
  end loop;

  -- delivery fee by zone (or flat), always computed here, never trusted from the browser
  v_delivery := public.delivery_fee(p_address->>'state', p_address->>'area');

  -- Paystack charges, once per payment, on the whole order: the customer pays them,
  -- so the shop receives the full price. Bank transfer has no charge.
  if p_payment_method = 'paystack' then v_fee := public.paystack_charge(v_subtotal + v_delivery); end if;

  insert into public.orders (customer_id, email, phone, name, payment_method, subtotal_kobo, delivery_kobo, fee_kobo, total_kobo, delivery_address, customer_note)
  values (auth.uid(), p_contact->>'email', p_contact->>'phone', p_contact->>'name', p_payment_method,
          v_subtotal, v_delivery, v_fee, v_subtotal + v_delivery + v_fee, p_address, coalesce(p_note,''))
  returning id, number into v_order_id, v_number;

  insert into public.order_items (order_id, product_id, name, unit, unit_price_kobo, qty, line_kobo)
  select v_order_id, (l->>'product_id')::uuid, l->>'name', l->>'unit', (l->>'unit_price_kobo')::bigint, (l->>'qty')::integer, (l->>'line_kobo')::bigint
  from jsonb_array_elements(v_lines) l;

  -- reserve stock; the on_hand >= 0 check raises if anything is oversold
  insert into public.inventory_movements (product_id, delta, reason, order_id, created_by)
  select (l->>'product_id')::uuid, -((l->>'qty')::integer), 'sold', v_order_id, auth.uid()
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('id', v_order_id, 'number', v_number, 'total_kobo', v_subtotal + v_delivery + v_fee, 'fee_kobo', v_fee);
exception
  when check_violation then
    raise exception 'one of the items is out of stock';
end $$;

-- the order email reads this view; rebuilt so it includes fee_kobo (as in 015)
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

-- revenue is what the shop keeps: the total less the Paystack charges
create or replace function public.analytics_summary(p_weeks integer default 12) returns jsonb
language sql stable security definer set search_path = public as $$
  with weeks as (
    select generate_series(date_trunc('week', (now() at time zone 'Africa/Lagos') - make_interval(weeks => greatest(p_weeks,1) - 1)),
                           date_trunc('week', now() at time zone 'Africa/Lagos'), interval '1 week') as wk
  ),
  o as (
    select date_trunc('week', created_at at time zone 'Africa/Lagos') as wk, total_kobo - fee_kobo as total_kobo, status
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
           (select coalesce(sum(total_kobo - fee_kobo),0) from public.orders where status in ('paid','packed','shipped','delivered')) as revenue_paid_kobo,
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

-- check: what each December package costs through Paystack
select name, price_kobo / 100 as price, public.paystack_charge(price_kobo) / 100 as paystack_charges,
       (price_kobo + public.paystack_charge(price_kobo)) / 100 as customer_pays
from public.products where slug in ('merry-package', 'jolly-package', 'berekete-package') order by sort;
