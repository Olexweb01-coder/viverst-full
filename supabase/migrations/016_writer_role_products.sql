-- ============================================================================
-- VIVERST · writer role + starter products
-- Run after 015. Adds a 'writer' staff role that can only work on content
-- (blog, automation, assistant, content notifications), and inserts the seven
-- starter products so the shop can take real orders. Safe to re-run.
-- ============================================================================

-- 1. role
alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check check (role in ('owner','manager','editor','writer'));

-- ops = staff who may touch the shop, events and settings (everyone but writers)
create or replace function public.is_ops() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active and role in ('owner','manager','editor'))
$$;
grant execute on function public.is_ops() to anon, authenticated;

create or replace function public.add_staff(p_email text, p_name text, p_role text) returns public.staff
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_row public.staff;
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  if p_role not in ('owner','manager','editor','writer') then raise exception 'role must be owner, manager, editor or writer'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_id is null then
    raise exception 'No account with that email yet. Create it under Authentication → Users in Supabase (or have them sign in once), then add them here.';
  end if;
  insert into public.staff (user_id, email, name, role, active)
  values (v_id, lower(trim(p_email)), coalesce(nullif(trim(p_name), ''), split_part(p_email, '@', 1)), p_role, true)
  on conflict (user_id) do update set name = excluded.name, role = excluded.role, active = true
  returning * into v_row;
  return v_row;
end $$;

-- 2. shop, events, customers: ops only (writers lose access)
do $$ declare t text; begin
  for t in select unnest(array['products','product_categories','inventory','inventory_movements','orders','order_items','customers','addresses','events','event_registrations']) loop
    execute format('drop policy if exists %I on public.%I', t || '_staff_all', t);
  end loop;
end $$;
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (active or public.is_ops());
drop policy if exists products_staff_write on public.products;
create policy products_staff_write on public.products for all using (public.is_ops()) with check (public.is_ops());
drop policy if exists categories_staff_write on public.product_categories;
create policy categories_staff_write on public.product_categories for all using (public.is_ops()) with check (public.is_ops());
drop policy if exists inventory_staff_write on public.inventory;
create policy inventory_staff_write on public.inventory for update using (public.is_ops()) with check (public.is_ops());
drop policy if exists movements_staff_read on public.inventory_movements;
create policy movements_staff_read on public.inventory_movements for select using (public.is_ops());
drop policy if exists movements_staff_insert on public.inventory_movements;
create policy movements_staff_insert on public.inventory_movements for insert with check (public.is_ops());
drop policy if exists orders_staff_all on public.orders;
create policy orders_staff_all on public.orders for all using (public.is_ops()) with check (public.is_ops());
drop policy if exists order_items_staff_all on public.order_items;
create policy order_items_staff_all on public.order_items for all using (public.is_ops()) with check (public.is_ops());
drop policy if exists customers_staff_read on public.customers;
create policy customers_staff_read on public.customers for select using (public.is_ops());
drop policy if exists addresses_staff_read on public.addresses;
create policy addresses_staff_read on public.addresses for select using (public.is_ops());
drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events for select using (status = 'published' or public.is_ops());
drop policy if exists events_staff_write on public.events;
create policy events_staff_write on public.events for all using (public.is_ops()) with check (public.is_ops());
drop policy if exists registrations_staff_read on public.event_registrations;
create policy registrations_staff_read on public.event_registrations for select using (public.is_ops());
drop policy if exists registrations_staff_delete on public.event_registrations;
create policy registrations_staff_delete on public.event_registrations for delete using (public.is_ops());

-- settings: writers may read and change only the automation row
drop policy if exists settings_staff_read on public.settings;
create policy settings_staff_read on public.settings for select using (public.is_ops() or (public.is_staff() and key = 'automation'));
drop policy if exists settings_manage on public.settings;
create policy settings_manage on public.settings for all
  using (public.staff_role() in ('owner','manager') or (public.staff_role() = 'writer' and key = 'automation'))
  with check (public.staff_role() in ('owner','manager') or (public.staff_role() = 'writer' and key = 'automation'));

