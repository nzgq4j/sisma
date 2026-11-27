-- Pacific Fire Ribbon: the Tonga Trench at full ETOPO resolution. The trench profile (step 3) samples every third
-- 60 arc-second cell; this adds the same pieces at every cell from 36,400 to 37,830 km along the route (Tonga and its
-- join with Kermadec, where the Horizon Deep lies). parse() keeps the deeper value per 10 km bin, so the extra pieces
-- can only add cells. finish() now records the stretches read at full resolution in params.trenchFullKm.
-- To rebuild: run this, select ribbon_build.add_trench_full(36600, 37750); then fetch / parse, then finish().

create or replace function ribbon_build.add_trench_full(x0 float8, x1 float8) returns int language plpgsql set search_path = ribbon_build, public as $$
declare k int;
begin
  insert into piece (kind, lat1, lon1, lat2, lon2, x1, x2, last, i0, i1, j0, j1, stride, attempts, done)
  select p.kind, p.lat1, p.lon1, p.lat2, p.lon2, p.x1, p.x2, p.last, p.i0, p.i1, p.j0, p.j1, 1, 0, false
  from piece p where p.kind = 'trench' and p.stride = 3 and p.x2 > add_trench_full.x0 and p.x1 < add_trench_full.x1
    and not exists (select 1 from piece f where f.kind = 'trench' and f.stride = 1 and f.i0 = p.i0 and f.j0 = p.j0 and f.x1 = p.x1);
  get diagnostics k = row_count;
  return k;
end $$;

create or replace function ribbon_build.finish() returns jsonb language plpgsql set search_path = ribbon_build, public as $$
declare L float8 := (select max(x) from route);
begin
  if exists (select 1 from piece where not done) then raise exception 'pieces not done: %', (select count(*) from piece where not done); end if;
  insert into public.ribbon_terrain (id, built_at, source, params, crest, trench, trench_y)
  select 'etopo2022-60s', now(),
    'NOAA NCEI ETOPO 2022 Global Relief Model, 60 arc-second surface elevation (ETOPO_2022_v1_60s_N90W180_surface.nc, THREDDS OPeNDAP); heights in metres above the EGM2008 geoid',
    jsonb_build_object('lengthKm', L, 'crestStepKm', 2, 'crestBandKm', 25, 'crestGrid', '60 arc-second, every cell',
      'trenchStepKm', 10, 'trenchBandKm', 400, 'trenchGrid', '60 arc-second, every third cell in each direction; every cell in trenchFullKm',
      'trenchFullKm', coalesce((select jsonb_agg(jsonb_build_array(round(a::numeric), round(b::numeric))) from
        (select min(x1) a, max(x2) b from piece where kind = 'trench' and stride = 1 having count(*) > 0) s), '[]'::jsonb),
      'pieces', (select count(*) from piece where kind in ('crest', 'trench'))),
    (select array_agg(round(c.zmax)::smallint order by g) from generate_series(0, floor(L / 2)::int) g left join crest c on c.xbin = g),
    (select array_agg(round(t.zmin)::smallint order by g) from generate_series(0, floor(L / 10)::int) g left join trench t on t.xbin = g),
    (select array_agg(round(t.y)::smallint order by g) from generate_series(0, floor(L / 10)::int) g left join trench t on t.xbin = g)
  on conflict (id) do update set built_at = excluded.built_at, source = excluded.source, params = excluded.params,
    crest = excluded.crest, trench = excluded.trench, trench_y = excluded.trench_y;
  return (select jsonb_build_object('crest', cardinality(crest), 'trench', cardinality(trench),
    'crestNulls', (select count(*) from unnest(crest) v where v is null), 'trenchNulls', (select count(*) from unnest(trench) v where v is null))
    from public.ribbon_terrain where id = 'etopo2022-60s');
end $$;

revoke all on all functions in schema ribbon_build from public;
