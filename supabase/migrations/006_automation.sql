-- ============================================================================
-- VIVERST · blog automation
-- Run after 005. A topics queue the AI works through, a settings row for the
-- schedule, a log of every run, and a function the scheduler calls to decide
-- whether a post is due. Safe to re-run.
-- ============================================================================

create table if not exists public.ai_topics (
  id          bigint generated always as identity primary key,
  topic       text not null,
  arm         text not null default 'global' check (arm in ('global','agro','studio')),
  status      text not null default 'queued' check (status in ('queued','drafting','done','failed')),
  post_id     uuid references public.posts(id) on delete set null,
  error       text,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  used_at     timestamptz
);
create index if not exists ai_topics_status_idx on public.ai_topics (status, created_at);

create table if not exists public.ai_runs (
  id          bigint generated always as identity primary key,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  trigger     text not null default 'schedule' check (trigger in ('schedule','manual')),
  topic_id    bigint references public.ai_topics(id) on delete set null,
  post_id     uuid references public.posts(id) on delete set null,
  provider    text,
  ok          boolean,
  detail      text
);

alter table public.ai_topics enable row level security;
alter table public.ai_runs   enable row level security;
drop policy if exists ai_topics_staff on public.ai_topics;
create policy ai_topics_staff on public.ai_topics for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists ai_runs_staff_read on public.ai_runs;
create policy ai_runs_staff_read on public.ai_runs for select using (public.is_staff());

-- default automation settings
insert into public.settings (key, value) values
  ('automation', '{"enabled":false,"per_week":3,"arms":["global","agro","studio"],"days":[1,3,5],"hour":9,"review_hours":24,"self_find":true}')
on conflict (key) do nothing;

-- the scheduler asks this every hour; it answers yes at most once per chosen day
create or replace function public.ai_post_due() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare s jsonb; v_hour int; v_days jsonb; v_today int;
begin
  select value into s from public.settings where key = 'automation';
  if s is null or not coalesce((s->>'enabled')::boolean, false) then return false; end if;
  v_hour := coalesce((s->>'hour')::int, 9);
  v_days := coalesce(s->'days', '[1,3,5]'::jsonb);
  v_today := extract(isodow from (now() at time zone 'Africa/Lagos'))::int;
  if not (v_days ? v_today::text) then return false; end if;
  if extract(hour from (now() at time zone 'Africa/Lagos'))::int <> v_hour then return false; end if;
  -- already ran today?
  if exists (select 1 from public.ai_runs where trigger = 'schedule'
             and (started_at at time zone 'Africa/Lagos')::date = (now() at time zone 'Africa/Lagos')::date) then return false; end if;
  return true;
end $$;
revoke execute on function public.ai_post_due() from public, anon;
grant execute on function public.ai_post_due() to authenticated, service_role;

-- which provider keys are present (names only, never values)
create or replace function public.ai_keys_present() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_staff() then (
    select coalesce(jsonb_object_agg(k, exists (select 1 from public.secrets where key = k and value <> '')), '{}'::jsonb)
    from unnest(array['groq_api_key','cerebras_api_key','gemini_api_key','tavily_api_key']) k
  ) else '{}'::jsonb end
$$;
revoke execute on function public.ai_keys_present() from public, anon;
grant execute on function public.ai_keys_present() to authenticated;
