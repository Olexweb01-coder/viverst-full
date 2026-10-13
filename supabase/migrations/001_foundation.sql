-- ============================================================================
-- VIVERST · foundation schema
-- Run once in Supabase → SQL Editor. Safe to re-run (everything is "if not exists"
-- or "create or replace"). Covers: staff, settings & secrets, products, inventory,
-- customers, orders, events, posts, review notes, heartbeat. Every table has
-- row-level security with explicit policies.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------------------
-- staff: who may use the admin. Rows are created by the owner; a person must
-- also exist in auth.users (they sign up / are invited) for the id to resolve.
-- ---------------------------------------------------------------------------
create table if not exists public.staff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null default '',
  role       text not null default 'editor' check (role in ('owner','manager','editor')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active)
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active and role = 'owner')
$$;

create or replace function public.staff_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid() and active
$$;

-- ---------------------------------------------------------------------------
-- settings: non-secret configuration the admin edits (bank details for
-- transfer payments, delivery fees, feature switches...). Staff read; owner
-- and manager write.
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- A few settings the shop reads publicly (bank details for transfer, delivery
-- fee). Everything else stays staff-only. Public reads go through this view.
create or replace view public.public_settings as
  select key, value from public.settings
  where key in ('payments','delivery','shop','contact');

-- ---------------------------------------------------------------------------
-- secrets: API keys entered through the admin (Paystack secret, provider keys).
-- NO row-level policies on purpose: with RLS on and no policies, anon and
-- authenticated users can never read or write this table. Only the service
-- role (used by Edge Functions) can read it. Owners write through set_secret().
-- ---------------------------------------------------------------------------
create table if not exists public.secrets (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table public.secrets enable row level security;

create or replace function public.set_secret(p_key text, p_value text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  insert into public.secrets (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

create or replace function public.has_secret(p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() and exists (select 1 from public.secrets where key = p_key and value <> '')
$$;

-- ---------------------------------------------------------------------------
-- product categories & products
-- ---------------------------------------------------------------------------
create table if not exists public.product_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  sort       integer not null default 0
);

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  category_id      uuid references public.product_categories(id) on delete set null,
  summary          text not null default '',        -- one line under the name
  description      text not null default '',        -- longer, markdown allowed
  unit             text not null default '',        -- e.g. "50 kg bag", "5 L"
  price_kobo       bigint not null check (price_kobo >= 0),
  compare_at_kobo  bigint check (compare_at_kobo is null or compare_at_kobo >= 0),
  images           text[] not null default '{}',    -- storage paths or URLs
  active           boolean not null default false,  -- shown in the shop
  featured         boolean not null default false,
  sort             integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists products_active_idx on public.products (active, sort);
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- inventory: one row per product. Never edited directly; every change goes
-- through inventory_movements so there is always a reason on record.
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  product_id    uuid primary key references public.products(id) on delete cascade,
  on_hand       integer not null default 0 check (on_hand >= 0),
  low_stock_at  integer not null default 5,
  updated_at    timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products(id) on delete cascade,
  delta       integer not null check (delta <> 0),
  reason      text not null check (reason in ('received','sold','returned','damaged','adjustment','correction')),
  order_id    uuid,
  note        text not null default '',
  created_by  uuid,
  created_at  timestamptz not null default now()
);
create index if not exists inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);

-- a new product always gets an inventory row
create or replace function public.ensure_inventory_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.inventory (product_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists products_ensure_inventory on public.products;
create trigger products_ensure_inventory after insert on public.products
  for each row execute function public.ensure_inventory_row();

-- a movement applies itself to on_hand; the check constraint stops oversell
create or replace function public.apply_inventory_movement() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.inventory (product_id, on_hand) values (new.product_id, 0) on conflict do nothing;
  update public.inventory set on_hand = on_hand + new.delta, updated_at = now()
    where product_id = new.product_id;
  return new;
end $$;
drop trigger if exists inventory_movements_apply on public.inventory_movements;
create trigger inventory_movements_apply after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

-- what the shop is allowed to see: stock as a yes/no plus a capped number
create or replace view public.stock as
  select i.product_id, i.on_hand > 0 as in_stock, least(i.on_hand, 99) as available
  from public.inventory i join public.products p on p.id = i.product_id
  where p.active;

-- ---------------------------------------------------------------------------
-- customers: one row per auth user who buys. Created automatically on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text not null default '',
  phone      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.customers (user_id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(user_id) on delete cascade,
  label       text not null default 'Home',
  name        text not null default '',
  phone       text not null default '',
  line1       text not null,
  line2       text not null default '',
  city        text not null,
  state       text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_customer_idx on public.addresses (customer_id);

-- ---------------------------------------------------------------------------
-- orders. Guests may order (customer_id null) with just an email and phone.
-- Prices are snapshotted into order_items so later price changes never alter
-- past orders. The only way the shop creates an order is place_order() below.
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  number           text not null unique default ('VA-' || nextval('public.order_number_seq')::text),
  customer_id      uuid references public.customers(user_id) on delete set null,
  email            text not null,
  phone            text not null,
  name             text not null,
  status           text not null default 'awaiting_payment'
                   check (status in ('awaiting_payment','paid','packed','shipped','delivered','cancelled','refunded')),
  payment_method   text not null check (payment_method in ('transfer','paystack')),
  payment_ref      text,                             -- Paystack reference, or transfer note
  paid_at          timestamptz,
  subtotal_kobo    bigint not null check (subtotal_kobo >= 0),
  delivery_kobo    bigint not null default 0 check (delivery_kobo >= 0),
  total_kobo       bigint not null check (total_kobo >= 0),
  delivery_address jsonb not null,                   -- {name, phone, line1, line2, city, state}
  customer_note    text not null default '',
  staff_note       text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id              bigint generated always as identity primary key,
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  name            text not null,
  unit            text not null default '',
  unit_price_kobo bigint not null check (unit_price_kobo >= 0),
  qty             integer not null check (qty > 0),
  line_kobo       bigint not null check (line_kobo >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- place_order: validates every line against the live catalogue, reserves stock
-- (as 'sold' movements), computes totals server-side and creates the order.
-- The browser never sends a price. Returns the new order's id and number.
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

  -- delivery fee from settings (flat fee by default; 0 if unset)
  select coalesce((value->>'flat_fee_kobo')::bigint, 0) into v_delivery
    from public.settings where key = 'delivery';
  v_delivery := coalesce(v_delivery, 0);

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

-- cancelling an order puts the stock back (staff only, from the admin)
create or replace function public.cancel_order(p_order_id uuid, p_reason text default '') returns void
language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  select status into v_status from public.orders where id = p_order_id for update;
  if v_status is null then raise exception 'no such order'; end if;
  if v_status in ('cancelled','refunded','delivered') then raise exception 'order cannot be cancelled from status %', v_status; end if;
  insert into public.inventory_movements (product_id, delta, reason, order_id, note, created_by)
  select product_id, qty, 'returned', p_order_id, coalesce(p_reason,''), auth.uid()
  from public.order_items where order_id = p_order_id and product_id is not null;
  update public.orders set status = 'cancelled', staff_note = concat_ws(E'\n', nullif(staff_note,''), p_reason) where id = p_order_id;
end $$;

-- ---------------------------------------------------------------------------
-- events: per site. Registration rows come in from the public page.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  site             text not null check (site in ('main','agro','studio')),
  slug             text not null,
  title            text not null,
  summary          text not null default '',
  body             text not null default '',
  location         text not null default '',
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  cover            text,
  registration     boolean not null default false,
  capacity         integer,
  status           text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (site, slug)
);
drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

create table if not exists public.event_registrations (
  id          bigint generated always as identity primary key,
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text not null default '',
  organisation text not null default '',
  created_at  timestamptz not null default now(),
  unique (event_id, email)
);

-- ---------------------------------------------------------------------------
-- posts: ONE blog, on viverst.com, each post labelled with the arm it comes
-- from. Review flow: draft → review (24h window) → scheduled/published.
-- A review note from staff holds the post; no note in 24h means it goes out.
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text not null default '',
  body          text not null default '',             -- markdown
  arm           text not null default 'global' check (arm in ('global','agro','studio')),
  cover         text,
  tags          text[] not null default '{}',
  status        text not null default 'draft'
                check (status in ('draft','review','scheduled','published','rejected')),
  author_kind   text not null default 'staff' check (author_kind in ('staff','ai')),
  author_id     uuid,                                  -- staff user_id when author_kind = 'staff'
  sources       jsonb not null default '[]'::jsonb,    -- [{title,url}] the AI drew on
  review_until  timestamptz,                           -- auto-publish deadline while in 'review'
  held          boolean not null default false,        -- a review note stops auto-publish
  publish_at    timestamptz,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (status, published_at desc);
create index if not exists posts_arm_idx on public.posts (arm, published_at desc);
drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

create table if not exists public.review_notes (
  id         bigint generated always as identity primary key,
  post_id    uuid not null references public.posts(id) on delete cascade,
  staff_id   uuid not null,
  note       text not null,
  created_at timestamptz not null default now()
);

-- a note on a post in review holds it until a human decides
create or replace function public.hold_post_on_note() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.posts set held = true where id = new.post_id and status = 'review';
  return new;
end $$;
drop trigger if exists review_notes_hold on public.review_notes;
create trigger review_notes_hold after insert on public.review_notes
  for each row execute function public.hold_post_on_note();

-- called hourly by the scheduler: publish anything whose window has lapsed
create or replace function public.publish_due_posts() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with due as (
    update public.posts
       set status = 'published', published_at = now()
     where (status = 'review' and not held and review_until is not null and review_until <= now())
        or (status = 'scheduled' and publish_at is not null and publish_at <= now())
    returning 1)
  select count(*) into n from due;
  return n;
end $$;

-- ---------------------------------------------------------------------------
-- heartbeat: a tiny table the keep-alive job touches so the project is never
-- idle long enough to be paused.
-- ---------------------------------------------------------------------------
create table if not exists public.heartbeat (
  id       integer primary key default 1 check (id = 1),
  beat_at  timestamptz not null default now()
);
insert into public.heartbeat (id) values (1) on conflict do nothing;

create or replace function public.beat() returns timestamptz
language sql security definer set search_path = public as $$
  update public.heartbeat set beat_at = now() where id = 1 returning beat_at
$$;

-- ---------------------------------------------------------------------------
-- row-level security. Pattern: public can read what the sites need, write
-- only through the functions above; staff can do everything; owners manage
-- staff and secrets.
-- ---------------------------------------------------------------------------
alter table public.staff               enable row level security;
alter table public.settings            enable row level security;
alter table public.product_categories  enable row level security;
alter table public.products            enable row level security;
alter table public.inventory           enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customers           enable row level security;
alter table public.addresses           enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.events              enable row level security;
alter table public.event_registrations enable row level security;
alter table public.posts               enable row level security;
alter table public.review_notes        enable row level security;
alter table public.heartbeat           enable row level security;

-- staff
drop policy if exists staff_read_self_or_owner on public.staff;
create policy staff_read_self_or_owner on public.staff for select
  using (user_id = auth.uid() or public.is_owner());
drop policy if exists staff_owner_write on public.staff;
create policy staff_owner_write on public.staff for all
  using (public.is_owner()) with check (public.is_owner());

-- settings: staff read all; owner/manager write
drop policy if exists settings_staff_read on public.settings;
create policy settings_staff_read on public.settings for select using (public.is_staff());
drop policy if exists settings_manage on public.settings;
create policy settings_manage on public.settings for all
  using (public.staff_role() in ('owner','manager')) with check (public.staff_role() in ('owner','manager'));

-- catalogue: everyone reads active products; staff read/write all
drop policy if exists categories_public_read on public.product_categories;
create policy categories_public_read on public.product_categories for select using (true);
drop policy if exists categories_staff_write on public.product_categories;
create policy categories_staff_write on public.product_categories for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (active or public.is_staff());
drop policy if exists products_staff_write on public.products;
create policy products_staff_write on public.products for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists inventory_public_read on public.inventory;
create policy inventory_public_read on public.inventory for select using (true);
drop policy if exists inventory_staff_write on public.inventory;
create policy inventory_staff_write on public.inventory for update
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists movements_staff_read on public.inventory_movements;
create policy movements_staff_read on public.inventory_movements for select using (public.is_staff());
drop policy if exists movements_staff_insert on public.inventory_movements;
create policy movements_staff_insert on public.inventory_movements for insert with check (public.is_staff());

-- customers & addresses: own rows only; staff read all
drop policy if exists customers_own on public.customers;
create policy customers_own on public.customers for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists customers_staff_read on public.customers;
create policy customers_staff_read on public.customers for select using (public.is_staff());

drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses for all
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());
drop policy if exists addresses_staff_read on public.addresses;
create policy addresses_staff_read on public.addresses for select using (public.is_staff());

-- orders: customers see their own; staff see and manage all. No direct insert
-- from clients: place_order() runs as definer and bypasses this.
drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders for select
  using (customer_id is not null and customer_id = auth.uid());
drop policy if exists orders_staff_all on public.orders;
create policy orders_staff_all on public.orders for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists order_items_own_read on public.order_items;
create policy order_items_own_read on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
drop policy if exists order_items_staff_all on public.order_items;
create policy order_items_staff_all on public.order_items for all
  using (public.is_staff()) with check (public.is_staff());

-- events: public reads published; anyone can register; staff manage
drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events for select using (status = 'published' or public.is_staff());
drop policy if exists events_staff_write on public.events;
create policy events_staff_write on public.events for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists registrations_public_insert on public.event_registrations;
create policy registrations_public_insert on public.event_registrations for insert
  with check (exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.registration));
drop policy if exists registrations_staff_read on public.event_registrations;
create policy registrations_staff_read on public.event_registrations for select using (public.is_staff());
drop policy if exists registrations_staff_delete on public.event_registrations;
create policy registrations_staff_delete on public.event_registrations for delete using (public.is_staff());

-- posts: public reads published; staff manage
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select using (status = 'published' or public.is_staff());
drop policy if exists posts_staff_write on public.posts;
create policy posts_staff_write on public.posts for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists review_notes_staff on public.review_notes;
create policy review_notes_staff on public.review_notes for all
  using (public.is_staff()) with check (public.is_staff() and staff_id = auth.uid());

-- heartbeat: readable by anyone (the keep-alive ping reads it)
drop policy if exists heartbeat_public_read on public.heartbeat;
create policy heartbeat_public_read on public.heartbeat for select using (true);

-- ---------------------------------------------------------------------------
-- grants: the Data API roles may call the public functions
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.public_settings, public.stock to anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, jsonb, text, text) to anon, authenticated;
grant execute on function public.beat() to anon, authenticated;
grant execute on function public.is_staff(), public.is_owner(), public.staff_role() to anon, authenticated;
grant execute on function public.has_secret(text), public.set_secret(text, text), public.cancel_order(uuid, text), public.publish_due_posts() to authenticated;
revoke execute on function public.set_secret(text, text), public.cancel_order(uuid, text), public.publish_due_posts(), public.has_secret(text) from public, anon;

revoke execute on function public.set_updated_at(), public.ensure_inventory_row(), public.apply_inventory_movement(), public.handle_new_user(), public.hold_post_on_note() from public, anon, authenticated;

-- starter settings so the shop can render before anyone edits them
insert into public.settings (key, value) values
  ('shop',     '{"name":"Viverst Agro Shop","currency":"NGN"}'),
  ('delivery', '{"flat_fee_kobo":0,"note":"Delivery fee is confirmed when we call to arrange your order."}'),
  ('payments', '{"transfer":{"enabled":true,"bank_name":"","account_name":"","account_number":"","instructions":"Pay the total to the account below and send your order number as the reference."},"paystack":{"enabled":false}}'),
  ('contact',  '{"email":"","phone":"","whatsapp":""}')
on conflict (key) do nothing;
