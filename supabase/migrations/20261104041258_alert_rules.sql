-- Alert rules (sisma+): up to 5 separately configured earthquake alerts per user. alert_settings.enabled stays the
-- master switch; each rule has its own on/off, minimum magnitude, what it watches (near the saved places within a
-- radius, and/or countries and world regions) and optional quiet hours (strong quakes can still come through).
-- The alert job (POST /api/cron/alerts) checks a user's rules in order and sends at most one alert per earthquake,
-- recording which rule fired. Additive only: the previous alert_recipients() keeps working until the new code is live.

create table public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  position smallint not null default 0,
  name text not null default '' check (char_length(name) <= 40),
  enabled boolean not null default true,
  min_magnitude numeric(3,1) not null default 5.0 check (min_magnitude between 2.5 and 9),
  near_places boolean not null default true,
  radius_km int not null default 500 check (radius_km >= 0),  -- 0 = anywhere (with near_places)
  countries text[] not null default '{}'
    check (cardinality(countries) <= 20 and array_to_string(countries, ',') ~ '^([a-z]{2}(,[a-z]{2})*)?$'),
  regions text[] not null default '{}'
    check (cardinality(regions) <= 20 and regions <@ array['north_america','central_america','south_america','europe','africa',
      'middle_east','central_asia','south_asia','east_asia','southeast_asia','pacific','atlantic','indian_ocean','polar']::text[]),
  -- Quiet hours in the user's time zone, as minutes after midnight (from may be later than to: overnight).
  quiet boolean not null default false,
  quiet_from smallint not null default 1320 check (quiet_from between 0 and 1439),
  quiet_to smallint not null default 420 check (quiet_to between 0 and 1439),
  quiet_tz text not null default 'UTC' check (char_length(quiet_tz) between 1 and 64),
  quiet_major boolean not null default true,  -- M6+ still sent during quiet hours
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index alert_rules_user_idx on public.alert_rules (user_id, position);
alter table public.alert_rules enable row level security;
create policy "own alert rules read" on public.alert_rules for select to authenticated using (user_id = (select auth.uid()));
create policy "own alert rules insert" on public.alert_rules for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own alert rules update" on public.alert_rules for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own alert rules delete" on public.alert_rules for delete to authenticated using (user_id = (select auth.uid()));

-- The existing single alert setting becomes each user's first rule (before the plan check below exists,
-- so lapsed or free accounts keep their setting as a rule too).
insert into public.alert_rules (user_id, position, min_magnitude, near_places, radius_km, countries, regions)
select user_id, 0, min_magnitude, true, radius_km, countries, regions from public.alert_settings;

-- Creating or switching on a rule needs sisma+ (switching off or deleting never does), and there are at most 5 per
-- user (checked here, not only in the app).
create or replace function public.enforce_alert_rules() returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.profiles; n int;
begin
  select * into p from public.profiles where id = new.user_id;
  if (tg_op = 'INSERT' or new.enabled) and public.effective_plan(p) <> 'plus' then
    raise exception 'Alert rules require sisma+' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' then
    select count(*) into n from public.alert_rules where user_id = new.user_id;
    if n >= 5 then raise exception 'At most 5 alert rules' using errcode = 'P0001'; end if;
  end if;
  new.updated_at := now();
  return new;
end; $$;
create trigger alert_rules_plan before insert or update on public.alert_rules for each row execute function public.enforce_alert_rules();
revoke execute on function public.enforce_alert_rules() from public, anon, authenticated;

-- Alert history: which rule sent it and where the event was; users can read their own.
alter table public.alert_deliveries
  add column rule_id uuid references public.alert_rules on delete set null,
  add column place text check (place is null or char_length(place) <= 200);
create index alert_deliveries_rule_idx on public.alert_deliveries (rule_id);
create index alert_deliveries_user_sent_idx on public.alert_deliveries (user_id, sent_at desc);
grant select on public.alert_deliveries to authenticated;
create policy "own alert history" on public.alert_deliveries for select to authenticated using (user_id = (select auth.uid()));

-- Everyone to consider for alerts now: master switch on, effective plan sisma+, a device, and at least one enabled rule.
-- Rules come in order; saved places for the "near my places" rules. Service role only.
create or replace function public.alert_rule_recipients()
returns table (user_id uuid, rules jsonb, locations jsonb, devices jsonb)
language sql stable security definer set search_path = '' as $$
  select a.user_id,
    (select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'min_magnitude', r.min_magnitude, 'near_places', r.near_places,
       'radius_km', r.radius_km, 'countries', r.countries, 'regions', r.regions, 'quiet', r.quiet, 'quiet_from', r.quiet_from,
       'quiet_to', r.quiet_to, 'quiet_tz', r.quiet_tz, 'quiet_major', r.quiet_major) order by r.position, r.created_at)
     from public.alert_rules r where r.user_id = a.user_id and r.enabled),
    (select jsonb_agg(jsonb_build_object('name', l.name, 'lat', l.lat, 'lon', l.lon)) from public.saved_locations l where l.user_id = a.user_id),
    (select jsonb_agg(jsonb_build_object('id', t.id, 'kind', t.kind, 'token', t.token, 'locale', t.locale, 'units', t.units)) from public.push_tokens t where t.user_id = a.user_id)
  from public.alert_settings a
  join public.profiles p on p.id = a.user_id
  where a.enabled and public.effective_plan(p) = 'plus'
    and exists (select 1 from public.alert_rules r where r.user_id = a.user_id and r.enabled)
    and exists (select 1 from public.push_tokens t where t.user_id = a.user_id);
$$;
revoke execute on function public.alert_rule_recipients() from public, anon, authenticated;
grant execute on function public.alert_rule_recipients() to service_role;
