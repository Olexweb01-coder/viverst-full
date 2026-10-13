-- ============================================================================
-- VIVERST · content storage + review helpers
-- Run after 004. Adds the bucket for blog/event images and a couple of
-- functions the content screens use. Safe to re-run.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-images', 'content-images', true, 4194304, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 4194304,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "content images are public" on storage.objects;
create policy "content images are public" on storage.objects for select using (bucket_id = 'content-images');
drop policy if exists "staff upload content images" on storage.objects;
create policy "staff upload content images" on storage.objects for insert with check (bucket_id = 'content-images' and public.is_staff());
drop policy if exists "staff update content images" on storage.objects;
create policy "staff update content images" on storage.objects for update using (bucket_id = 'content-images' and public.is_staff());
drop policy if exists "staff delete content images" on storage.objects;
create policy "staff delete content images" on storage.objects for delete using (bucket_id = 'content-images' and public.is_staff());

-- send a post to review: opens the 24-hour window and clears any hold
create or replace function public.send_post_to_review(p_post_id uuid, p_hours integer default 24) returns public.posts
language plpgsql security definer set search_path = public as $$
declare v public.posts;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  update public.posts set status = 'review', review_until = now() + make_interval(hours => greatest(p_hours, 1)), held = false
   where id = p_post_id returning * into v;
  if v.id is null then raise exception 'no such post'; end if;
  return v;
end $$;
revoke execute on function public.send_post_to_review(uuid, integer) from public, anon;
grant execute on function public.send_post_to_review(uuid, integer) to authenticated;

-- counts for the content screens and the rail badge
create or replace function public.content_counts() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_staff() then jsonb_build_object(
    'posts_in_review', (select count(*) from public.posts where status = 'review'),
    'posts_held',      (select count(*) from public.posts where status = 'review' and held),
    'events_upcoming', (select count(*) from public.events where status = 'published' and starts_at >= now()),
    'registrations_7d',(select count(*) from public.event_registrations where created_at >= now() - interval '7 days')
  ) else '{}'::jsonb end
$$;
revoke execute on function public.content_counts() from public, anon;
grant execute on function public.content_counts() to authenticated;

select id, public from storage.buckets where id = 'content-images';
