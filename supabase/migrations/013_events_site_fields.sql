-- ============================================================================
-- VIVERST · event fields the public site shows
-- Run after 012. Adds the type, mode, city and WhatsApp group fields the
-- viverst.com Events pages use, and tells PostgREST to allow the sites'
-- origins. Safe to re-run.
-- ============================================================================
alter table public.events add column if not exists kind text not null default 'webinar'
  check (kind in ('webinar','field-day','workshop','briefing','masterclass'));
alter table public.events add column if not exists mode text not null default 'online'
  check (mode in ('online','in-person','hybrid'));
alter table public.events add column if not exists city text not null default '';
alter table public.events add column if not exists whatsapp_url text;

-- a published post or event is public; make sure the public view of posts
-- includes what the site renders and nothing else
create or replace view public.site_posts as
  select slug, title, excerpt, body, arm, cover, tags, published_at, updated_at
  from public.posts where status = 'published';
create or replace view public.site_events as
  select slug, site, title, summary, body, location, city, starts_at, ends_at, cover, registration, capacity, kind, mode, whatsapp_url
  from public.events where status = 'published';
grant select on public.site_posts, public.site_events to anon, authenticated;
