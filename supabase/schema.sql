-- TripCooker Supabase schema.
-- The MVP ships in local demo mode (localStorage); this schema mirrors the
-- client store shape so persistence can be swapped to Supabase without UI changes.

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  plan text default 'free',
  created_at timestamp with time zone default now()
);

create table travel_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
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

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
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
  readiness_score integer default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
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

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  category text not null,
  label text not null,
  estimated_amount numeric default 0,
  paid_amount numeric default 0,
  notes text,
  created_at timestamp with time zone default now()
);

create table packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  label text not null,
  category text default 'other',
  is_packed boolean default false,
  quantity integer default 1,
  notes text,
  created_at timestamp with time zone default now()
);

create table travel_tasks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  title text not null,
  category text default 'general',
  priority text default 'normal',
  due_date date,
  is_done boolean default false,
  notes text,
  created_at timestamp with time zone default now()
);

create table festival_details (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
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
