-- ============================================================================
-- VIVERST · assistant conversations
-- Run after 011. Each staff member's chats, saved so they follow them across
-- devices. Only the owner of a chat can see it. Safe to re-run.
-- ============================================================================
create table if not exists public.assistant_chats (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null,
  title      text not null default 'New chat',
  messages   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assistant_chats_staff_idx on public.assistant_chats (staff_id, updated_at desc);
drop trigger if exists assistant_chats_updated_at on public.assistant_chats;
create trigger assistant_chats_updated_at before update on public.assistant_chats for each row execute function public.set_updated_at();
alter table public.assistant_chats enable row level security;
drop policy if exists assistant_chats_own on public.assistant_chats;
create policy assistant_chats_own on public.assistant_chats for all
  using (staff_id = auth.uid() and public.is_staff()) with check (staff_id = auth.uid() and public.is_staff());
