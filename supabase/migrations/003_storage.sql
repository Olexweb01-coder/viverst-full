-- ============================================================================
-- VIVERST · product image storage
-- Run after 001 and 002, in Supabase → SQL Editor. Creates the public bucket
-- the admin uploads product photos into. Anyone can view images (the shop
-- needs that); only staff can add, replace or delete them. Safe to re-run.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 4194304, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 4194304,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "product images are public" on storage.objects;
create policy "product images are public" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "staff upload product images" on storage.objects;
create policy "staff upload product images" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "staff update product images" on storage.objects;
create policy "staff update product images" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "staff delete product images" on storage.objects;
create policy "staff delete product images" on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_staff());

select id, public, file_size_limit from storage.buckets where id = 'product-images';
