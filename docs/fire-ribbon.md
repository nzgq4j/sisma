# Pacific Fire Ribbon (Science → Pacific Fire Ribbon)

The Pacific Ring of Fire unrolled into one long strip, from the southern tip of the Andes to New Zealand, with USGS
earthquakes placed by their distance along the volcanic arcs (across) and their depth (down). sisma+ only; the page and
its explanations are open to everyone, the data is not (`GET /api/science/ribbon` checks the plan on the server).

Built so far: step 1 (the reference route, the coordinate transform and a live 2D depth profile), step 2 (volcano
markers with this week's reported status), step 3 (terrain along the ribbon from ETOPO 2022, with true-scale and
exaggerated relief) and step 4 (a 3D view of a stretch of the ribbon). Copernicus DEM detail for individual volcanoes,
historical playback, overlays and a linked map (later steps) are not built yet. Slab2 was dropped from scope.

## Files

| File | What it does |
|---|---|
| `app/src/lib/ribbon/gvp-arcs.json` | Extract of the Smithsonian volcano catalogue: the 39 subregions used, which group (region) each belongs to, whether it shapes the route, and the number, latitude and longitude of their 681 Holocene volcanoes. |
| `app/scripts/build-ribbon-route.mjs` | Builds `route.json` from the extract (deterministic; a test rebuilds it and compares byte for byte). |
| `app/src/lib/ribbon/route.json` | The reference route: 167 points, 39,460 km, each with its WGS84 distance along the route and its subregion. |
| `app/src/lib/ribbon/transform.ts` | `toRibbon(lat, lon)` → distance along the route and signed distance from it; `fromRibbon(x, y)` reverses it; the corridor; the region layout. Server only. |
| `app/src/lib/ribbon/feed.ts` | Reads the USGS summary feeds (GeoJSON + CSV) into ribbon earthquakes. Server only. |
| `app/src/lib/ribbon/shared.ts` | Response format, depth colours, marker size and opacity, poll interval (shared by API and page). |
| `app/src/app/api/science/ribbon/route.ts` | The API: plan check, hourly cached download per period, magnitude filter. |
| `app/src/components/science/FireRibbon.tsx` | The page: controls, status, the plot, key, details, largest list, notes. |
| `app/src/components/science/Ribbon3D.tsx` | The 3D view (Three.js, loaded only when someone opens it). |
| `app/src/app/api/science/ribbon/terrain3d/route.ts` | A window of the 3D terrain grid (sisma+, cached for a day). |

## Sources

| Layer | Source | Licence / credit |
|---|---|---|
| Earthquakes | USGS Earthquake Hazards Program summary feeds, all magnitudes: `all_day`, `all_week`, `all_month` (`.geojson` and `.csv`) | US public domain; credited on the page |
| Route | Smithsonian Institution, Global Volcanism Program, *Volcanoes of the World*, Holocene volcanoes, via the GVP web services layer `GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes`, accessed 26 November 2026 | Cited on the page |

Checked on 26 November 2026 and not reachable automatically (so not used): the Smithsonian's *Pacific Ring of Fire*
and *Current Eruptions* pages on volcano.si.edu (both answer automated requests with a verification page), and USGS
Slab2 on ScienceBase (a Cloudflare challenge). The region list below is therefore built from the catalogue's own
Region and Subregion fields, not from the Ring of Fire page. Decision (26 November 2026): this catalogue-based list is
the definition used; it is not checked against the Ring of Fire page.

## Regions and the route

The route visits these Smithsonian subregions in this order (`route: true`); the others in the same region belong to it
but don't bend the route (`route: false`):

| Region | Subregions on the route | Also in the region |
|---|---|---|
| Southern Andes | Austral Andean, Southern Andean | |
| Central Andes | Central Andean | |
| Northern Andes | Northern Andean | |
| Central America | Central America | |
| Mexico | Chiapanecan, Trans-Mexican | |
| Western US | High Cascades | |
| Western Canada | Garibaldi | |
| Alaska | Wrangell, Alaska Peninsula | |
| Aleutian Islands | Aleutian Ridge | |
| Kamchatka | Eastern Kamchatka | Central Kamchatka |
| Kuril Islands | Kuril | |
| Japan | Northeast Japan, Nankai | Izu |
| Ryukyu Islands | Ryukyu | |
| Philippines | Luzon, Eastern Philippine | Mindanao, Negros-Sulu |
| Sangihe and Halmahera | Sangihe, Halmahera | |
| Papua New Guinea | Bismarck | Bismarck Sea, Trobriand |
| Solomon Islands | Bougainville, Solomon | |
| Vanuatu | Vanuatu | |
| Fiji | Fiji | |
| Tonga | Tofua | Northeast Lau Basin |
| Kermadec Islands | Northern, Middle and Southern Kermadec | |
| New Zealand | Taupo | Western North Island |

