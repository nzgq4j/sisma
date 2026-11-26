-- Me → Administration → Discover: the hashtags and words searched on Bluesky for geoscience posts (editable there).
alter table public.bluesky_settings
  add column if not exists discover_terms text[] not null default array[
    '#geosky', '#sciencesky', '#earthquake', '#seismology', '#volcano', '#tsunami', '#geology',
    'earthquake', 'seismic', 'magnitude', 'fault', 'volcanic'
  ]::text[];