-- notifications: writers see content ones only
drop policy if exists notifications_staff_read on public.notifications;
create policy notifications_staff_read on public.notifications for select
  using (public.is_ops() or (public.is_staff() and kind in ('post_review','system')));

-- ops-only functions
revoke execute on function public.analytics_summary(integer) from authenticated;
create or replace function public.cancel_order(p_order_id uuid, p_reason text default '') returns void
language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  if not public.is_ops() then raise exception 'not allowed for this role'; end if;
  select status into v_status from public.orders where id = p_order_id for update;
  if v_status is null then raise exception 'no such order'; end if;
  if v_status in ('cancelled','refunded','delivered') then raise exception 'order cannot be cancelled from status %', v_status; end if;
  insert into public.inventory_movements (product_id, delta, reason, order_id, note, created_by)
  select product_id, qty, 'returned', p_order_id, coalesce(p_reason,''), auth.uid()
  from public.order_items where order_id = p_order_id and product_id is not null;
  update public.orders set status = 'cancelled', staff_note = concat_ws(E'\n', nullif(staff_note,''), p_reason) where id = p_order_id;
end $$;
grant execute on function public.analytics_summary(integer) to authenticated;
-- analytics itself checks the role
create or replace function public.analytics_allowed() returns boolean language sql stable security definer set search_path = public as $$ select public.is_ops() $$;
grant execute on function public.analytics_allowed() to authenticated;

-- 3. starter products (only if the catalogue is still empty)
insert into public.product_categories (slug, name, sort) values ('grain','Grains and legumes',0),('processed','Processed',1),('fresh','Fresh produce',2),('inputs','Farm inputs',3)
on conflict (slug) do nothing;
with c as (select slug, id from public.product_categories)
insert into public.products (slug, name, category_id, summary, description, unit, price_kobo, active, featured, sort)
select v.slug, v.name, c.id, v.summary, v.description, v.unit, v.price_kobo, true, v.featured, v.sort
from (values
  ('yellow-maize','Yellow maize','grain','Dried, cleaned and graded. Moisture held at 13% or below, so it stores without spoiling.','Stores well and mills without clogging. Sold by the 50 kg bag.','50 kg bag',4500000,true,0),
  ('soybeans','Soybeans','grain','Cleaned and sorted. Suited to feed mills and oil pressing.','A sample is sent before any bulk order is confirmed.','50 kg bag',6200000,true,1),
  ('parboiled-rice','Parboiled rice','processed','Long grain, destoned and polished, packed on the line rather than repacked later.','Own-label bags available on request.','25 kg bag',3900000,true,2),
  ('cassava-flour','Cassava flour','processed','Fine, white and dry. Milled from fresh roots within a day of harvest.','For fufu, baking blends and industrial use.','25 kg bag',1800000,false,3),
  ('red-palm-oil','Red palm oil','processed','Pressed from fresh fruit, settled and filtered. No water added.','Sealed kegs; also available in 5 L.','25 L keg',5500000,true,4),
  ('dried-chilli','Dried chilli pepper','fresh','Sun-dried and stemmed. Bright colour, strong heat.','Sorted by size before bagging.','10 kg bag',2400000,false,5),
  ('improved-maize-seed','Improved maize seed','inputs','Certified open-pollinated variety, treated and bagged for the coming season.','Germination tested. Plant within the season on the bag.','10 kg bag',2900000,false,6)
) as v(slug,name,cat,summary,description,unit,price_kobo,featured,sort)
join c on c.slug = v.cat
where not exists (select 1 from public.products where slug = v.slug);
-- 50 units of each starter product that has no stock yet
insert into public.inventory_movements (product_id, delta, reason, note)
select p.id, 50, 'received', 'opening stock'
from public.products p join public.inventory i on i.product_id = p.id
where p.slug in ('yellow-maize','soybeans','parboiled-rice','cassava-flour','red-palm-oil','dried-chilli','improved-maize-seed') and i.on_hand = 0
  and not exists (select 1 from public.inventory_movements m where m.product_id = p.id);
select p.slug, i.on_hand, p.active from public.products p join public.inventory i on i.product_id = p.id order by p.sort;
