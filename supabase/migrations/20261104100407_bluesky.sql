-- Administrators and automatic Bluesky posts. Additive only.

-- Administrator flag: set by the database owner only (users can update display_name, locale and theme only; the
-- trigger below also refuses any change to is_admin made through the API roles). Every admin request re-checks it on
-- the server.
alter table public.profiles add column is_admin boolean not null default false;
grant select (is_admin) on public.profiles to authenticated;
create or replace function public.protect_is_admin() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and new.is_admin is distinct from (case when tg_op = 'UPDATE' then old.is_admin else false end) then
    raise exception 'is_admin can only be changed by the database owner' using errcode = '42501';
  end if;
  return new;
end; $$;
create trigger profiles_protect_is_admin before insert or update on public.profiles for each row execute function public.protect_is_admin();

-- Bluesky settings (one row): automatic posting on/off and the minimum magnitude. Read and written by the server
-- (service role) for administrators only.
create table public.bluesky_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  min_magnitude numeric(3,1) not null default 6.0 check (min_magnitude between 4.0 and 9.0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles on delete set null
);
insert into public.bluesky_settings (id) values (1);
alter table public.bluesky_settings enable row level security;

-- One post per earthquake: claimed before posting (status 'posting'), so two runs never post the same event.
create table public.bluesky_posts (
  quake_id text primary key,
  quake_time timestamptz not null,
  lat double precision not null,
  lon double precision not null,
  mag numeric(3,1) not null,
  place text,
  text text,
  alt text,
  status text not null default 'posting' check (status in ('posting', 'posted', 'failed')),
  error text,
  post_uri text,
  post_url text,
  manual boolean not null default false,
  posted_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index bluesky_posts_time_idx on public.bluesky_posts (quake_time desc);
alter table public.bluesky_posts enable row level security;
