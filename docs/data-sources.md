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

Lakes: Natural Earth 1:50m lakes (public domain) — bundled as app/public/data/lakes.json, built by app/scripts/build-lakes.mjs.

Place search: Nominatim (OpenStreetMap data, ODbL) via app/src/app/api/places — search on submit only (no search-as-you-type), ≤ 1 request/s per server instance, results cached for a week, "© OpenStreetMap contributors" shown under the results. The public Nominatim service is for low volume; if usage grows, switch to a hosted geocoder by adding an adapter in app/src/lib/places.ts.
