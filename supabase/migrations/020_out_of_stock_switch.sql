-- ============================================================================
-- VIVERST · mark products out of stock
-- Run after 019, in Supabase → SQL Editor. Safe to re-run.
-- Adds an "out of stock" switch to every product, set on the Stock page in the
-- admin, one product at a time or all at once. A product marked out of stock
-- stays in the shop, shown as sold out, and cannot be ordered; its stock count
-- is kept, so switching it back puts it on sale with the same number.
--   1. products.out_of_stock (off for every product to begin with)
--   2. the shop's stock view counts a marked product as not in stock
--   3. place_order refuses a marked product. Everything else in the function
--      is exactly as in 019.
-- ============================================================================

alter table public.products add column if not exists out_of_stock boolean not null default false;

create or replace view public.stock as
  select i.product_id,
         i.on_hand > 0 and not p.out_of_stock as in_stock,
         case when p.out_of_stock then 0 else least(i.on_hand, 99) end as available
  from public.inventory i join public.products p on p.id = i.product_id
  where p.active;

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
    -- marked out of stock on the Stock page: shown in the shop, but not for sale
    if v_product.out_of_stock then raise exception 'one of the items is out of stock'; end if;
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

-- check: every product, whether it is marked out of stock, and what the shop sees
select p.name, i.on_hand, p.out_of_stock as marked_out, s.in_stock as shop_can_sell
from public.products p join public.inventory i on i.product_id = p.id
left join public.stock s on s.product_id = p.id
order by p.sort, p.name;
