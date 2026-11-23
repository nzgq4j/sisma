-- Alert areas (sisma+): besides saved places, a user can choose countries and world regions to be alerted for
-- wherever they are. Countries are ISO 3166 alpha-2 codes in lower case; regions are the ids in
-- app/src/lib/world-regions.ts. Up to 20 of each; checked here as well as in the app.
alter table public.alert_settings
  add column countries text[] not null default '{}'
    check (cardinality(countries) <= 20 and array_to_string(countries, ',') ~ '^([a-z]{2}(,[a-z]{2})*)?$'),
  add column regions text[] not null default '{}'
    check (cardinality(regions) <= 20 and regions <@ array['north_america','central_america','south_america','europe','africa',
      'middle_east','central_asia','south_asia','east_asia','southeast_asia','pacific','atlantic','indian_ocean','polar']::text[]);

-- Recipients now also carry their areas, and people who chose areas but have no saved place are included.
drop function if exists public.alert_recipients();
create function public.alert_recipients()
returns table (user_id uuid, min_magnitude numeric, radius_km int, locations jsonb, devices jsonb, countries text[], regions text[])
language sql stable security definer set search_path = '' as $$
  select a.user_id, a.min_magnitude, a.radius_km,
    (select jsonb_agg(jsonb_build_object('name', l.name, 'lat', l.lat, 'lon', l.lon)) from public.saved_locations l where l.user_id = a.user_id),
    (select jsonb_agg(jsonb_build_object('id', t.id, 'kind', t.kind, 'token', t.token, 'locale', t.locale, 'units', t.units)) from public.push_tokens t where t.user_id = a.user_id),
    a.countries, a.regions
  from public.alert_settings a
  join public.profiles p on p.id = a.user_id
  where a.enabled and public.effective_plan(p) = 'plus'
    and (exists (select 1 from public.saved_locations l where l.user_id = a.user_id) or cardinality(a.countries) + cardinality(a.regions) > 0)
    and exists (select 1 from public.push_tokens t where t.user_id = a.user_id);
$$;
revoke execute on function public.alert_recipients() from public, anon, authenticated;
grant execute on function public.alert_recipients() to service_role;
