-- My-transports Supabase schema
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  game_state jsonb,
  cards jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  telegram_chat_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.telegram_link_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_state enable row level security;
alter table public.profiles enable row level security;
alter table public.telegram_link_codes enable row level security;

drop policy if exists "user_state_select_own" on public.user_state;
drop policy if exists "user_state_insert_own" on public.user_state;
drop policy if exists "user_state_update_own" on public.user_state;
create policy "user_state_select_own" on public.user_state for select using (auth.uid()=user_id);
create policy "user_state_insert_own" on public.user_state for insert with check (auth.uid()=user_id);
create policy "user_state_update_own" on public.user_state for update using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid()=id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid()=id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);

create index if not exists telegram_link_codes_user_idx on public.telegram_link_codes(user_id);
create index if not exists telegram_link_codes_expires_idx on public.telegram_link_codes(expires_at);
