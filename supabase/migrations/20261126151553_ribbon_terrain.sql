-- Pacific Fire Ribbon, step 3: terrain along the ribbon from NOAA ETOPO 2022 (60 arc-second surface elevation,
-- heights in metres above the EGM2008 geoid), processed here because the database can reach NOAA's THREDDS server.
-- docs/fire-ribbon.md describes the method. Run once (and again to rebuild):
--   select ribbon_build.make_pieces();
--   select ribbon_build.fetch(20);   -- repeat until every piece has a request
--   select ribbon_build.parse(20);   -- repeat until every piece is done (failed downloads are requested again)
--   select ribbon_build.finish();    -- writes public.ribbon_terrain
-- (During the first build a pg_cron job ran parse and fetch every minute, then was removed.)
-- The route (ribbon_build.route) is app/src/lib/ribbon/route.json; the app reads public.ribbon_terrain with the
-- service role (GET /api/science/ribbon/terrain).

create schema if not exists ribbon_build;
revoke all on schema ribbon_build from public;

create table if not exists ribbon_build.route (i int primary key, lat float8 not null, lon float8 not null, x float8 not null, arc int not null);

-- One download per piece: a stretch of route of up to 250 km and the band around it, as an index range of the grid.
create table if not exists ribbon_build.piece (
  id serial primary key,
  kind text not null check (kind in ('crest', 'trench')),
  lat1 float8 not null, lon1 float8 not null, lat2 float8 not null, lon2 float8 not null,
  x1 float8 not null, x2 float8 not null, last boolean not null default false,
  i0 int not null, i1 int not null, j0 int not null, j1 int not null, stride int not null,
  request_id bigint, attempts int not null default 0, done boolean not null default false, cells int
);
-- Highest cell within CREST_KM of the route per 2 km of route; deepest cell within TRENCH_KM per 10 km.
create table if not exists ribbon_build.crest (xbin int primary key, zmax real not null);
create table if not exists ribbon_build.trench (xbin int primary key, zmin real not null, y real not null);

create table if not exists public.ribbon_terrain (
  id text primary key,
  built_at timestamptz not null default now(),
  source text not null,
  params jsonb not null,
  crest smallint[] not null,
  trench smallint[] not null,
  trench_y smallint[] not null
);
alter table public.ribbon_terrain enable row level security;
revoke all on public.ribbon_terrain from anon, authenticated;
comment on table public.ribbon_terrain is 'Pacific Fire Ribbon terrain profile (ETOPO 2022), read by the server with the service role only.';

create or replace function ribbon_build.vec(lat float8, lon float8) returns float8[] language sql immutable as
$$ select array[cos(radians(lat)) * cos(radians(lon)), cos(radians(lat)) * sin(radians(lon)), sin(radians(lat))] $$;
create or replace function ribbon_build.cross3(a float8[], b float8[]) returns float8[] language sql immutable as
$$ select array[a[2]*b[3] - a[3]*b[2], a[3]*b[1] - a[1]*b[3], a[1]*b[2] - a[2]*b[1]] $$;
create or replace function ribbon_build.dot3(a float8[], b float8[]) returns float8 language sql immutable as
$$ select a[1]*b[1] + a[2]*b[2] + a[3]*b[3] $$;
create or replace function ribbon_build.unit3(a float8[]) returns float8[] language sql immutable as
$$ select array[a[1] / sqrt(a[1]^2 + a[2]^2 + a[3]^2), a[2] / sqrt(a[1]^2 + a[2]^2 + a[3]^2), a[3] / sqrt(a[1]^2 + a[2]^2 + a[3]^2)] $$;
create or replace function ribbon_build.lat_of(v float8[]) returns float8 language sql immutable as $$ select degrees(asin(greatest(-1, least(1, v[3])))) $$;
create or replace function ribbon_build.lon_of(v float8[]) returns float8 language sql immutable as $$ select degrees(atan2(v[2], v[1])) $$;

