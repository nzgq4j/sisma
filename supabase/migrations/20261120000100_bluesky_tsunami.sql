-- Bluesky posts for official tsunami reports (lib/bluesky.ts autoTsunami). Additive only.
-- tsunami_key: the tsunami report a post carried ("<incident>|<level>|a" or "|c" when cancelled), on earthquake posts
-- that included the tsunami line and on posts made for a new tsunami level; each key is posted once.
alter table public.bluesky_posts add column tsunami_key text;
create index bluesky_posts_tsunami_idx on public.bluesky_posts (tsunami_key) where tsunami_key is not null;
