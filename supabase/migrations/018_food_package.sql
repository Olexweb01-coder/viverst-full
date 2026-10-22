-- ============================================================================
-- VIVERST · food package
-- Run after 017, in Supabase → SQL Editor. Lets the shop read the food package
-- the admin edits (Food package in the admin menu): its title, image,
-- packages, prices and switches. The settings row is staff-written as before
-- (owners and managers); this only adds it to the short list the public shop
-- may read, and stores the December Food Package as the starting content.
-- Safe to re-run: the view is replaced in place, and the starting content is
-- only written if there is no food package yet, so edits are never undone.
-- ============================================================================

create or replace view public.public_settings as
  select key, value from public.settings
  where key in ('payments','delivery','shop','contact','food_package');

grant select on public.public_settings to anon, authenticated;

insert into public.settings (key, value) values
  ('food_package', '{
    "title": "December Food Package",
    "short": "DFP",
    "intro": "Rice, a live chicken, groundnut oil and eggs, packed together for the festive season. Choose your package and book it on WhatsApp.",
    "season_note": "This offer is for December. Food packages are still available after December, so message us for the current packages.",
    "instalment": true,
    "instalment_note": "Instalment payment available. Ask us how when you book.",
    "image": "",
    "image_alt": "December Food Package from Viverst Agro: a bag of Viverst Agro rice, groundnut oil and a live chicken, with a smiling man in a Santa hat holding a DFP box.",
    "home_card": true,
    "checkout": false,
    "packages": [
      { "name": "Merry Package", "price_kobo": 4999900, "product_slug": "",
        "items": ["10 kg of rice", "1 live chicken", "Groundnut oil (1 L)", "Half crate of eggs"] },
      { "name": "Jolly Package", "price_kobo": 7499900, "product_slug": "",
        "items": ["Half bag of rice (25 kg)", "1 live chicken", "Groundnut oil (2 L)", "1 crate of eggs"] },
      { "name": "Berekete Package", "price_kobo": 12499900, "product_slug": "",
        "items": ["Full bag of rice (50 kg)", "1 live chicken", "Groundnut oil (5 L)", "1 crate of eggs"] }
    ]
  }'::jsonb)
on conflict (key) do nothing;

-- check: should list food_package among the shop's public settings
select key from public.public_settings order by key;
