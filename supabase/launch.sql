-- Apply to a new Supabase project. Legacy schema.sql is a demo reference only.
create table if not exists public.tripcooker_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.tripcooker_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  customer_id text not null unique
);
alter table public.tripcooker_state enable row level security;
alter table public.tripcooker_billing enable row level security;
-- No browser access. All reads and writes go through verified Next.js APIs.
revoke all on public.tripcooker_state, public.tripcooker_billing from anon, authenticated;
grant all on public.tripcooker_state, public.tripcooker_billing to service_role;

-- Minimal verified webhook receipts; no raw event bodies, contact details or card data.
-- Receipts are audit evidence only, never a cached entitlement authority.
create table if not exists public.tripcooker_billing_events (
  event_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  plan_observed text not null check (plan_observed in ('free', 'premium')),
  processed_at timestamptz not null default now()
);
alter table public.tripcooker_billing_events enable row level security;
revoke all on public.tripcooker_billing_events from anon, authenticated;
grant all on public.tripcooker_billing_events to service_role;

create or replace function public.save_tripcooker_state(p_user_id uuid, p_version bigint, p_data jsonb, p_premium boolean)
returns bigint language plpgsql security invoker set search_path = public as $$
declare old_data jsonb; old_version bigint; active_count integer; new_active boolean;
begin
  select data, version into old_data, old_version from tripcooker_state where user_id = p_user_id for update;
  if not found or old_version <> p_version then raise exception 'state_conflict'; end if;
  select count(*) into active_count from jsonb_array_elements(p_data->'trips') t where t->>'status' in ('planning','ready');
  select exists (
    select 1 from jsonb_array_elements(p_data->'trips') t
    where t->>'status' in ('planning','ready') and not exists (
      select 1 from jsonb_array_elements(old_data->'trips') o where o->>'id' = t->>'id' and o->>'status' in ('planning','ready')
    )
  ) into new_active;
  -- Downgraded customers may keep/edit their existing trips; they cannot add or reactivate more.
  if not p_premium and active_count > 1 and new_active then raise exception 'premium_required'; end if;
  update tripcooker_state set data = p_data, version = version + 1, updated_at = now() where user_id = p_user_id;
  return old_version + 1;
end $$;
revoke all on function public.save_tripcooker_state(uuid,bigint,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.save_tripcooker_state(uuid,bigint,jsonb,boolean) to service_role;

-- Serialize checkout creation across tabs/server instances.
alter table public.tripcooker_billing add column if not exists checkout_lock_until timestamptz not null default '1970-01-01';
create or replace function public.lock_tripcooker_checkout(p_user_id uuid)
returns boolean language plpgsql security invoker set search_path = public as $$
begin
  update tripcooker_billing set checkout_lock_until = now() + interval '3 minutes'
    where user_id = p_user_id and checkout_lock_until < now();
  return found;
end $$;
revoke all on function public.lock_tripcooker_checkout(uuid) from public, anon, authenticated;
grant execute on function public.lock_tripcooker_checkout(uuid) to service_role;

create table if not exists public.tripcooker_request_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count integer not null default 1
);
alter table public.tripcooker_request_limits enable row level security;
revoke all on public.tripcooker_request_limits from anon, authenticated;
grant all on public.tripcooker_request_limits to service_role;
create or replace function public.allow_tripcooker_request(p_user_id uuid)
returns boolean language plpgsql security invoker set search_path = public as $$
declare accepted integer;
begin
  insert into tripcooker_request_limits(user_id) values (p_user_id)
  on conflict (user_id) do update set
    window_start = case when tripcooker_request_limits.window_start < now() - interval '1 minute' then now() else tripcooker_request_limits.window_start end,
    request_count = case when tripcooker_request_limits.window_start < now() - interval '1 minute' then 1 else tripcooker_request_limits.request_count + 1 end
  where tripcooker_request_limits.window_start < now() - interval '1 minute' or tripcooker_request_limits.request_count < 180
  returning request_count into accepted;
  return accepted is not null;
end $$;
revoke all on function public.allow_tripcooker_request(uuid) from public, anon, authenticated;
grant execute on function public.allow_tripcooker_request(uuid) to service_role;
