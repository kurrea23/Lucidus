-- TripCooker Supabase schema.
-- Run this whole file once in the Supabase SQL editor (SQL → New query → paste → Run).
-- It creates the tables, row-level security so users only see their own data,
-- and a trigger that creates a profile row whenever someone signs up.

/* ------------------------------- Tables ------------------------------- */

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text,
  created_at timestamp with time zone default now()
);

create table if not exists public.travel_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  traveler_type text,
  budget_style text,
  pace text,
  food_style text,
  transport_style text,
  planning_mode text,
  stress_points jsonb default '[]',
  preferred_experiences jsonb default '[]',
  raw_answers jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  trip_type text,
  destination text,
  origin text,
  start_date date,
  end_date date,
  is_festival_mode boolean default false,
  festival_name text,
  status text default 'planning',
  target_budget numeric default 0,
  amount_saved numeric default 0,
  traveler_count integer default 1,
  readiness_score integer default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  item_date date,
  start_time time,
  end_time time,
  location text,
  category text,
  estimated_cost numeric default 0,
  notes text,
  reservation_status text default 'not_needed',
  created_at timestamp with time zone default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null,
  label text not null,
  estimated_amount numeric default 0,
  paid_amount numeric default 0,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  label text not null,
  category text default 'other',
  is_packed boolean default false,
  quantity integer default 1,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.travel_tasks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  category text default 'general',
  priority text default 'normal',
  due_date date,
  is_done boolean default false,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.festival_details (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  festival_name text,
  ticket_status text default 'not_added',
  lodging_type text,
  venue_transportation text,
  meetup_spot text,
  afterparty_plan text,
  recovery_plan text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists trips_user_id_idx on public.trips (user_id);
create index if not exists itinerary_items_trip_id_idx on public.itinerary_items (trip_id);
create index if not exists budget_items_trip_id_idx on public.budget_items (trip_id);
create index if not exists packing_items_trip_id_idx on public.packing_items (trip_id);
create index if not exists travel_tasks_trip_id_idx on public.travel_tasks (trip_id);
create index if not exists festival_details_trip_id_idx on public.festival_details (trip_id);
create index if not exists travel_profiles_user_id_idx on public.travel_profiles (user_id);
create index if not exists users_stripe_customer_idx on public.users (stripe_customer_id);

/* ------------------- Profile row on signup (trigger) ------------------- */

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, split_part(coalesce(new.email, 'traveler'), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* --------------------------- Row-level security --------------------------- */

alter table public.users enable row level security;
alter table public.travel_profiles enable row level security;
alter table public.trips enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.budget_items enable row level security;
alter table public.packing_items enable row level security;
alter table public.travel_tasks enable row level security;
alter table public.festival_details enable row level security;

-- users: read/update own row only. `plan` and `stripe_customer_id` are
-- server-controlled (Stripe webhook via service role) — column grants below
-- stop clients from giving themselves premium.
drop policy if exists "users manage own row" on public.users;
create policy "users manage own row" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

revoke insert, update on table public.users from anon, authenticated;
grant insert (id, email, display_name) on table public.users to authenticated;
grant update (email, display_name) on table public.users to authenticated;

drop policy if exists "own travel profiles" on public.travel_profiles;
create policy "own travel profiles" on public.travel_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own trips" on public.trips;
create policy "own trips" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Child tables: access follows trip ownership.
drop policy if exists "own itinerary items" on public.itinerary_items;
create policy "own itinerary items" on public.itinerary_items
  for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

drop policy if exists "own budget items" on public.budget_items;
create policy "own budget items" on public.budget_items
  for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

drop policy if exists "own packing items" on public.packing_items;
create policy "own packing items" on public.packing_items
  for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

drop policy if exists "own travel tasks" on public.travel_tasks;
create policy "own travel tasks" on public.travel_tasks
  for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

drop policy if exists "own festival details" on public.festival_details;
create policy "own festival details" on public.festival_details
  for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
