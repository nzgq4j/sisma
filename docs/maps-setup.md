# Street-level map (OpenStreetMap)

The Map tab and the desktop dashboard map draw sisma's own world outlines down to about 300 km across a phone screen
(the region view). Zooming in further fades in OpenStreetMap's standard map tiles (web zoom 6.5 → 7.5) and allows
zooming on to street level (web zoom 18). Event markers stay the same size on screen at every zoom. In dark mode the
tiles are darkened with a colour filter (OSM has no dark style). Code: `lib/tiles.ts`, `components/dash/WorldMap.tsx`.

No account or key is needed.

## OpenStreetMap tile usage policy

The tiles come from servers run by the OpenStreetMap Foundation with volunteer support
(https://operations.osmfoundation.org/policies/tiles/). sisma follows its requirements:

- The credit "© OpenStreetMap contributors" (linked to openstreetmap.org/copyright) shows in the bottom-right
  corner of the map whenever tiles are visible, kept just above the filter panel or event card (`--map-bottom-inset`,
  set by the Map page).
- Only the tiles in view at the current zoom are requested: no prefetching or bulk downloading.
- Browsers send a Referer and use their normal cache.

The policy gives no service guarantee and allows the Foundation to block heavy use without notice, which can apply to
a distributed app as it grows. If that happens, or ahead of it:

- Turn street tiles off at once: Vercel env `NEXT_PUBLIC_STREET_TILES=off`, then redeploy (the map keeps working
  with its own outlines and the previous maximum zoom).
- Move to a provider meant for apps: OpenFreeMap (free, OSM data, vector tiles) or a paid host such as MapTiler or
  Stadia Maps. Only `osmTileUrl()` in `lib/tiles.ts` and the credit in `WorldMap.tsx` change.

The OpenStreetMap Foundation is listed in the privacy policy (the browser loads tiles directly, so OSM receives the
viewer's IP address and the map area).
