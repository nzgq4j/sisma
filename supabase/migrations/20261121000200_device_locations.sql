-- "My location" for alerts: the last position of the account's phone or browser, rounded to 0.01° (about 1 km), sent
-- by the app while signed in (components/AppState.tsx). Alerts near saved places, the old alert settings and tsunami
-- pushes treat it as one more place, named '@device' (the push says "your location" in the device's language), for
-- 30 days after its last update. One row per account; the user reads, writes and deletes their own row only.
create table public.device_locations (
  user_id uuid primary key references public.profiles on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  updated_at timestamptz not null default now()
);
alter table public.device_locations enable row level security;
create policy "own device location read" on public.device_locations for select to authenticated using ((select auth.uid()) = user_id);
create policy "own device location insert" on public.device_locations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own device location update" on public.device_locations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own device location delete" on public.device_locations for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.device_locations from anon;
grant select, insert, update, delete on public.device_locations to authenticated;

-- Rounded on the server too, whatever the client sends; updated_at is the server's time.
create or replace function public.device_location_round()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.lat := round(new.lat::numeric, 2); new.lon := round(new.lon::numeric, 2); new.updated_at := now();
  return new;
end; $$;
create trigger device_location_round before insert or update on public.device_locations
  for each row execute function public.device_location_round();

-- The places an account's alerts use: saved places, plus My location while it is recent.
create or replace function public.alert_places(p_user uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_agg(x) from (
    select jsonb_build_object('name', l.name, 'lat', l.lat, 'lon', l.lon) x from public.saved_locations l where l.user_id = p_user
    union all
    select jsonb_build_object('name', '@device', 'lat', d.lat, 'lon', d.lon) from public.device_locations d
     where d.user_id = p_user and d.updated_at > now() - interval '30 days'
  ) s;
$$;
revoke execute on function public.alert_places(uuid) from public, anon, authenticated;
grant execute on function public.alert_places(uuid) to service_role;

create or replace function public.alert_rule_recipients()
returns table (user_id uuid, rules jsonb, locations jsonb, devices jsonb)
language sql stable security definer set search_path = '' as $$
  select a.user_id,
    (select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'min_magnitude', r.min_magnitude, 'near_places', r.near_places,
       'radius_km', r.radius_km, 'countries', r.countries, 'regions', r.regions, 'quiet', r.quiet, 'quiet_from', r.quiet_from,
       'quiet_to', r.quiet_to, 'quiet_tz', r.quiet_tz, 'quiet_major', r.quiet_major) order by r.position, r.created_at)
     from public.alert_rules r where r.user_id = a.user_id and r.enabled),
    public.alert_places(a.user_id),
    (select jsonb_agg(jsonb_build_object('id', t.id, 'kind', t.kind, 'token', t.token, 'locale', t.locale, 'units', t.units)) from public.push_tokens t where t.user_id = a.user_id)
  from public.alert_settings a
  join public.profiles p on p.id = a.user_id
  where a.enabled and public.effective_plan(p) = 'plus'
    and exists (select 1 from public.alert_rules r where r.user_id = a.user_id and r.enabled)
    and exists (select 1 from public.push_tokens t where t.user_id = a.user_id);
$$;

create or replace function public.alert_recipients()
returns table (user_id uuid, min_magnitude numeric, radius_km integer, locations jsonb, devices jsonb, countries text[], regions text[])
language sql stable security definer set search_path = '' as $$
  select a.user_id, a.min_magnitude, a.radius_km,
    public.alert_places(a.user_id),
    (select jsonb_agg(jsonb_build_object('id', t.id, 'kind', t.kind, 'token', t.token, 'locale', t.locale, 'units', t.units)) from public.push_tokens t where t.user_id = a.user_id),
    a.countries, a.regions
  from public.alert_settings a
  join public.profiles p on p.id = a.user_id
  where a.enabled and public.effective_plan(p) = 'plus'
    and (public.alert_places(a.user_id) is not null or cardinality(a.countries) + cardinality(a.regions) > 0)
    and exists (select 1 from public.push_tokens t where t.user_id = a.user_id);
$$;

create or replace function public.tsunami_recipients(p_lat double precision, p_lon double precision, p_km double precision)
returns table (user_id uuid, place text, km double precision, devices jsonb)
language sql stable security definer set search_path = '' as $$
  with places as (
    select l.user_id, l.name, l.lat, l.lon from public.saved_locations l
    union all
    select d.user_id, '@device', d.lat, d.lon from public.device_locations d where d.updated_at > now() - interval '30 days'
  ), near as (
    select pl.user_id, pl.name,
      6371 * 2 * asin(sqrt(power(sin(radians(pl.lat - p_lat) / 2), 2)
        + cos(radians(p_lat)) * cos(radians(pl.lat)) * power(sin(radians(pl.lon - p_lon) / 2), 2))) as km
    from places pl
  ), best as (
    select distinct on (n.user_id) n.user_id, n.name, n.km from near n where n.km <= p_km order by n.user_id, n.km
  )
  select b.user_id, b.name, b.km,
    (select jsonb_agg(jsonb_build_object('id', t.id, 'kind', t.kind, 'token', t.token, 'locale', t.locale, 'units', t.units))
       from public.push_tokens t where t.user_id = b.user_id)
  from best b
  join public.profiles p on p.id = b.user_id
  where p.tsunami_push
    and exists (select 1 from public.push_tokens t where t.user_id = b.user_id);
$$;