create or replace function ribbon_build.make_pieces() returns int language plpgsql set search_path = ribbon_build, public as $$
declare
  R constant float8 := 6371.0088;
  s record; k int; c int; a float8[]; b float8[]; n float8[]; u float8[]; ang float8;
  t0 float8; t1 float8; p0 float8[]; p1 float8[]; kind text; band float8; stride int;
  q float8[]; t float8; d float8; lats float8[]; dls float8[]; clon float8; lo float8; hi float8; la0 float8; la1 float8;
  nlast int := (select max(i) from route);
begin
  delete from piece; delete from crest; delete from trench;
  for s in select r1.i, r1.lat lat1, r1.lon lon1, r1.x x1, r2.lat lat2, r2.lon lon2, r2.x x2 from route r1 join route r2 on r2.i = r1.i + 1 order by r1.i loop
    a := vec(s.lat1, s.lon1); b := vec(s.lat2, s.lon2);
    n := unit3(cross3(a, b)); u := unit3(cross3(n, a)); ang := acos(greatest(-1, least(1, dot3(a, b))));
    k := greatest(1, ceil((s.x2 - s.x1) / 250)::int);
    for c in 0 .. k - 1 loop
      t0 := c::float8 / k; t1 := (c + 1)::float8 / k;
      p0 := array[cos(t0*ang)*a[1] + sin(t0*ang)*u[1], cos(t0*ang)*a[2] + sin(t0*ang)*u[2], cos(t0*ang)*a[3] + sin(t0*ang)*u[3]];
      p1 := array[cos(t1*ang)*a[1] + sin(t1*ang)*u[1], cos(t1*ang)*a[2] + sin(t1*ang)*u[2], cos(t1*ang)*a[3] + sin(t1*ang)*u[3]];
      clon := lon_of(array[cos((t0+t1)/2*ang)*a[1] + sin((t0+t1)/2*ang)*u[1], cos((t0+t1)/2*ang)*a[2] + sin((t0+t1)/2*ang)*u[2], 0]);
      foreach kind in array array['crest', 'trench'] loop
        band := case kind when 'crest' then 25 + 10 else 400 + 20 end;
        stride := case kind when 'crest' then 1 else 3 end;
        lats := '{}'; dls := '{}';
        foreach t in array array[t0, (t0+t1)/2, t1] loop
          foreach d in array array[-band, 0, band] loop
            q := array[cos(t*ang)*a[1] + sin(t*ang)*u[1], cos(t*ang)*a[2] + sin(t*ang)*u[2], cos(t*ang)*a[3] + sin(t*ang)*u[3]];
            q := array[cos(d/R)*q[1] + sin(d/R)*n[1], cos(d/R)*q[2] + sin(d/R)*n[2], cos(d/R)*q[3] + sin(d/R)*n[3]];
            lats := lats || lat_of(q);
            dls := dls || (((lon_of(q) - clon + 540)::numeric % 360) - 180)::float8;
          end loop;
        end loop;
        la0 := greatest(-89.99, (select min(x) from unnest(lats) x) - 0.05);
        la1 := least(89.99, (select max(x) from unnest(lats) x) + 0.05);
        lo := clon + (select min(x) from unnest(dls) x) - 0.05 / cos(radians(greatest(abs(la0), abs(la1))));
        hi := clon + (select max(x) from unnest(dls) x) + 0.05 / cos(radians(greatest(abs(la0), abs(la1))));
        -- Split at the 180° meridian.
        if lo < -180 then
          insert into piece (kind, lat1, lon1, lat2, lon2, x1, x2, last, i0, i1, j0, j1, stride)
          values (kind, lat_of(p0), lon_of(p0), lat_of(p1), lon_of(p1), s.x1 + t0*(s.x2-s.x1), s.x1 + t1*(s.x2-s.x1), s.i + 1 = nlast and c = k - 1,
            floor((la0+90)*60)::int, least(10799, ceil((la1+90)*60)::int), floor((lo+360+180)*60)::int, 21599, stride);
          lo := -180;
        end if;
        if hi >= 180 then
          insert into piece (kind, lat1, lon1, lat2, lon2, x1, x2, last, i0, i1, j0, j1, stride)
          values (kind, lat_of(p0), lon_of(p0), lat_of(p1), lon_of(p1), s.x1 + t0*(s.x2-s.x1), s.x1 + t1*(s.x2-s.x1), s.i + 1 = nlast and c = k - 1,
            floor((la0+90)*60)::int, least(10799, ceil((la1+90)*60)::int), 0, least(21599, ceil((hi-360+180)*60)::int), stride);
          hi := 179.999;
        end if;
        insert into piece (kind, lat1, lon1, lat2, lon2, x1, x2, last, i0, i1, j0, j1, stride)
        values (kind, lat_of(p0), lon_of(p0), lat_of(p1), lon_of(p1), s.x1 + t0*(s.x2-s.x1), s.x1 + t1*(s.x2-s.x1), s.i + 1 = nlast and c = k - 1,
          floor((la0+90)*60)::int, least(10799, ceil((la1+90)*60)::int), greatest(0, floor((lo+180)*60)::int), least(21599, ceil((hi+180)*60)::int), stride);
      end loop;
    end loop;
  end loop;
  return (select count(*) from piece);
