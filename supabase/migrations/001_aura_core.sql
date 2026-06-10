-- Aura core schema: a user-scoped key/value store backing all synced dashboard
-- data (todos, notes, reminders, events, assistant state, preferences).
-- Collections map 1:1 to the app's REST collections; whole lists are stored as
-- a single jsonb row (key '__list__'), matching the replace-wholesale API.

create extension if not exists pgcrypto;

create table if not exists aura_kv (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, collection, key)
);

create index if not exists aura_kv_user_collection_idx on aura_kv (user_id, collection);

-- Keep updated_at fresh on every write.
create or replace function aura_kv_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists aura_kv_touch_updated_at on aura_kv;
create trigger aura_kv_touch_updated_at
  before update on aura_kv
  for each row
  execute function aura_kv_touch_updated_at();

-- Row Level Security: users can only ever touch their own rows. The Aura
-- backend uses the service-role key (which bypasses RLS) but always filters by
-- user_id derived from a verified JWT; these policies protect against any
-- direct client access with the anon key.
alter table aura_kv enable row level security;

drop policy if exists "aura_kv_select_own" on aura_kv;
create policy "aura_kv_select_own" on aura_kv
  for select using (auth.uid() = user_id);

drop policy if exists "aura_kv_insert_own" on aura_kv;
create policy "aura_kv_insert_own" on aura_kv
  for insert with check (auth.uid() = user_id);

drop policy if exists "aura_kv_update_own" on aura_kv;
create policy "aura_kv_update_own" on aura_kv
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "aura_kv_delete_own" on aura_kv;
create policy "aura_kv_delete_own" on aura_kv
  for delete using (auth.uid() = user_id);
