-- ============================================================================
-- VIVERST · notifications
-- Run after 008. One shared stream for staff: new order, post in review,
-- stock low/out, event registration. Each person tracks their own read state.
-- Email delivery is handled by the notify-email function on a schedule, only
-- once a Resend key exists. Safe to re-run.
-- ============================================================================

create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('order','post_review','stock_low','stock_out','registration','system')),
  title       text not null,
  body        text not null default '',
  link        text,
  emailed_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_created_idx on public.notifications (created_at desc);

create table if not exists public.notification_reads (
  notification_id bigint not null references public.notifications(id) on delete cascade,
  staff_id        uuid not null,
  read_at         timestamptz not null default now(),
  primary key (notification_id, staff_id)
);

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
drop policy if exists notifications_staff_read on public.notifications;
create policy notifications_staff_read on public.notifications for select using (public.is_staff());
drop policy if exists notification_reads_own on public.notification_reads;
create policy notification_reads_own on public.notification_reads for all
  using (staff_id = auth.uid() and public.is_staff()) with check (staff_id = auth.uid() and public.is_staff());

-- helper used by triggers
create or replace function public.notify(p_kind text, p_title text, p_body text, p_link text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (kind, title, body, link) values (p_kind, p_title, p_body, p_link)
$$;
revoke execute on function public.notify(text, text, text, text) from public, anon, authenticated;

-- new order
create or replace function public.trg_notify_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify('order', 'New order ' || new.number,
    new.name || ' · ₦' || to_char(new.total_kobo / 100.0, 'FM999,999,990') || ' · ' || case when new.payment_method = 'paystack' then 'card' else 'bank transfer' end,
    '/orders?open=' || new.id);
  return new;
end $$;
drop trigger if exists orders_notify on public.orders;
create trigger orders_notify after insert on public.orders for each row execute function public.trg_notify_order();

-- post enters review
create or replace function public.trg_notify_post_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'review' and (tg_op = 'INSERT' or old.status is distinct from 'review') then
    perform public.notify('post_review', 'Post waiting for review: ' || new.title,
      case when new.author_kind = 'ai' then 'Drafted by the AI. ' else '' end || 'Publishes itself ' || to_char(new.review_until at time zone 'Africa/Lagos', 'DD Mon HH24:MI') || ' unless someone leaves a note.',
      '/posts/' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists posts_notify_review on public.posts;
create trigger posts_notify_review after insert or update of status on public.posts for each row execute function public.trg_notify_post_review();

-- stock crosses the alert line, or hits zero
create or replace function public.trg_notify_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if new.on_hand < old.on_hand then
    select name into v_name from public.products where id = new.product_id;
    if new.on_hand = 0 and old.on_hand > 0 then
      perform public.notify('stock_out', 'Out of stock: ' || v_name, 'Nothing left to sell. Receive stock or hide the product.', '/inventory');
    elsif new.on_hand <= new.low_stock_at and old.on_hand > new.low_stock_at then
      perform public.notify('stock_low', 'Running low: ' || v_name, new.on_hand || ' left (alert at ' || new.low_stock_at || ').', '/inventory');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists inventory_notify on public.inventory;
create trigger inventory_notify after update of on_hand on public.inventory for each row execute function public.trg_notify_stock();

-- someone registers through the admin's own table (sheet signups are counted separately)
create or replace function public.trg_notify_registration() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_title text; v_id uuid;
begin
  select title, id into v_title, v_id from public.events where id = new.event_id;
  perform public.notify('registration', 'New registration: ' || v_title, new.name || ' · ' || new.email, '/events/' || v_id);
  return new;
end $$;
drop trigger if exists registrations_notify on public.event_registrations;
create trigger registrations_notify after insert on public.event_registrations for each row execute function public.trg_notify_registration();

-- what the rail asks every minute
create or replace function public.notification_counts() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_staff() then jsonb_build_object(
    'unread', (select count(*) from public.notifications n where created_at > now() - interval '30 days'
               and not exists (select 1 from public.notification_reads r where r.notification_id = n.id and r.staff_id = auth.uid()))
  ) else '{}'::jsonb end
$$;
revoke execute on function public.notification_counts() from public, anon;
grant execute on function public.notification_counts() to authenticated;

create or replace function public.mark_all_read() returns void
language sql security definer set search_path = public as $$
  insert into public.notification_reads (notification_id, staff_id)
  select id, auth.uid() from public.notifications where public.is_staff()
  on conflict do nothing
$$;
revoke execute on function public.mark_all_read() from public, anon;
grant execute on function public.mark_all_read() to authenticated;

-- email settings default (digest to the contact email, when a Resend key exists)
insert into public.settings (key, value) values ('notifications', '{"email_enabled":true,"email_to":"","from":"Viverst Admin <admin@viverst.com>"}')
on conflict (key) do nothing;
