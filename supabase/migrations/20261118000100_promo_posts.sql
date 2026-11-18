-- Play Store posts on Bluesky (lib/promo.ts; Me → Administration). Additive only. Read and written by the server
-- (service role) for administrators; no access for the API roles (RLS on, no policies).

-- One row: automatic daily posting on/off, the time of the next automatic post and the current round (all 100
-- post / language combinations are posted once per round before any repeats).
create table public.promo_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  next_at timestamptz,
  cycle integer not null default 1 check (cycle >= 1),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles on delete set null
);
insert into public.promo_settings (id) values (1);
alter table public.promo_settings enable row level security;

-- Every post made (automatic or by hand). A combination counts as used in its round unless the post failed.
create table public.promo_posts (
  id bigint generated always as identity primary key,
  cycle integer not null,
  post_id text not null,
  locale text not null,
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
create index promo_posts_created_idx on public.promo_posts (created_at desc);
create index promo_posts_cycle_idx on public.promo_posts (cycle);
alter table public.promo_posts enable row level security;
