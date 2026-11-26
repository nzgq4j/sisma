# Data sources

| Source | Endpoint | Notes |
|---|---|---|
| USGS | https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson | Global M2.5+, GeoJSON, CORS. Full history: fdsnws/event/1/query |
| EMSC | https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmag=2.5&limit=500 | Strong in Europe/Mediterranean. Realtime websocket: wss://www.seismicportal.eu/standing_order/websocket |
| GeoNet | https://api.geonet.org.nz/quake?MMI=3 | New Zealand. Send Accept: application/vnd.geo+json;version=2 |
| JMA | https://www.jma.go.jp/bosai/quake/data/list.json | Japan. Coordinates in cod as ISO 6709 (+lat+lon-depth_m/) |

Merging (src/lib/quakes/merge.ts): two events are the same if within 90 s and 100 km. The regional
authority wins inside its region (JMA in Japan, GeoNet in New Zealand), otherwise USGS, then EMSC.
Always credit sources in the UI. Verify each provider's terms of use before launch.

Plate boundaries: PB2002 (Bird, 2003) via github.com/fraxen/tectonicplates — bundled as app/public/data/plate-boundaries.json (ODC-BY; credit shown on the map when plates are on).

Place names ("27 km SSE of Uyuni" for events whose source gives only a region name, e.g. EMSC): GeoNames places with
more than 1,000 people (cities1000, CC BY 4.0, republished by the npm package cities.json) — bundled server-only as
app/src/lib/quakes/towns.json, built by app/scripts/build-towns.mjs; used by app/src/lib/quakes/nearest-place.ts (the
nearest town within 300 km in the event's own country, else any country). Credited in the site footer and Me → Data
sources. Refresh now and then: `npm pack cities.json`, unpack, rerun the script.

Lakes: Natural Earth 1:50m lakes (public domain) — bundled as app/public/data/lakes.json, built by app/scripts/build-lakes.mjs.

Place search: Nominatim (OpenStreetMap data, ODbL) via app/src/app/api/places — search on submit only (no search-as-you-type), ≤ 1 request/s per server instance, results cached for a week, "© OpenStreetMap contributors" shown under the results. The public Nominatim service is for low volume; if usage grows, switch to a hosted geocoder by adding an adapter in app/src/lib/places.ts.

Automatic felt maps (app/src/lib/feltmap.ts, /api/presence, /api/felt-map): built from sisma's own app activity — approximate positions (blurred ≤ 500 m on the device, no identifiers) sent while the app is open with location allowed. Per event: positions within the felt radius in the 180 s after the origin time vs the hour before, ~10 km cells, ≥ 3 people, surge ≥ 2. Raw positions deleted after 7 days. An estimate, not an intensity product.

Pacific Fire Ribbon (Science → Pacific Fire Ribbon, sisma+; docs/fire-ribbon.md): earthquakes from the USGS summary feeds of all earthquakes (all_day / all_week / all_month, GeoJSON plus the CSV for uncertainties), downloaded at most once an hour per period. The reference route is built from the Smithsonian Global Volcanism Program's Volcanoes of the World catalogue (Holocene volcanoes, GVP web services, accessed 26 Nov 2026), extracted to app/src/lib/ribbon/gvp-arcs.json and turned into app/src/lib/ribbon/route.json by app/scripts/build-ribbon-route.mjs. Both sources are credited on the page.
Volcanoes on the ribbon (step 2): the GVP Holocene volcanoes and Holocene eruptions layers (daily) and the Smithsonian / USGS Weekly Volcanic Activity Report RSS (hourly) for each volcano's status this week; credited on the page.
