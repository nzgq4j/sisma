# Pacific Fire Ribbon (Science → Pacific Fire Ribbon)

The Pacific Ring of Fire unrolled into one long strip, from the southern tip of the Andes to New Zealand, with USGS
earthquakes placed by their distance along the volcanic arcs (across) and their depth (down). sisma+ only; the page and
its explanations are open to everyone, the data is not (`GET /api/science/ribbon` checks the plan on the server).

This is step 1 of the brief: the reference route, the coordinate transform and a live 2D depth profile. Volcano markers
(step 2), terrain from ETOPO 2022 and Copernicus DEM (step 3), and historical playback, overlays and a linked map
(later steps) are not built yet. Slab2 was dropped from scope.

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

## Sources

| Layer | Source | Licence / credit |
|---|---|---|
| Earthquakes | USGS Earthquake Hazards Program summary feeds, all magnitudes: `all_day`, `all_week`, `all_month` (`.geojson` and `.csv`) | US public domain; credited on the page |
| Route | Smithsonian Institution, Global Volcanism Program, *Volcanoes of the World*, Holocene volcanoes, via the GVP web services layer `GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes`, accessed 26 November 2026 | Cited on the page |

Checked on 26 November 2026 and not reachable automatically (so not used): the Smithsonian's *Pacific Ring of Fire*
and *Current Eruptions* pages on volcano.si.edu (both answer automated requests with a verification page), and USGS
Slab2 on ScienceBase (a Cloudflare challenge). The region list below is therefore built from the catalogue's own
Region and Subregion fields, not from the Ring of Fire page; it should be checked against that page by hand.

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

## Verification

- `app/src/lib/ribbon/transform.test.ts`: the route rebuilds identically; the regions are in order; the stored
  distances equal WGS84 geodesics; the route follows its volcanoes; route points map to y ≈ 0; the signs of y; the date
  line; the ends; the corridor; reversibility.
- `app/src/lib/ribbon/feed.test.ts`: CSV with quoted places; uncertainties by id; non-earthquakes left out; a revised
  event kept once, with its latest values; source values unchanged; depth classes; marker size and opacity bounds.
- Checked by hand on 26 November 2026 with the live feed: 9,580 events in the past 30 days, 9,246 of them earthquakes.

## Known limits

- The region list comes from the catalogue's subregions, not from the Smithsonian's Ring of Fire page (not reachable
  automatically).
- New Zealand's South Island is mostly beyond the route's end allowance (the route ends at the Taupo arc): Kaikoura is
  inside, Christchurch is not.
- Stretches between arcs (for example California and the Basin and Range between Mexico and the Cascades, or Taiwan
  between the Ryukyus and Luzon) are inside the corridor and shown on hatched joins.
- Catalogue completeness varies by region and time: small earthquakes are far more completely recorded under dense
  networks (western US, Alaska) than at sea.
