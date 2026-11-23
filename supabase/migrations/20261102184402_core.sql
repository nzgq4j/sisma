-- sisma core schema: profiles + billing, saved locations, alert settings, push tokens, quake cache, felt reports.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  locale text not null default 'en' check (locale in ('en','es','ja','id','tr','it','pt','zh','fr','de')),
  theme text not null default 'system' check (theme in ('system','light','dark')),
  plan text not null default 'free' check (plan in ('free','plus')),
  billing_interval text check (billing_interval in ('monthly','yearly')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  play_purchase_token text unique,
  subscription_status text,           -- trialing, active, past_due, canceled, ...
  trial_ends_at timestamptz,          -- non-null means the one trial has been used
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (id = (select auth.uid()));
create policy "own profile prefs" on public.profiles for update using (id = (select auth.uid()));
-- Billing columns are written only by the service role (Stripe webhook / Play RTDN).
revoke update on public.profiles from authenticated;
grant update (display_name, locale, theme) on public.profiles to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id) values (new.id); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.effective_plan(p public.profiles) returns text language sql stable set search_path = '' as $$
  select case
    when p.plan is distinct from 'plus' then 'free'
    when p.subscription_status in ('trialing','active','past_due') then 'plus'
    when p.trial_ends_at is not null and p.trial_ends_at > now() then 'plus'
    else 'free' end;
$$;

create table public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  name text not null,
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.saved_locations enable row level security;
create policy "own locations" on public.saved_locations for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.enforce_location_limit() returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.profiles; n int; cap int;
begin
  select * into p from public.profiles where id = new.user_id;
  cap := case public.effective_plan(p) when 'plus' then 10 else 1 end;
  select count(*) into n from public.saved_locations where user_id = new.user_id;
  if n >= cap then raise exception 'Location limit reached (%)', cap using errcode = 'P0001'; end if;
  return new;
end; $$;
create trigger saved_locations_limit before insert on public.saved_locations for each row execute function public.enforce_location_limit();
revoke execute on function public.enforce_location_limit() from public, anon, authenticated;

create table public.alert_settings (
  user_id uuid primary key references public.profiles on delete cascade,
  enabled boolean not null default false,
  min_magnitude numeric(3,1) not null default 5.0 check (min_magnitude between 2.5 and 9),
  radius_km int not null default 500 check (radius_km >= 0),  -- 0 = global
  updated_at timestamptz not null default now()
);
alter table public.alert_settings enable row level security;
create policy "own alerts" on public.alert_settings for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.enforce_alerts_plan() returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = new.user_id;
  if new.enabled and public.effective_plan(p) <> 'plus' then raise exception 'Push alerts require sisma+' using errcode = 'P0001'; end if;
  return new;
end; $$;
create trigger alert_settings_plan before insert or update on public.alert_settings for each row execute function public.enforce_alerts_plan();
revoke execute on function public.enforce_alerts_plan() from public, anon, authenticated;

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('fcm','webpush')),
  token text not null unique,
  created_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;
create policy "own tokens" on public.push_tokens for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Merged quake cache, filled by an ingest edge function every minute (also used to match alerts).
create table public.quakes (
  id text primary key,                -- source:sourceId of the winning record
  source text not null,
  also_in text[] not null default '{}',
  mag numeric(3,1) not null,
  mag_type text,
  title text not null,
  region text not null,
  lat double precision not null,
  lon double precision not null,
  depth_km numeric(6,1) not null,
  time timestamptz not null,
  felt int, cdi numeric(3,1), mmi numeric(3,1),
  tsunami boolean not null default false,
  url text,
  updated_at timestamptz not null default now()
);
create index quakes_time_idx on public.quakes (time desc);
create index quakes_region_time_idx on public.quakes (region, time desc);
alter table public.quakes enable row level security;
create policy "quakes are public" on public.quakes for select using (true);

-- Felt reports (anonymous allowed). Location stored coarsened to 0.1 degrees.
-- Written only by POST /api/reports with the service role, which checks the quake exists and is < 6 h old;
-- there are deliberately no insert/select policies, so the anon and authenticated keys cannot read or write it.
create table public.felt_reports (
  id uuid primary key default gen_random_uuid(),
  quake_id text not null,
  user_id uuid references public.profiles on delete set null,
  mmi smallint not null check (mmi between 1 and 10),
  note text check (char_length(note) <= 500),
  place smallint check (place in (0,1)),          -- 0 indoors, 1 outdoors
  duration smallint check (duration between 0 and 3),
  moved smallint[],
  damage smallint check (damage between 0 and 3),
  lat numeric(4,1), lon numeric(5,1),
  locale text,
  created_at timestamptz not null default now()
);
create index felt_reports_quake_idx on public.felt_reports (quake_id);
alter table public.felt_reports enable row level security;

-- Server-side summary (service role only). Clients get coarse cells from GET /api/reports.
create view public.felt_summary with (security_invoker = true) as
  select quake_id, count(*) as reports, round(avg(mmi), 1) as avg_mmi, max(mmi) as max_mmi,
         array_agg(distinct (lat, lon)::text) filter (where lat is not null) as cells
  from public.felt_reports group by quake_id;
revoke all on public.felt_summary from anon, authenticated;
