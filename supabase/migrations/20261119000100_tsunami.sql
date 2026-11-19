-- Official tsunami messages (PTWC, NTWC, JMA) and the pushes sent for them (lib/tsunami/; run by the per-minute job,
-- POST /api/cron/alerts). Additive only. Read and written by the server (service role); RLS on, no policies.

-- Every message seen in the centres' feeds. The feeds only carry the latest bulletin, so earlier ones are kept here.
create table public.tsunami_messages (
  id text primary key,                 -- center-specific message id (lib/tsunami/types.ts)
  center text not null check (center in ('PTWC', 'NTWC', 'JMA')),
  incident text not null,              -- groups the messages about one earthquake
  level text not null check (level in ('major_warning', 'warning', 'threat', 'watch', 'advisory', 'forecast', 'information', 'none')),
  cancelled boolean not null default false,
  title text not null default '',
  issued_at timestamptz not null,
  expires_at timestamptz,
  origin_at timestamptz,
  lat double precision,
  lon double precision,
  mag numeric(3,1),
  place text not null default '',
  areas jsonb not null default '[]'::jsonb,
  url text not null default '',
  created_at timestamptz not null default now()
);
create index tsunami_messages_issued_idx on public.tsunami_messages (issued_at desc);
create index tsunami_messages_incident_idx on public.tsunami_messages (incident);
alter table public.tsunami_messages enable row level security;

-- One push per person, incident and level (a later, more serious level sends again).
create table public.tsunami_deliveries (
  user_id uuid not null references public.profiles on delete cascade,
  incident text not null,
  level text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, incident, level)
);
create index tsunami_deliveries_sent_idx on public.tsunami_deliveries (sent_at);
alter table public.tsunami_deliveries enable row level security;

-- People with notifications on (a push token) and a saved place within p_km of the earthquake, free or sisma+.
-- People who switched alerts off in Me → Alerts are left out. (Replaced in 20261119000200_tsunami_switch.sql.)
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
  where exists (select 1 from public.push_tokens t where t.user_id = b.user_id)
    and not exists (select 1 from public.alert_settings a where a.user_id = b.user_id and not a.enabled);
$$;
revoke execute on function public.tsunami_recipients(double precision, double precision, double precision) from public, anon, authenticated;
grant execute on function public.tsunami_recipients(double precision, double precision, double precision) to service_role;
