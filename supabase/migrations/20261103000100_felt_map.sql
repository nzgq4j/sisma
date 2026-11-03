-- Automatic felt maps: anonymous, approximate app-activity pings → per-event heatmap of where a quake was probably felt.
-- Pings are blurred on the device (random offset up to ~500 m) and carry no user, device or IP identifier.
-- Written and read only by the server (service role): RLS on, no policies, no grants to anon/authenticated.

create table public.app_pings (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  lat numeric(7,4) not null check (lat between -90 and 90),
  lon numeric(8,4) not null check (lon between -180 and 180)
);
create index app_pings_created_at_idx on public.app_pings using brin (created_at);
create index app_pings_time_lat_idx on public.app_pings (created_at, lat);
alter table public.app_pings enable row level security;
revoke all on public.app_pings from anon, authenticated;

-- Computed felt maps, cached once an event's 180-second window has closed.
create table public.felt_maps (
  quake_id text primary key,
  computed_at timestamptz not null default now(),
  radius_km numeric(6,1) not null,
  total int not null,
  cells jsonb not null
);
alter table public.felt_maps enable row level security;
revoke all on public.felt_maps from anon, authenticated;

-- Raw pings are kept for 7 days (enough to build maps for the app's 7-day view), then deleted.
create extension if not exists pg_cron;
select cron.schedule('app-pings-retention', '17 3 * * *', $$delete from public.app_pings where created_at < now() - interval '7 days'$$);