end $$;

-- Requests the next n pieces from NOAA (asynchronous: pg_net stores each response in net._http_response).
create or replace function ribbon_build.fetch(n int) returns int language plpgsql set search_path = ribbon_build, public as $$
declare p record; k int := 0;
begin
  for p in select * from piece where not done and request_id is null order by id limit n loop
    update piece set attempts = attempts + 1, request_id = net.http_get(
      'https://www.ngdc.noaa.gov/thredds/dodsC/global/ETOPO2022/60s/60s_surface_elev_netcdf/ETOPO_2022_v1_60s_N90W180_surface.nc.ascii?z['
      || p.i0 || ':' || p.stride || ':' || p.i1 || '][' || p.j0 || ':' || p.stride || ':' || p.j1 || ']',
      timeout_milliseconds := 120000) where id = p.id;
    k := k + 1;
  end loop;
  return k;
end $$;

-- Reads up to n downloaded pieces: every grid cell is placed on the piece's stretch of route and folded into the crest /
-- trench bins. On the stretch's great circle (a = start, n = normal to the left, u = direction at a), a cell at unit
-- vector v lies asin(v·n)·R to the left and atan2(v·u, v·a) radians along; distances along are scaled to the route's
-- WGS84 distances. A failed download is requested again; each processed response is deleted.
create or replace function ribbon_build.parse(n int) returns jsonb language plpgsql set search_path = ribbon_build, public as $$
declare
  R constant float8 := 6371.0088;
  p record; zsec text; rest text; lats float8[]; lons float8[]; a float8[]; b float8[]; nn float8[]; u float8[]; ang float8;
  p0 int; p1 int; ok int := 0; retry int := 0; cnt int;
