-- ============================================================================
-- VIVERST · staff management helpers
-- Run after 003. Lets the owner add a staff member from the admin by email.
-- The person must already have signed in once (or been created under
-- Authentication → Users), because only then does an auth user exist to link.
-- ============================================================================

create or replace function public.add_staff(p_email text, p_name text, p_role text) returns public.staff
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_row public.staff;
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  if p_role not in ('owner','manager','editor') then raise exception 'role must be owner, manager or editor'; end if;
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
revoke execute on function public.add_staff(text, text, text) from public, anon;
grant execute on function public.add_staff(text, text, text) to authenticated;

-- an owner may not remove or demote the last active owner
create or replace function public.guard_last_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE' or new.role <> 'owner' or not new.active)
     and old.role = 'owner' and old.active
     and (select count(*) from public.staff where role = 'owner' and active and user_id <> old.user_id) = 0 then
    raise exception 'There must always be at least one active owner.';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists staff_guard_last_owner on public.staff;
create trigger staff_guard_last_owner before update or delete on public.staff
  for each row execute function public.guard_last_owner();

-- staff can read the order history they need in one call
create or replace view public.order_detail as
  select o.*, coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'product_id', i.product_id, 'name', i.name, 'unit', i.unit,
      'unit_price_kobo', i.unit_price_kobo, 'qty', i.qty, 'line_kobo', i.line_kobo) order by i.id)
      filter (where i.id is not null), '[]'::jsonb) as items
  from public.orders o left join public.order_items i on i.order_id = o.id
  group by o.id;
alter view public.order_detail set (security_invoker = true);
grant select on public.order_detail to authenticated;
