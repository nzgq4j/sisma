-- Pacific Fire Ribbon, step 4: the 3D terrain grid. Mean NOAA ETOPO 2022 (60 arc-second) height in 10 km x 10 km cells
-- along the route, from 700 km behind the arc (y = -700) to 400 km on the Pacific side (y = +400). Built on the database
-- with the step 3 functions (pg_net requests to NOAA's OPeNDAP server; docs/fire-ribbon.md). Rerunnable.

alter table ribbon_build.piece drop constraint if exists piece_kind_check;
alter table ribbon_build.piece add constraint piece_kind_check check (kind in ('crest', 'trench', 'grid'));

create table if not exists ribbon_build.grid (
  xbin int not null, ybin int not null, zsum float8 not null, n int not null, zmax real not null,
  primary key (xbin, ybin)
);

create table if not exists public.ribbon_terrain_grid (xbin int primary key, z smallint[] not null);
alter table public.ribbon_terrain_grid enable row level security;
revoke all on public.ribbon_terrain_grid from anon, authenticated;
comment on table public.ribbon_terrain_grid is 'Pacific Fire Ribbon 3D terrain (ETOPO 2022): mean height (m, EGM2008) per 10 km x 10 km cell; z[j] is y = -700 + 10(j-1) km. Read by the server with the service role only.';

-- Pieces for the grid: each route segment in stretches of up to 250 km, with a 720 km band either side, every third cell.
create or replace function ribbon_build.make_grid_pieces() returns int language plpgsql set search_path = ribbon_build, public as $$
declare
  R constant float8 := 6371.0088;
  band constant float8 := 700 + 20;
  s record; k int; c int; a float8[]; b float8[]; n float8[]; u float8[]; ang float8;
  t0 float8; t1 float8; p0 float8[]; p1 float8[];
  q float8[]; t float8; d float8; lats float8[]; dls float8[]; clon float8; lo float8; hi float8; la0 float8; la1 float8;
  nlast int := (select max(i) from route);
begin
  delete from piece where kind = 'grid'; delete from grid;
  for s in select r1.i, r1.lat lat1, r1.lon lon1, r1.x x1, r2.lat lat2, r2.lon lon2, r2.x x2 from route r1 join route r2 on r2.i = r1.i + 1 order by r1.i loop
    a := vec(s.lat1, s.lon1); b := vec(s.lat2, s.lon2);
    n := unit3(cross3(a, b)); u := unit3(cross3(n, a)); ang := acos(greatest(-1, least(1, dot3(a, b))));
    k := greatest(1, ceil((s.x2 - s.x1) / 250)::int);
    for c in 0 .. k - 1 loop
      t0 := c::float8 / k; t1 := (c + 1)::float8 / k;
      p0 := array[cos(t0*ang)*a[1] + sin(t0*ang)*u[1], cos(t0*ang)*a[2] + sin(t0*ang)*u[2], cos(t0*ang)*a[3] + sin(t0*ang)*u[3]];
      p1 := array[cos(t1*ang)*a[1] + sin(t1*ang)*u[1], cos(t1*ang)*a[2] + sin(t1*ang)*u[2], cos(t1*ang)*a[3] + sin(t1*ang)*u[3]];
      clon := lon_of(array[cos((t0+t1)/2*ang)*a[1] + sin((t0+t1)/2*ang)*u[1], cos((t0+t1)/2*ang)*a[2] + sin((t0+t1)/2*ang)*u[2], 0]);
      lats := '{}'; dls := '{}';
      foreach t in array array[t0, (t0+t1)/2, t1] loop
        foreach d in array array[-band, -band/2, 0, band/2, band] loop
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
      if lo < -180 then
        insert into piece (kind, lat1, lon1, lat2, lon2, x1, x2, last, i0, i1, j0, j1, stride)
        values ('grid', lat_of(p0), lon_of(p0), lat_of(p1), lon_of(p1), s.x1 + t0*(s.x2-s.x1), s.x1 + t1*(s.x2-s.x1), s.i + 1 = nlast and c = k - 1,
          floor((la0+90)*60)::int, least(10799, ceil((la1+90)*60)::int), floor((lo+360+180)*60)::int, 21599, 3);
        lo := -180;
      end if;
      if hi >= 180 then
        insert into piece (kind, lat1, lon1, lat2, lon2, x1, x2, last, i0, i1, j0, j1, stride)
        values ('grid', lat_of(p0), lon_of(p0), lat_of(p1), lon_of(p1), s.x1 + t0*(s.x2-s.x1), s.x1 + t1*(s.x2-s.x1), s.i + 1 = nlast and c = k - 1,
          floor((la0+90)*60)::int, least(10799, ceil((la1+90)*60)::int), 0, least(21599, ceil((hi-360+180)*60)::int), 3);
        hi := 179.999;
      end if;
      insert into piece (kind, lat1, lon1, lat2, lon2, x1, x2, last, i0, i1, j0, j1, stride)
      values ('grid', lat_of(p0), lon_of(p0), lat_of(p1), lon_of(p1), s.x1 + t0*(s.x2-s.x1), s.x1 + t1*(s.x2-s.x1), s.i + 1 = nlast and c = k - 1,
        floor((la0+90)*60)::int, least(10799, ceil((la1+90)*60)::int), greatest(0, floor((lo+180)*60)::int), least(21599, ceil((hi+180)*60)::int), 3);
    end loop;
  end loop;
  return (select count(*) from piece where kind = 'grid');
end $$;

-- parse(n): as in step 3, plus the grid branch (sum, count and maximum per 10 km cell).
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
    elsif p.kind = 'trench' then
      insert into trench (xbin, zmin, y)
      select distinct on (floor(x / 10)::int) floor(x / 10)::int, z, y from cell_tmp where abs(y) <= 400 order by floor(x / 10)::int, z
      on conflict (xbin) do update set zmin = least(trench.zmin, excluded.zmin), y = case when excluded.zmin < trench.zmin then excluded.y else trench.y end;
    else
      -- 10 km x 10 km cells from 700 km behind the arc (y = -700) to 400 km on the Pacific side (y = +400).
      insert into grid (xbin, ybin, zsum, n, zmax)
      select floor(x / 10)::int, floor((y + 700) / 10)::int, sum(z), count(*), max(z) from cell_tmp where y >= -700 and y < 400 group by 1, 2
      on conflict (xbin, ybin) do update set zsum = grid.zsum + excluded.zsum, n = grid.n + excluded.n, zmax = greatest(grid.zmax, excluded.zmax);
    end if;
    update piece set done = true, cells = cnt where id = p.id;
    delete from net._http_response where id = p.request_id;
    ok := ok + 1;
  end loop;
  return jsonb_build_object('parsed', ok, 'retry', retry,
    'left', (select count(*) from piece where not done), 'waiting', (select count(*) from piece where not done and request_id is not null));
end $$;

-- finish_grid(): one row per 10 km of route, 110 rounded mean heights each (null where no cell fell in that square).
create or replace function ribbon_build.finish_grid() returns jsonb language plpgsql set search_path = ribbon_build, public as $$
declare L float8 := (select max(x) from route);
begin
  if exists (select 1 from piece where kind = 'grid' and not done) then raise exception 'grid pieces not done'; end if;
  delete from public.ribbon_terrain_grid;
  insert into public.ribbon_terrain_grid (xbin, z)
  select g, (select array_agg(round(c.zsum / c.n)::smallint order by j) from generate_series(0, 109) j left join grid c on c.xbin = g and c.ybin = j)
  from generate_series(0, floor(L / 10)::int) g;
  return (select jsonb_build_object('rows', count(*), 'nulls', sum((select count(*) from unnest(t.z) v where v is null))) from public.ribbon_terrain_grid t);
end $$;

revoke all on all functions in schema ribbon_build from public;