begin
  create temp table if not exists cell_tmp (x float8, y float8, z float8);
  for p in select pc.*, r.status_code, r.content from piece pc join net._http_response r on r.id = pc.request_id
           where not pc.done order by pc.id limit n loop
    p0 := strpos(p.content, E'\n[0], ');
    p1 := strpos(p.content, E'\n\nz.lat[');
    if p.status_code is distinct from 200 or p0 = 0 or p1 = 0 then
      update piece set request_id = null where id = p.id;
      delete from net._http_response where id = p.request_id;
      retry := retry + 1; continue;
    end if;
    zsec := substr(p.content, p0 + 1, p1 - p0 - 1);
    rest := substr(p.content, p1 + 2);
    lats := string_to_array(split_part(rest, E'\n', 2), ', ')::float8[];
    lons := string_to_array(split_part(substr(rest, strpos(rest, E'\nz.lon[') + 1), E'\n', 2), ', ')::float8[];
    a := vec(p.lat1, p.lon1); b := vec(p.lat2, p.lon2);
    nn := unit3(cross3(a, b)); u := unit3(cross3(nn, a)); ang := acos(greatest(-1, least(1, dot3(a, b))));
    truncate cell_tmp;
    insert into cell_tmp
    select p.x1 + (al / ang) * (p.x2 - p.x1), asin(greatest(-1, least(1, s))) * R, z
    from (
      select z,
        vx*nn[1] + vy*nn[2] + vz*nn[3] as s,
        atan2(vx*u[1] + vy*u[2] + vz*u[3], vx*a[1] + vy*a[2] + vz*a[3]) as al
      from (
        select z, cos(radians(la)) * cos(radians(lo)) vx, cos(radians(la)) * sin(radians(lo)) vy, sin(radians(la)) vz
        from (
          select c.v::float8 z, lats[rw.r::int] la, lons[c.k::int - 1] lo
          from regexp_split_to_table(zsec, E'\n') with ordinality rw(line, r),
               unnest(string_to_array(rw.line, ', ')) with ordinality c(v, k)
          where c.k > 1
        ) g where z > -99990
      ) h
    ) j
    where al >= 0 and (al < ang or (p.last and al <= ang));
    get diagnostics cnt = row_count;
    if p.kind = 'crest' then
      insert into crest (xbin, zmax)
      select floor(x / 2)::int, max(z) from cell_tmp where abs(y) <= 25 group by 1
      on conflict (xbin) do update set zmax = greatest(crest.zmax, excluded.zmax);
    else
      insert into trench (xbin, zmin, y)
      select distinct on (floor(x / 10)::int) floor(x / 10)::int, z, y from cell_tmp where abs(y) <= 400 order by floor(x / 10)::int, z
      on conflict (xbin) do update set zmin = least(trench.zmin, excluded.zmin), y = case when excluded.zmin < trench.zmin then excluded.y else trench.y end;
    end if;
    update piece set done = true, cells = cnt where id = p.id;
    delete from net._http_response where id = p.request_id;
    ok := ok + 1;
  end loop;
  return jsonb_build_object('parsed', ok, 'retry', retry,
    'left', (select count(*) from piece where not done), 'waiting', (select count(*) from piece where not done and request_id is not null));
end $$;

-- Writes the finished profile: crest per 2 km and trench per 10 km from x = 0 to the route's length (null = no cell).
create or replace function ribbon_build.finish() returns jsonb language plpgsql set search_path = ribbon_build, public as $$
declare L float8 := (select max(x) from route);
begin
  if exists (select 1 from piece where not done) then raise exception 'pieces not done: %', (select count(*) from piece where not done); end if;
  insert into public.ribbon_terrain (id, built_at, source, params, crest, trench, trench_y)
  select 'etopo2022-60s', now(),
    'NOAA NCEI ETOPO 2022 Global Relief Model, 60 arc-second surface elevation (ETOPO_2022_v1_60s_N90W180_surface.nc, THREDDS OPeNDAP); heights in metres above the EGM2008 geoid',
    jsonb_build_object('lengthKm', L, 'crestStepKm', 2, 'crestBandKm', 25, 'crestGrid', '60 arc-second, every cell',
      'trenchStepKm', 10, 'trenchBandKm', 400, 'trenchGrid', '60 arc-second, every third cell in each direction', 'pieces', (select count(*) from piece)),
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

