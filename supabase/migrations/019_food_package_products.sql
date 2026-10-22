-- ============================================================================
-- VIVERST · food packages for sale online
-- Run after 018, in Supabase → SQL Editor. Safe to re-run.
--   1. A "Food packages" category, and the three December packages as shop
--      products (Merry, Jolly, Berekete), each with 50 in stock. Change stock
--      under Stock in the admin. A re-run never adds stock twice: stock is
--      only recorded for a product created by this run.
--   2. Links each package on the food package page to its product and turns
--      on online checkout, so each package can be bought through Paystack.
--      A package already linked in the admin keeps its link.
--   3. place_order: with bank transfer switched off in Settings → Payments,
--      a bank-transfer order is refused, so "Paystack only" really means it.
--      Everything else in the function is exactly as in 017.
-- ============================================================================

insert into public.product_categories (slug, name, sort)
values ('food-packages', 'Food packages', 4)
on conflict (slug) do nothing;

with fresh as (
  insert into public.products (slug, name, category_id, summary, description, unit, price_kobo, active, featured, sort)
  select v.slug, v.name, (select id from public.product_categories where slug = 'food-packages'),
         v.summary, v.description, '1 package', v.price_kobo, true, false, v.sort
  from (values
    ('merry-package', 'Merry Package', 4999900, 100,
     '10 kg of rice, 1 live chicken, groundnut oil (1 L) and half a crate of eggs.',
     'Part of the December Food Package.' || chr(10) || chr(10) || 'Delivered: we call to confirm your order and the delivery fee. Want to pay in instalments? Message us on WhatsApp.'),
    ('jolly-package', 'Jolly Package', 7499900, 101,
     'Half bag of rice (25 kg), 1 live chicken, groundnut oil (2 L) and 1 crate of eggs.',
     'Part of the December Food Package.' || chr(10) || chr(10) || 'Delivered: we call to confirm your order and the delivery fee. Want to pay in instalments? Message us on WhatsApp.'),
    ('berekete-package', 'Berekete Package', 12499900, 102,
     'Full bag of rice (50 kg), 1 live chicken, groundnut oil (5 L) and 1 crate of eggs.',
     'Part of the December Food Package.' || chr(10) || chr(10) || 'Delivered: we call to confirm your order and the delivery fee. Want to pay in instalments? Message us on WhatsApp.')
  ) as v(slug, name, price_kobo, sort, summary, description)
  on conflict (slug) do nothing
  returning id
)
insert into public.inventory_movements (product_id, delta, reason, note)
select id, 50, 'received', 'opening stock' from fresh;

update public.settings
set value = value
  || jsonb_build_object('checkout', true)
  || jsonb_build_object('packages', (
       select coalesce(jsonb_agg(
         case when coalesce(p->>'product_slug', '') <> '' then p
              when p->>'name' = 'Merry Package'    then p || '{"product_slug":"merry-package"}'::jsonb
              when p->>'name' = 'Jolly Package'    then p || '{"product_slug":"jolly-package"}'::jsonb
              when p->>'name' = 'Berekete Package' then p || '{"product_slug":"berekete-package"}'::jsonb
              else p end
         order by ord), '[]'::jsonb)
       from jsonb_array_elements(value->'packages') with ordinality as t(p, ord)))
where key = 'food_package';

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
    v_subtotal := v_subtotal + v_product.price_kobo * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id, 'name', v_product.name, 'unit', v_product.unit,
      'unit_price_kobo', v_product.price_kobo, 'qty', v_qty, 'line_kobo', v_product.price_kobo * v_qty);
  end loop;

  -- delivery fee by zone (or flat), always computed here, never trusted from the browser
  v_delivery := public.delivery_fee(p_address->>'state', p_address->>'area');

  insert into public.orders (customer_id, email, phone, name, payment_method, subtotal_kobo, delivery_kobo, total_kobo, delivery_address, customer_note)
  values (auth.uid(), p_contact->>'email', p_contact->>'phone', p_contact->>'name', p_payment_method,
          v_subtotal, v_delivery, v_subtotal + v_delivery, p_address, coalesce(p_note,''))
  returning id, number into v_order_id, v_number;

  insert into public.order_items (order_id, product_id, name, unit, unit_price_kobo, qty, line_kobo)
  select v_order_id, (l->>'product_id')::uuid, l->>'name', l->>'unit', (l->>'unit_price_kobo')::bigint, (l->>'qty')::integer, (l->>'line_kobo')::bigint
  from jsonb_array_elements(v_lines) l;

  -- reserve stock; the on_hand >= 0 check raises if anything is oversold
  insert into public.inventory_movements (product_id, delta, reason, order_id, created_by)
  select (l->>'product_id')::uuid, -((l->>'qty')::integer), 'sold', v_order_id, auth.uid()
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('id', v_order_id, 'number', v_number, 'total_kobo', v_subtotal + v_delivery);
exception
  when check_violation then
    raise exception 'one of the items is out of stock';
end $$;


-- check: the three packages with their stock, and the links on the page
select p.name, p.price_kobo / 100 as naira, i.on_hand as in_stock
from public.products p join public.inventory i on i.product_id = p.id
where p.slug in ('merry-package', 'jolly-package', 'berekete-package') order by p.sort;
select value->'checkout' as checkout, jsonb_path_query_array(value, '$.packages[*].product_slug') as linked
from public.settings where key = 'food_package';
