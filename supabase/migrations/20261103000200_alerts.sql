-- Earthquake alerts (sisma+): a quake within radius_km of any saved location, at or above min_magnitude, is pushed to
-- every registered device of that user (Android via FCM, browsers via Web Push). Matching and sending run in
-- POST /api/cron/alerts (Vercel), called every minute by pg_cron through pg_net with a single-use ticket.

-- Device preferences used to write the notification (language and distance units are per device in the app).
alter table public.push_tokens
  add column locale text not null default 'en' check (locale in ('en','es','ja','id','tr','it','pt','zh','fr','de')),
  add column units text not null default 'km' check (units in ('km','mi')),
  add column updated_at timestamptz not null default now();
create index push_tokens_user_idx on public.push_tokens (user_id);

-- One row per alert sent (per user, not per device), so an event is never pushed twice, even if its id changes when a
-- different agency's solution wins the merge (lat/lon/time let the server spot the same event under a new id).
create table public.alert_deliveries (
  quake_id text not null,
  user_id uuid not null references public.profiles on delete cascade,
  quake_time timestamptz not null,
  lat double precision not null,
  lon double precision not null,
  mag numeric(3,1) not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, quake_id)
);
create index alert_deliveries_sent_idx on public.alert_deliveries (sent_at);
alter table public.alert_deliveries enable row level security;
revoke all on public.alert_deliveries from anon, authenticated;

-- Everyone who should be considered for alerts right now: alerts on, effective plan sisma+, at least one saved location
-- and one device. Service role only.
create or replace function public.alert_recipients()
returns table (user_id uuid, min_magnitude numeric, radius_km int, locations jsonb, devices jsonb)
language sql stable security definer set search_path = '' as $$
  select a.user_id, a.min_magnitude, a.radius_km,
    (select jsonb_agg(jsonb_build_object('name', l.name, 'lat', l.lat, 'lon', l.lon)) from public.saved_locations l where l.user_id = a.user_id),
    (select jsonb_agg(jsonb_build_object('id', t.id, 'kind', t.kind, 'token', t.token, 'locale', t.locale, 'units', t.units)) from public.push_tokens t where t.user_id = a.user_id)
  from public.alert_settings a
  join public.profiles p on p.id = a.user_id
  where a.enabled and public.effective_plan(p) = 'plus'
    and exists (select 1 from public.saved_locations l where l.user_id = a.user_id)
    and exists (select 1 from public.push_tokens t where t.user_id = a.user_id);
$$;
revoke execute on function public.alert_recipients() from public, anon, authenticated;
grant execute on function public.alert_recipients() to service_role;

-- Single-use tickets: pg_cron creates one per run and sends it with the request; the API consumes it through the
-- service role. No shared secret has to be copied between Supabase and Vercel.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.cron_tickets (token uuid primary key default gen_random_uuid(), created_at timestamptz not null default now());

create or replace function private.new_cron_ticket() returns uuid language sql volatile set search_path = '' as $$
  insert into private.cron_tickets default values returning token;
$$;

create or replace function public.consume_cron_ticket(ticket uuid) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare ok boolean;
begin
  delete from private.cron_tickets where created_at < now() - interval '10 minutes';
  delete from private.cron_tickets where token = ticket and created_at > now() - interval '2 minutes' returning true into ok;
  return coalesce(ok, false);
end; $$;
revoke execute on function public.consume_cron_ticket(uuid) from public, anon, authenticated;
grant execute on function public.consume_cron_ticket(uuid) to service_role;

create extension if not exists pg_net;
select cron.schedule('quake-alerts', '* * * * *', $$
  select net.http_post(
    url := 'https://sisma.io/api/cron/alerts',
    body := jsonb_build_object('ticket', private.new_cron_ticket()),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 25000)
$$);
-- Deliveries older than 30 days are no longer needed for de-duplication.
select cron.schedule('alert-deliveries-retention', '23 3 * * *', $$delete from public.alert_deliveries where sent_at < now() - interval '30 days'$$);
