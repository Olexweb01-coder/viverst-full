-- ============================================================================
-- VIVERST · import the events and posts that lived in viverst.com's code
-- Run after 013. Generated from apps/main/src/content/*.js. Each row is
-- inserted only if its slug is not already in the admin, so it is safe to
-- re-run and it never overwrites edits made in the admin.
-- ============================================================================
insert into public.events (site, slug, title, summary, body, location, city, starts_at, ends_at, cover, registration, capacity, kind, mode, whatsapp_url, status)
select 'agro', 'reimagining-agriculture-digital-economy', 'Reimagining Agriculture in the Digital Economy', 'A live session on how farmers, processors and traders can use digital tools to reach buyers, get paid and keep better records.', 'Viverst Agro is hosting a live conversation on what the digital economy means for agriculture in Nigeria: selling to buyers you have never met, getting paid on time, and keeping records that banks and partners will trust.

## Who you will hear from

- Host: David Ogunsola, agripreneur
- Speaker: Barnabas Omoniwa (SirBarna), agriculture and blockchain researcher

## How to join

- Register on this page with your name, phone number and email
- Join the WhatsApp group straight after. The Zoho link and reminders are shared there
- Saturday 24 October 2026, 6:00 PM WAT', 'Online, live on Zoho', '', '2026-10-24T18:00:00+01:00', null, null, true, null, 'webinar', 'online', 'https://chat.whatsapp.com/CWD4naGsRZDBNqntPkYmZ7', 'published'
where not exists (select 1 from public.events where slug = 'reimagining-agriculture-digital-economy');

insert into public.posts (slug, title, excerpt, body, arm, cover, tags, status, author_kind, published_at)
select 'why-we-put-our-name-on-every-company', 'Why we put our name on every company', 'A branded house is a constraint, not a logo decision.', 'Every company we build carries the parent name. Viverst Agro. Viverst Studio. That is a branded house, and it is a harder choice than it looks.

## The constraint

A holding company with unrelated brand names can quietly absorb a failure. One that shares its name cannot. If a subsidiary underdelivers, the parent wears it.

- One standard of governance, not two
- Shared reputation, shared consequence
- No hiding a weak business behind a different name

> Our reputation is defined not only by the businesses we own, but by the legacy we create through ethical leadership.

We chose it because it forces the discipline we want anyway.', 'global', null, array['brand architecture', 'strategy']::text[], 'published', 'staff', '2026-08-18'::timestamptz
where not exists (select 1 from public.posts where slug = 'why-we-put-our-name-on-every-company');

insert into public.posts (slug, title, excerpt, body, arm, cover, tags, status, author_kind, published_at)
select 'what-a-parent-company-actually-supplies', 'What a parent company actually supplies', 'Vision, governance, resources, leadership. In that order.', 'A parent that only holds equity is a shareholder. A parent that supplies something is an operator of a different kind.

## Four things

- Vision — one direction, measured across every company
- Governance — oversight the name demands
- Resources — talent, systems and capital, shared
- Leadership — long-term calls made once, at group level

Anything beyond that belongs to the subsidiary. The parent sets the standard; the company decides how to meet it in its own market.', 'global', null, array['governance', 'operating model']::text[], 'published', 'staff', '2026-08-02'::timestamptz
where not exists (select 1 from public.posts where slug = 'what-a-parent-company-actually-supplies');

insert into public.posts (slug, title, excerpt, body, arm, cover, tags, status, author_kind, published_at)
select 'agri-tech-distribution-problem', 'Agri-tech has a distribution problem', 'The technology mostly works. Getting it to the field does not.', 'Most agricultural technology fails at the last twenty kilometres, not in the lab.

## Where it breaks

- Tools designed for connectivity that is not there
- Training that assumes a literacy level that varies
- Service models with no route to a rural cooperative

We build for the field first and the dashboard second. That ordering changes what gets built.', 'agro', null, array['agri-tech', 'food systems']::text[], 'published', 'staff', '2026-07-21'::timestamptz
where not exists (select 1 from public.posts where slug = 'agri-tech-distribution-problem');

insert into public.posts (slug, title, excerpt, body, arm, cover, tags, status, author_kind, published_at)
select 'brand-systems-that-survive-a-printer', 'Brand systems that survive a printer', 'A palette that only works on a screen is half a system.', 'A brand system is tested the first time it leaves the screen. Fluorescents shift. Thin weights close up. Gradients band.

## What we check before sign-off

- Every colour has a coated and uncoated equivalent
- The mark reads at 12mm and at three metres
- The type holds at the smallest legal size on a label

A system that has not been printed has not been finished.', 'studio', null, array['branding', 'print']::text[], 'published', 'staff', '2026-07-04'::timestamptz
where not exists (select 1 from public.posts where slug = 'brand-systems-that-survive-a-printer');

insert into public.posts (slug, title, excerpt, body, arm, cover, tags, status, author_kind, published_at)
select 'packaging-quiet-lever-agro-processing', 'Packaging is the quietest lever in agro processing', 'Shelf life, freight cost and trust, all decided upstream.', 'Packaging is usually the last decision and one of the most expensive to get wrong.

- It sets shelf life before distribution begins
- It determines pallet economics and freight cost
- It is the first quality signal a buyer receives

Decided early, it pays for itself. Decided late, it caps the margin of everything upstream.', 'agro', null, array['packaging', 'processing']::text[], 'published', 'staff', '2026-06-15'::timestamptz
where not exists (select 1 from public.posts where slug = 'packaging-quiet-lever-agro-processing');

insert into public.posts (slug, title, excerpt, body, arm, cover, tags, status, author_kind, published_at)
select 'building-long-term-in-a-short-term-market', 'Building long-term in a short-term market', 'Patience is a strategy, provided the balance sheet agrees.', 'Long-term thinking is easy to claim and expensive to practise. It requires the ability to decline good short-term revenue.

> We make long-term decisions that create value for customers, employees, partners, investors and the communities we serve.

A diversified portfolio makes that possible: one company can invest through a slow year because another is carrying the group.', 'global', null, array['investment', 'strategy']::text[], 'published', 'staff', '2026-05-28'::timestamptz
where not exists (select 1 from public.posts where slug = 'building-long-term-in-a-short-term-market');

select 'events' as what, count(*) from public.events union all select 'posts', count(*) from public.posts;

