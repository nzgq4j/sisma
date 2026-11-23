-- Tsunami alerts switch (Me), independent of the sisma+ earthquake alerts switch. Additive.

-- Tsunami alerts switch in Me (free and sisma+), on by default; people change it themselves.
alter table public.profiles add column tsunami_push boolean not null default true;
grant update (tsunami_push) on public.profiles to authenticated;

-- People with notifications on (a push token), the Tsunami alerts switch on and a saved place within p_km of the
-- earthquake, free or sisma+.
create or replace function public.tsunami_recipients(p_lat double precision, p_lon double precision, p_km double precision)
returns table (user_id uuid, place text, km double precision, devices jsonb)
language sql stable security definer set search_path = '' as $$
  with near as (
    select l.user_id, l.name,
      6371 * 2 * asin(sqrt(power(sin(radians(l.lat - p_lat) / 2), 2)
        + cos(radians(p_lat)) * cos(radians(l.lat)) * power(sin(radians(l.lon - p_lon) / 2), 2))) as km
    from public.saved_locations l
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
revoke execute on function public.tsunami_recipients(double precision, double precision, double precision) from public, anon, authenticated;
grant execute on function public.tsunami_recipients(double precision, double precision, double precision) to service_role;
