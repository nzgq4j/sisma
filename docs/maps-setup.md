# Street-level map (MapTiler)

The Map tab and the desktop dashboard map draw sisma's own world outlines down to about 300 km across a phone screen
(the region view). Zooming in further fades in MapTiler street tiles (web zoom 6.5 → 7.5) and allows zooming on to
street level (web zoom 18). Event markers stay the same size on screen at every zoom. Code: `lib/tiles.ts`,
`components/dash/WorldMap.tsx`.

Without a key, the map works as before (no street tiles, maximum zoom unchanged).

## Setup (once)

1. Sign up at **cloud.maptiler.com** and choose a plan that allows **commercial use** (sisma has paid plans).
2. **Account → API keys → Create key** (or use the default key). Under the key's **Allowed HTTP origins**, add
   `https://sisma.io` and `https://*.vercel.app` (previews), so the key only works on sisma's pages. The key is public
   by design: it is visible in the browser.
3. Check the map style IDs under **Maps**: the app uses `streets-v2` (light) and `streets-v2-dark` (dark) by default.
4. **Vercel → sisma → Settings → Environment Variables** (Production and Preview):
   - `NEXT_PUBLIC_MAPTILER_KEY` = the key
   - optional: `NEXT_PUBLIC_MAPTILER_STYLE` / `NEXT_PUBLIC_MAPTILER_STYLE_DARK` to use other styles
5. Redeploy.

Credit: "© MapTiler © OpenStreetMap contributors" shows under the zoom buttons whenever tiles are visible (required by
MapTiler and the OpenStreetMap licence). MapTiler is listed in the privacy policy as a provider.

Usage: each zoomed-in view loads roughly 10–40 tiles (with 2× tiles on high-density screens). Watch **Analytics** in
MapTiler Cloud after launch.