Not included (the "expanded view" of the brief, for later): Izu–Bonin (Ogasawara) and Mariana arcs, the Sunda–Banda
arcs, and the arcs of the Scotia Sea and Antarctica.

**Building the route** (`build-ribbon-route.mjs`): for each route subregion, its volcanoes are projected onto a plane
tangent to the sphere at their centre; their principal axis is pointed from the previous subregion towards the next; the
volcanoes are grouped in 100 km steps along that axis; each step with enough volcanoes (2 when the subregion has 10 or
more, else 1) gives one route point at the median position, and the across-arc offsets are averaged with their
neighbours. Consecutive subregions are joined by geodesic connectors. Joins of 200 km or more are drawn hatched as
"No volcanic arc": the route claims no arc there.

Over 95% of the route subregions' volcanoes are within 100 km of the route; the farthest are back-arc or outlying
volcanoes that the median steps leave out (catalogue names: Colo in the Gulf of Tomini, 399 km; Tinakula; Rishirizan;
Buzzard Creek; Payun Matru and the Crater Basalt Volcanic Field in the Argentine back-arc).

## Coordinates

- **x**: distance along the route, km, from the southern end, on the WGS84 ellipsoid (GeographicLib). The route's total
  length is 39,460 km. Points up to 500 km beyond either end are placed on the route's extension (x below 0 or above
  the length); beyond that they are left out.
- **y**: signed distance from the route, km, perpendicular to it on the ellipsoid. Positive = left of the direction of
  travel, which faces the open Pacific along most of the route (west of the Americas, south of the Aleutians, east of
  Japan and the Philippines, east of Tonga and the Kermadecs). In arcs whose trench is on the other side (Vanuatu,
  Halmahera) positive is still "left", not "trench side".
- **Method**: the nearest two route segments are found on a sphere; on each, the foot of the perpendicular is refined
  along the segment's ellipsoidal geodesic until the line to the point is square to it (under 1 m); the closer wins.
- **Reversible**: `fromRibbon(x, y)` returns the latitude and longitude; away from the bends of the route
  `toRibbon(fromRibbon(x, y))` returns x and y within 1 km (tested). At bends, two points can share an x.
- **Date line**: positions are computed on unit vectors and geodesics, so there is no jump at 180° (tested in the
  Aleutians and Fiji).
- **Distortion**: x is a distance along the route, not between places. Two earthquakes 1,000 km apart in x can be close on
  the globe where the route bends back on itself (Sangihe–Halmahera), and far apart across a connector.
- Each earthquake's own latitude, longitude, depth and USGS id are kept and shown unchanged.

## Corridor

An earthquake belongs to the ribbon when y is between −700 km and +400 km. The width behind the arc was set from the
data, not by eye. Of the 91 earthquakes 300 km or deeper in the USGS past-30-days feed of 26 November 2026, 73 fall
inside; widening the far side to 900 km adds only 5. The 18 outside belong to arcs not on this route: Izu–Bonin–Mariana
(10), the Banda Sea (7) and the North Fiji Basin east of Vanuatu (2).

## Earthquakes

