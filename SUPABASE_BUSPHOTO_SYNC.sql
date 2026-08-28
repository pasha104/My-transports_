create table if not exists public.busphoto_cloud_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.busphoto_cloud_state enable row level security;

drop policy if exists "busphoto cloud select own" on public.busphoto_cloud_state;
drop policy if exists "busphoto cloud insert own" on public.busphoto_cloud_state;
drop policy if exists "busphoto cloud update own" on public.busphoto_cloud_state;
drop policy if exists "busphoto cloud delete own" on public.busphoto_cloud_state;

create policy "busphoto cloud select own" on public.busphoto_cloud_state for select to authenticated using (auth.uid() = user_id);
create policy "busphoto cloud insert own" on public.busphoto_cloud_state for insert to authenticated with check (auth.uid() = user_id);
create policy "busphoto cloud update own" on public.busphoto_cloud_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "busphoto cloud delete own" on public.busphoto_cloud_state for delete to authenticated using (auth.uid() = user_id);

alter table public.busphoto_cloud_state replica identity full;
