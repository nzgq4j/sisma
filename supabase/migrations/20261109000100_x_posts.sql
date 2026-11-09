-- Automatic posts to X (formerly Twitter), alongside the Bluesky posts (20261106000100_bluesky.sql). Additive only.
-- The account is connected from Me → Administration with "Sign in with X" (OAuth 2.0 with PKCE): sisma never sees the
-- X password. The tokens X returns (access and refresh) are kept encrypted in Supabase Vault under the name
-- 'x_session', readable only by the service role. All tables are server-only (RLS on, no policies).

-- Settings (one row): automatic posting on/off, the minimum magnitude, and the connected account.
create table public.x_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  min_magnitude numeric(3,1) not null default 6.0 check (min_magnitude between 4.0 and 9.0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles on delete set null,
  account_username text,
  account_id text,
  connected_at timestamptz,
  connected_by uuid references public.profiles on delete set null,
  last_error text
);
insert into public.x_settings (id) values (1);
alter table public.x_settings enable row level security;

-- One post per earthquake: claimed before posting (status 'posting'), so two runs never post the same event.
create table public.x_posts (
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
  post_id text,
  post_url text,
  manual boolean not null default false,
  posted_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index x_posts_time_idx on public.x_posts (quake_time desc);
alter table public.x_posts enable row level security;

-- Sign-in attempts in progress: the random state sent to X and the PKCE code verifier, kept for 10 minutes and used
-- once, tied to the administrator who started it.
create table public.x_oauth_states (
  state text primary key,
  code_verifier text not null,
  admin_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.x_oauth_states enable row level security;

create or replace function public.x_session_get() returns jsonb
language sql stable security definer set search_path = '' as $$
  select decrypted_secret::jsonb from vault.decrypted_secrets where name = 'x_session' limit 1;
$$;

create or replace function public.x_session_set(p_session jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  select id into sid from vault.secrets where name = 'x_session' limit 1;
  if p_session is null then
    if sid is not null then delete from vault.secrets where id = sid; end if;
  elsif sid is null then
    perform vault.create_secret(p_session::text, 'x_session', 'X session for sisma automatic posts (OAuth tokens only, no password)');
  else
    perform vault.update_secret(sid, p_session::text);
  end if;
end; $$;

revoke execute on function public.x_session_get() from public, anon, authenticated;
revoke execute on function public.x_session_set(jsonb) from public, anon, authenticated;
grant execute on function public.x_session_get() to service_role;
grant execute on function public.x_session_set(jsonb) to service_role;