- **Feeds**: `all_day`, `all_week` or `all_month` (GeoJSON for the event fields; the CSV of the same feed for
  `horizontalError`, `depthError` and `magError`, which the GeoJSON doesn't carry). Matched by USGS id; an id seen twice
  keeps its latest `updated`.
- **Types**: only `earthquake`; the feeds also list quarry blasts, explosions, ice quakes, landslides and "other event".
- **Refresh**: the server downloads each period's feeds at most once an hour (`unstable_cache`, 3,600 s). The page asks
  again every hour while it is open, and on return to the tab once an hour has passed. When a download fails, the last
  good copy stays and the page says so; the USGS publication time (`metadata.generated`) and its age are always shown,
  and the data is marked "Out of date" after two hours.
- **Magnitude filter**: All, M2.5+ (default) or M4.5+, applied after the corridor.
- **Depth reference**: USGS: "This depth may be relative to the WGS84 geoid, mean sea-level, or the average elevation
  of the seismic stations which provided arrival-time data … The choice of reference depth is dependent on the method
  used to locate the earthquake, which varies by seismic network" (ComCat event terms). The ribbon plots depth as
  reported below a flat surface line; it does not subtract terrain height. 33 km is a common fixed default depth.
- **Tsunami flag**: USGS sets it to 1 "for large events in oceanic regions"; it "does not indicate if a tsunami actually
  did or will exist". The page says so.

## Drawing

- **Depth colours** (from the brief): 0–10 km red `#DE3B3B`, 10–35 orange `#FF8A2A`, 35–70 amber `#FFE066`, 70–150
  cyan `#2FC9D8`, 150–300 blue `#3D7BFF`, 300–500 violet `#B7A1FF`, over 500 deep purple `#A23FE0`. Checked with the
  dataviz palette validator on the panel colour `#0E1526`: colour-vision separation between neighbouring classes passes
  (worst ΔE 14.0, protanopia), normal-vision separation passes (worst 17.8), contrast passes. The lightness-band check
  fails, as it must for seven fixed hues from red to purple; depth is also the vertical position, so colour is never the
  only cue.
- **Size**: radius = 0.8 + 1.2 × 1.45^(M − 2.5) px, bounded to 1.5–11 px (M3 ≈ 2.2, M5 ≈ 3.8, M7 ≈ 7.2).
- **Opacity**: 1 for the last 24 hours (the last hour in the 24-hour view), then fading linearly to 0.35 at the start
  of the period.
- **New earthquakes** since the previous check get a 2.4-second ring that fades out. It is not a wave and doesn't
  represent seismic waves.
- The plot is a canvas the width of the screen inside a sideways-scrolling strip; zoom (×1 to ×64) widens the strip.
  Only the visible part is drawn, and the page still scrolls normally on phones.

## Volcanoes (step 2)

`app/src/lib/ribbon/volcanoes.ts` and `GET /api/science/ribbon/volcanoes` (sisma+ only).

| Data | Source | Refresh |
|---|---|---|
| Volcanoes: number, name, country, subregion, position, summit elevation, type, tectonic setting, last known eruption year, evidence | Smithsonian GVP web services, layer `GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes` (1,209 Holocene volcanoes; the 681 in the ribbon's subregions are shown) | at most once a day |
| Eruption history: confirmed Holocene eruptions, the latest year one began, the largest VEI | layer `GVP-VOTW:Smithsonian_VOTW_Holocene_Eruptions` (11,109 eruptions; "Uncertain Eruption" records are not counted) | at most once a day |
| Status this week | Smithsonian / USGS Weekly Volcanic Activity Report, RSS `volcano.si.edu/news/WeeklyVolcanoRSS.xml`, joined by the volcano number in each item's link (`#vn_NNNNNN`) | at most once an hour |

- **Status colours** (from the brief): red = "Continuing Eruptive Activity", orange = "New Eruptive Activity",
  amber = "New Unrest", white = no report this week (or "Other Observations"), grey = the report couldn't be read.
  Only the report's own category sets a colour.
- **No report is not "dormant"**: the report "is not a comprehensive list of eruptions during the week, but rather a
  summary of activity that meet selected criteria" (its own description). The page says so on every white volcano.
- **Current Eruptions page**: not used (volcano.si.edu answers automated requests to it with a verification page).
- **Encoding**: the RSS declares ISO-8859-1 but carries some UTF-8; it is read as Latin-1 and valid UTF-8 sequences are
  repaired (tested).
- **Drawing**: triangles just above the surface line at each volcano's own position along the route (taller when
  reported). They mark positions only: no lava, plumes or animation. Summit elevation is shown in the details; drawing
  it to scale, and checking it against terrain, waits for step 3.
- **Failures**: catalogue unavailable → "Volcanoes couldn't be loaded", earthquakes unaffected; report unavailable →
  every volcano grey ("Status unavailable"), never white.
- **Layers**: "Show" turns earthquakes and volcanoes on and off. "Go to region" is a sisma sheet (not the system
  picker) with each region's earthquake count.

## Terrain (step 3)

**Source**: NOAA NCEI ETOPO 2022 Global Relief Model, 60 arc-second surface elevation
(`ETOPO_2022_v1_60s_N90W180_surface.nc`, THREDDS OPeNDAP). Grid 10,800 × 21,600 cells on WGS84, cell centres at
−89.99167° + i/60 and −179.99167° + j/60; heights in metres, positive up, relative to the EGM2008 geoid (EPSG:3855),
which is close to mean sea level (checked from the dataset's own attributes).

**Where it is processed**: on the database. This app's build environment can't reach NOAA, but the Supabase project
can (pg_net). `supabase/migrations/*_ribbon_terrain.sql` creates a private schema `ribbon_build` with the route
(`route.json`, 167 points) and four functions:

1. `make_pieces()` splits each route segment into stretches of up to 250 km and, for each, works out the grid index
   range covering the stretch and a band around it (35 km for the crest, 420 km for the trench), split at the 180°
   meridian. 515 pieces (249 crest, 266 trench; about 6.4 million cells in all).
2. `fetch(n)` requests the next n pieces from NOAA (crest: every cell; trench: every third cell in each direction).
3. `parse(n)` reads each downloaded piece and places every cell on its stretch of route: distance across =
   asin(v·n)·R and distance along = atan2(v·u, v·a)·R on the sphere (a = the stretch's start, n = its normal, u = its
   direction), scaled to the route's WGS84 distances. Cells within 25 km either side update the **crest** (highest
   cell per 2 km of route); cells within 400 km update the **trench** (deepest cell per 10 km, with its distance from
   the route). A failed download (NOAA's server answered some requests with HTTP 500 during the build) is requested
   again; each processed response is deleted.
4. `finish()` writes `public.ribbon_terrain` (row `etopo2022-60s`): the crest and trench arrays in whole metres, the
   trench's distances, the source and the parameters. RLS is on with no policies: only the server's service role
   reads it, through `GET /api/science/ribbon/terrain` (sisma+, cached for a day).

A pg_cron job ran `parse` and `fetch` every minute during the build (15 pieces a minute; NOAA answered with 500 and 503 errors when asked for 50 a minute) and was then removed. To rebuild:
`select ribbon_build.make_pieces();` then repeat `fetch` / `parse` until `parse` reports nothing left, then
`select ribbon_build.finish();`.

**What is drawn**: per screen column, the highest crest value (brown above sea level, dark blue where the highest
ground near the route is under water) and the deepest trench value (a blue sea fill and line). These are extremes in
bands, not a single cross-section: the crest is the arc's high ground, not the height of the route line itself, and
the trench line may come from either side of the route.

**Resolution**: cells are about 1.85 km across, which smooths summits. Mount Fuji's highest ETOPO cell is 3,378 m
(checked: rows 7520–7523, columns 19122–19125) against a summit of 3,776 m. Volcano triangles stand at the catalogue's
summit elevation, so a triangle can sit above the brown crest. The trench band uses every third cell (about 5.5 km),
so the deepest point of a narrow trench can be missed by up to one or two cells' depth difference.

**Result of the first build (26 November 2026)**: 515 pieces, 3,621,090 cells placed on the route, 19,731 crest values
and 3,947 trench values with none missing. Deepest trench value per region (metres, ETOPO): Kermadec −10,019, Philippines
−10,033, Tonga −9,840, Kurils −9,588, Papua New Guinea −8,624, Japan −8,019, Central Andes (Peru–Chile) −7,965,
Kamchatka −7,912, Vanuatu −7,588, Aleutians −7,526, Central America −6,566. Highest crest: 6,165 m (Central Andes).
The trench is on the left (Pacific) side of the route except at Papua New Guinea, the Solomons and Vanuatu, where it
lies on the other side.

**Relief modes** (brief §5): *True scale* uses the depth axis's scale for heights too (1 km of height = 1 km of depth);
*Exaggerated ×10* multiplies heights and sea-floor depths by 10. The factor is written on the chart and in the key.
Earthquake depths always use the depth axis and are never adjusted for the terrain above them. Depth reference:
terrain is relative to EGM2008; USGS depths may be relative to the geoid, mean sea level or the stations' average
height (see Earthquakes); the chart draws both from one sea-level line and says so.

## 3D view (step 4)

**What it shows**: one stretch of the ribbon (800, 1,600 or 3,200 km of route) as a block: x = distance along the
route, z = distance across it (700 km behind the arc to 400 km on the Pacific side, the earthquake corridor), y =
height and depth. All three use the same scale (1 unit = 1 km), so the block is long and thin and nothing is stretched
except terrain heights in *Exaggerated ×10*. Earthquakes are spheres at their route position and reported depth (size
from magnitude, colour from the depth classes, faded with age, as in the profile); volcanoes are cones at their
catalogue summit elevation × the relief factor (at sea level when terrain is off). The depth grid has a line every
100 km down to 700 km.

**Cameras**: *Angled* (perspective, from the Pacific side and above), *Cross-section* (orthographic, looking along the
route, so x is collapsed and the slab's dip shows) and *From above* (orthographic, map-like, behind the arc at the top).
Drag to turn (not from above), pinch or scroll to zoom, two-finger drag to pan. Tapping a sphere or cone opens the same
detail card as the profile. ◀ ▶ move half a window along the route; the region picker and the lists move both views.

**Terrain grid**: built on the database like step 3 (`supabase/migrations/*_ribbon_terrain_grid.sql`).
`make_grid_pieces()` splits the route into stretches of up to 250 km with a 720 km band either side (272 pieces, every
third ETOPO cell: about 5.5 km); `parse` places each cell on the route as in step 3 and adds it to its 10 km × 10 km
square (`ribbon_build.grid`: sum, count, maximum); `finish_grid()` writes `public.ribbon_terrain_grid`, one row per 10 km
of route with 110 rounded mean heights (y = −700 + 10j km, j = 0…109), null where no cell fell. RLS on, no policies;
read only through `GET /api/science/ribbon/terrain3d?from=&to=` (sisma+, windows rounded to 100 km, at most 4,000 km).
A pg_cron job ran `parse(60)` and `fetch(10)` every minute during the build and was then removed. To rebuild:
`select ribbon_build.make_grid_pieces();`, repeat `fetch` / `parse`, then `select ribbon_build.finish_grid();`.

**Averages, not extremes**: the 3D surface is the mean height of each 10 km square, unlike the profile's crest
(highest cell) and trench (deepest cell). Peaks and narrow trenches are therefore lower and shallower in 3D than in
the profile; the profile is the place to read extremes.

**Browsers**: needs WebGL; without it the view says so and the profile stays available. Tested in Chromium (desktop
and a 390 px phone viewport); not tested on Safari or a real iPhone in this environment.

GRID_RESULT

## Verification

- `app/src/lib/ribbon/transform.test.ts`: the route rebuilds identically; the regions are in order; the stored
  distances equal WGS84 geodesics; the route follows its volcanoes; route points map to y ≈ 0; the signs of y; the date
  line; the ends; the corridor; reversibility.
- `app/src/lib/ribbon/feed.test.ts`: CSV with quoted places; uncertainties by id; non-earthquakes left out; a revised
  event kept once, with its latest values; source values unchanged; depth classes; marker size and opacity bounds.
- Checked by hand on 26 November 2026 with the live feed: 9,580 events in the past 30 days, 9,246 of them earthquakes.

## Known limits

- The region list comes from the catalogue's subregions, not from the Smithsonian's Ring of Fire page (not reachable
  automatically); by decision, it is not checked against that page.
- New Zealand's South Island is mostly beyond the route's end allowance (the route ends at the Taupo arc): Kaikoura is
  inside, Christchurch is not.
- Stretches between arcs (for example California and the Basin and Range between Mexico and the Cascades, or Taiwan
  between the Ryukyus and Luzon) are inside the corridor and shown on hatched joins.
- Catalogue completeness varies by region and time: small earthquakes are far more completely recorded under dense
  networks (western US, Alaska) than at sea.

## Backlog

- **Share the ribbon**: a visually striking share image of the ribbon (or of the current 3D or profile window), with
  alt text describing what it shows and ready-to-post text, in the app's share style. Requested 26 November 2026; not
  started.
