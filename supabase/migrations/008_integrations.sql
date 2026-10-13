-- ============================================================================
-- VIVERST · integrations settings
-- Run after 007. Records the Google Apps Script that holds event registrations
-- so the admin can show signup counts and link to the sheet. Safe to re-run.
-- ============================================================================
insert into public.settings (key, value) values
  ('integrations', '{"registrations_script_url":"https://script.google.com/macros/s/AKfycbzGt6RX1Kx1MJvQB6YdkLzraO75KxbAzaBF3qVnbymZa0Ugjn5_kC6Noj1iQugdw4U/exec"}')
on conflict (key) do nothing;
select key, value->>'registrations_script_url' as script from public.settings where key = 'integrations';