-- The route: app/src/lib/ribbon/route.json (scripts/build-ribbon-route.mjs).
insert into ribbon_build.route (i, lat, lon, x, arc) values
  (0,-54.97,-70.262,0,1),
  (1,-52.6138,-71.5364,275.4,1),
  (2,-51.9811,-72.1022,355.6,1),
  (3,-50.979,-73.7282,514.4,1),
  (4,-50.2623,-73.5002,595.7,1),
  (5,-49.019,-73.504,734,1),
  (6,-45.1736,-73.0283,1163,2),
  (7,-44.2371,-72.91,1267.5,2),
  (8,-43.3361,-72.7459,1368.5,2),
  (9,-42.7647,-72.6492,1432.4,2),
  (10,-41.756,-72.3898,1546.5,2),
  (11,-41.0369,-72.2302,1627.5,2),
  (12,-39.9488,-71.8985,1751.5,2),
  (13,-39.3464,-71.7731,1819.3,2),
  (14,-38.3666,-71.4857,1930.9,2),
  (15,-37.6221,-71.3191,2014.8,2),
  (16,-36.3751,-70.9458,2157.1,2),
  (17,-35.6737,-70.6384,2239.7,2),
  (18,-34.849,-70.267,2337.3,2),
  (19,-33.9765,-69.8636,2440.9,2),
  (20,-26.9269,-68.3323,3236.1,3),
  (21,-25.372,-68.5435,3409.7,3),
  (22,-24.8293,-68.1881,3479.7,3),
  (23,-23.8683,-67.9772,3588.2,3),
  (24,-22.838,-67.9082,3702.6,3),
  (25,-20.8028,-68.3701,3932.9,3),
  (26,-19.1862,-68.8418,4118.6,3),
  (27,-18.2382,-69.3964,4238.7,3),
  (28,-16.8564,-70.356,4422.5,3),
  (29,-16.3517,-71.2588,4533.8,3),
  (30,-15.5184,-71.8759,4647.3,3),
  (31,-14.6047,-72.2748,4757.1,3),
  (32,-1.6275,-78.531,6348.7,4),
  (33,-0.4021,-78.2307,6488.3,4),
  (34,0.1985,-78.1144,6555.9,4),
  (35,1.0152,-77.563,6665.1,4),
  (36,1.9161,-76.9662,6784.9,4),
  (37,4.892,-75.324,7161.1,4),
  (38,10.002,-83.8095,8254.8,5),
  (39,10.2546,-84.2963,8315,5),
  (40,10.945,-85.1391,8434.8,5),
  (41,11.621,-85.894,8546.1,5),
  (42,12.1377,-86.308,8618.9,5),
  (43,12.5427,-86.78,8687,5),
  (44,13.1485,-87.7377,8810.7,5),
  (45,13.4835,-88.4996,8901.2,5),
  (46,13.9331,-89.5769,9027.9,5),
  (47,14.2545,-90.3959,9123.2,5),
  (48,14.6305,-91.1659,9216.1,5),
  (49,15.0875,-92.006,9319.7,5),
  (50,17.3602,-93.2297,9603.2,6),
  (51,19.4363,-97.2946,10090.2,7),
  (52,19.2956,-98.5526,10223.3,7),
  (53,19.5914,-99.6382,10341.9,7),
  (54,21.1593,-104.6891,10897,7),
  (55,41.5105,-121.874,13672.2,8),
  (56,43.6448,-121.8144,13909.3,8),
  (57,44.3809,-121.8089,13991.1,8),
  (58,45.6275,-121.8384,14129.7,8),
  (59,46.2029,-121.8237,14193.6,8),
  (60,48.4451,-121.4607,14444.4,9),
  (61,49.9545,-122.9601,14644.7,9),
  (62,50.4929,-123.86,14732.5,9),
  (63,51.5179,-126.1133,14927.5,9),
  (64,61.38,-141.75,16381.3,10),
  (65,62.006,-144.017,16520.1,10),
  (66,61.4695,-152.3306,16963.2,11),
  (67,59.7628,-153.4666,17163.3,11),
  (68,58.6193,-154.4586,17302.7,11),
  (69,58.2559,-155.1455,17359.7,11),
  (70,57.4853,-156.5841,17480.8,11),
  (71,56.9505,-157.6784,17569.7,11),
  (72,56.011,-159.797,17737,12),
  (73,55.4847,-161.9051,17881.8,12),
  (74,55.0482,-163.0751,17970.6,12),
  (75,54.5737,-164.4128,18071.6,12),
  (76,53.7736,-167.9814,18321,12),
  (77,53.2752,-168.6562,18392.3,12),
  (78,52.8358,-169.9478,18491.7,12),
  (79,52.6616,-171.2429,18581.3,12),
  (80,52.2072,-174.6033,18815.3,12),
  (81,52.0895,-176.1366,18921.1,12),
  (82,52.0737,-177.819,19036.5,12),
  (83,51.8062,179.1443,19247.4,12),
  (84,52.015,178.136,19320.6,12),
  (85,56.0328,160.6357,20547.4,13),
  (86,55.1512,160.3938,20646.7,13),
  (87,54.5207,159.863,20724.8,13),
  (88,53.6271,159.0377,20838,13),
  (89,53.2885,158.774,20879.5,13),
  (90,52.4421,157.8739,20991.5,15),
  (91,51.5255,156.9527,21111.5,15),
  (92,50.6761,155.8633,21233,15),
  (93,50.1254,155.4196,21301.9,15),
  (94,49.3793,154.4186,21411.9,15),
  (95,48.6671,153.8994,21499.7,15),
  (96,47.7835,152.815,21626.8,15),
  (97,47.0788,152.0291,21725,15),
  (98,46.4038,150.8747,21840.8,15),
  (99,45.9637,149.791,21937.7,15),
  (100,45.014,147.8684,22121.4,15),
  (101,44.3727,146.261,22267.4,15),
  (102,44.0172,145.2417,22357.9,15),
  (103,43.6816,144.0209,22462.9,15),
  (104,43.5417,142.8329,22560.1,15),
  (105,42.6673,140.8952,22745.3,16),
  (106,41.338,140.84,22893,16),
  (107,40.5384,140.8648,22981.9,16),
  (108,39.9024,140.7703,23052.9,16),
  (109,38.8811,140.5498,23167.9,16),
  (110,37.7418,140.0251,23302.4,16),
  (111,36.8378,139.3274,23420.3,16),
  (112,36.577,138.5459,23495.9,16),
  (113,36.1963,137.5369,23595.8,18),
  (114,33.2409,131.2803,24255.8,18),
  (115,32.8236,130.6918,24327.7,18),
  (116,31.6669,130.6324,24456.1,19),
  (117,30.6698,130.2114,24573.7,19),
  (118,30.1569,129.3934,24670.7,19),
  (119,25.0097,121.7533,25616,19),
  (120,20.469,122.01,26119.5,20),
  (121,19.1126,121.9865,26269.7,20),
  (122,18.3078,121.6027,26367.5,20),
  (123,15.0071,121.1088,26736.6,20),
  (124,14.1005,121.2966,26838.9,20),
  (125,13.4642,123.4658,27083.8,21),
  (126,12.7281,123.9579,27181.2,21),
  (127,11.5481,124.5951,27329,21),
  (128,10.2192,125.0599,27484.5,21),
  (129,7.382,126.047,27816.6,21),
  (130,3.1463,125.4422,28289.8,24),
  (131,2.0566,125.1273,28415.2,24),
  (132,1.3221,124.8692,28501.4,24),
  (133,0.7331,127.3773,28788,25),
  (134,1.6285,127.6749,28892.4,25),
  (135,-3.6106,144.7039,30873.7,26),
  (136,-4.9677,147.5705,31225.6,26),
  (137,-5.3676,148.1373,31302.4,26),
  (138,-5.3811,150.0548,31514.9,26),
  (139,-4.9095,151.1626,31648.4,26),
  (140,-4.1774,152.2035,31789.4,26),
  (141,-6.1152,155.2164,32186.3,29),
  (142,-8.75,157.03,32539.8,30),
  (143,-8.8921,158.0182,32649.7,30),
  (144,-9.1324,159.8119,32848.7,30),
  (145,-13.8,167.47,33830.7,31),
  (146,-16.5625,168.6708,34162.5,31),
  (147,-22.3653,171.6849,34878.5,31),
  (148,-19.1181,177.9815,35626.2,32),
  (149,-16.8412,-179.9644,35959.1,32),
  (150,-15.737,-173.7085,36638.7,33),
  (151,-18.7787,-174.7297,36992.5,33),
  (152,-19.6605,-175.0379,37095.3,33),
  (153,-20.4447,-175.3785,37189.1,33),
  (154,-21.175,-175.6773,37275.8,33),
  (155,-24.8,-177.02,37700.2,35),
  (156,-25.8827,-177.2143,37821.7,35),
  (157,-29.27,-177.92,38203.5,35),
  (158,-30.21,-178.475,38320.7,36),
  (159,-31.1115,-178.918,38429.3,36),
  (160,-31.85,-179.18,38514.8,36),
  (161,-35.004,178.973,38904.5,37),
  (162,-36.1391,178.1293,39051.9,37),
  (163,-36.446,177.839,39094.8,37),
  (164,-37.5377,176.8981,39242.1,38),
  (165,-38.803,175.9481,39405.3,38),
  (166,-39.2185,175.601,39460.4,38)
on conflict (i) do update set lat = excluded.lat, lon = excluded.lon, x = excluded.x, arc = excluded.arc;
