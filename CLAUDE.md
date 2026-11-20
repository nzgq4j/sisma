# Instructions for Claude Code

Read README.md, then design/SismaApp.dc.html top to bottom. It is the visual and behavioural spec:
colours, spacing, radii, copy keys, sheet flows, map/globe rendering and the science canvases.
Recreate it in React components under app/src — match it, do not copy its internal structure.

## First step
Rename app/src/app/app/science/-slug-/ to app/src/app/app/science/[slug]/ (the export tool can't write brackets).

## Rules
- Every user-facing string comes from src/i18n/messages/<locale>.json via useT(). Add keys to en.json
  first, then all 9 other locales in the same change. Run npm run check:i18n.
- Science article text: English in src/content/science.json, translations in src/content/science/<locale>.json
  (intro, sections, kit; same order and count, read through lib/science.ts). Any change to an article updates all
  10 languages in the same PR; check:i18n fails when a translation is missing or out of step.
- Entitlement checks go through src/lib/entitlements.ts (client) and public.effective_plan() (server/DB).
  Never trust the client for paid features; /api routes re-check.
- Colours come from src/lib/theme.ts / CSS variables in globals.css. Magnitude colours use MAG_SCALE only.
- Quake data is always the normalised Quake type (src/lib/quakes/types.ts). New sources = new adapter + test.
- Mobile first: 360-412 px widths, 44 px touch targets, env(safe-area-inset-*) padding.
- sisma is not an official warning service; keep the disclaimer on Me and the site footer.
- Selectors and pop-ups use components/Sheet.tsx (as in the polar lights app: swipe down, double tap away from
  controls, tap outside or Escape to close). Lists of choices use SheetOptions; no native <select> in the UI.
- Keep the help centre current: any change users can see (feature, wording, button, flow, price, plan limit) updates
  the matching topic in src/app/help/topics.tsx and in all 9 translations (src/app/help/i18n/<locale>.tsx, same
  structure; app labels exactly as in messages/<locale>.json; help-i18n.test.ts checks the structure) in the same PR.
  When a pictured screen changes, retake its screenshots in both themes and every language with scripts/help-shots.mjs
  (--locale=all; public/help/<name>-<theme>.webp and public/help/<locale>/…) and check them.

## Suggested build order
1. App shell /app/layout.tsx + BottomNav + top app bar + Sheet (done as scaffolds — polish to the design)
2. Feed (scaffolded): nearest card, sort segmented control, rows, detail sheet; filters in the pull-up FilterPanel (fixed mode)
   Region filter (sisma+): world regions (lib/world-regions.ts: country within 800 km, else ocean) — one setting in
   QuakeData for Feed, Map, Globe and dashboard (RegionFilterChip). Magnitude badges use the pin colours (--mag-N)
3. Felt report sheet (done): "I felt it" on quakes < 6 h old (lib/quakes/report-window.ts), quick → details → thanks
   (components/FeltReport.tsx), POST /api/reports re-checks the quake and the window. "Show on the map" switch places the report
   (~10 km cell) at the device position, else the place chosen in Me, within 3,000 km; the region view card counts every
   report (GET /api/reports: total, MMI range, cells) and says how many are on the map.
   Felt sources (done), all drawn as ONE grid of ~10 km intensity-coloured squares (lib/felt-grid.ts: report-weighted mean MMI
   per 0.1° cell; automatic felt map areas without a report = grey FELT_NEUTRAL "intensity unknown") with an intensity-only
   legend: sisma reports, USGS "Did You Feel It?" (GET /api/dyfi → lib/quakes/dyfi.ts: dyfi_geo_10km.geojson, else
   cdi_geo.txt), EMSC felt reports (GET /api/emsc-felt → lib/quakes/emsc-felt.ts: testimonies-ws zip grouped into 0.1° cells
   on the server, never individual positions; CC BY 4.0: credited in the data line, web.footer: Me and site footers)
   Layers sheet (done): button beside "Back to world map": one Felt maps switch (localStorage sisma.feltMaps); plate
   boundaries stay in the world map's pull-up panel; "How felt maps work" is in the sheet
   Share card felt cells (done): lib/share-felt.ts loads the sources on the server (4 s limit each), lib/share-map.ts draws the
   same grid; legend = intensity steps (+ grey); X-Felt-Layers (intensity, unknown) → alt text
   Todo: rate limiting, show felt_summary
   Tsunami alerts (done): official messages from PTWC, NTWC (tsunami.gov Atom + CAP, lib/tsunami/noaa.ts) and JMA
   (bosai/tsunami list + detail, lib/tsunami/jma.ts), stored in tsunami_messages by the per-minute job (lib/tsunami/poll.ts;
   the feeds only carry the latest bulletin); the latest message per incident is matched to its quake (JMA by event id,
   NOAA within 120 s and 300 km, lib/tsunami/alerts.ts) and served as Quake.tsunamiAlert by GET /api/quakes. Shown in the
   detail / summary banner and region view card (components/Tsunami.tsx), row icon and a wave badge on map and globe pins
   (--tsu-warning / threat / watch; information statements and forecasts stay neutral). Push (lib/tsunami/push.ts): warnings,
   threats, watches and advisories to everyone signed in, free or sisma+, with notifications on, the Tsunami alerts switch
   in Me (profiles.tsunami_push) and a saved place within 1,000 km (public.tsunami_recipients); once per incident and level
   (tsunami_deliveries); quiet hours don't apply. USGS's tsunami flag alone only says to check official information
   Share card + Bluesky (done): lib/tsunami/attach.ts withTsunami() adds the alerts wherever quakes are served or drawn
   (GET /api/quakes, /api/share-card, the alert job, admin Bluesky routes); the card draws a pill at the top left of the map
   (tsunamiLine, lib/tsunami/text.ts; level colour while in effect, beside "other events" or on its own row); the share sheet
   adds the line to the post and alt text; Bluesky posts add it (+ #tsunami while in effect) and describe the pill in the alt
   Tsunami reports always get a Bluesky post (lib/bluesky.ts): quakes with an alert bypass the minimum magnitude and go first;
   each new report per event (tsunamiKey: incident | level | cancelled) not yet carried by a post gets its own post
   (draftTsunamiPost, row "tsunami:<key>" in bluesky_posts, tsunami_key column); none older than 3 h when first seen
   Automatic felt map (done): anonymous blurred app-activity pings (components/FeltMap.tsx → POST /api/presence) →
   GET /api/felt-map heatmap in Show region (lib/feltmap.ts; 180 s window, ≥ 3 people per ~10 km cell; Me toggle)
4. Map tab (done): d3-geo Mercator rotated to the user's longitude, d3-zoom, plate boundaries toggle — components/dash/WorldMap.tsx
   Filters + layers + legend in a pull-up panel (components/stage/FilterPanel.tsx, peek / half / full like polar lights);
   choosing a world region zooms the map (lib/world-regions.ts REGION_VIEW) and turns the Globe to face it
   Region view (/app/map?focus=<id>): ~7.5° across the shorter side, pulsing focus marker, callouts for nearby events,
   1:50m coastlines when zoomed in. Share = portrait PNG card from GET /api/share-card (lib/share-map.ts, components/ShareCard.tsx) with editable post
   text + alt text (lib/share-text.ts: post built from fragments, empty ones dropped, link last; card headline shrinks to one
   line); Share link fallback where files can't be shared; Android app shares through the system sheet (@capacitor/share +
   filesystem, lib/native-share.ts)
   Street level: OpenStreetMap tiles fade in from web zoom 6.5–7.5 up to 18 (lib/tiles.ts; NEXT_PUBLIC_STREET_TILES=off
   disables; docs/maps-setup.md for the OSM tile policy). Events are drop pins of one size in screen pixels, filled by
   band (--mag-0…5: MAG_MARKER_LIGHT in light mode, MAG_SCALE in dark) with the magnitude in the head (--mag-ink-N);
   a tap picks the nearest pin within ~22 px
   My location button (map tools; globe zoom pill): device position via AppState.locateHere (asks for access, leaves the
   chosen location as it is), glides / turns there and zooms in; a ringed dot marks it when another place is chosen in Me
5. Globe tab (done): canvas orthographic, drag-rotate, auto-spin, Depth mode (radial lines scaled by depth) — components/Globe.tsx
   Events are the same numbered pins as the maps (lib/pin.ts; Depth mode fills them by depth), drawn from cached sprites
6. Science (done): list + article with the four canvas visuals (plates, faults, waves, tsunami) and the
   magnitude / depth / preparedness widgets — components/science/. Article text in all 10 languages (content/science.json
   + content/science/<locale>.json, lib/science.ts); SEO titles and descriptions stay English
   The Ring of Fire article has a live widget: the period's M4.5+ events on a Pacific-centred map, counted on / off the
   Ring (rough outline in lib/ring-of-fire.ts, tested); its social card is public/og/science-ring.jpg (og-cards.mjs)
   In Depth library (/app/science/in-depth, linked from the Science list): long-form, sourced articles — English text, SEO
   title/description and references in content/library.json, translations (title, dek, sections, FAQ; same counts) in
   content/library/<locale>.json loaded per language (lib/library.ts). Static pages with Article + FAQPage + breadcrumbs
   JSON-LD, sitemap lastModified, share cards public/og/library[-<id>].jpg (og-cards.mjs). The 10-language rule applies;
   references stay English. Facts and citations must be checked before publishing
   Data (/app/science/data, sisma+, linked from the Science list): live charts of the USGS M4.5+ month feed (activity 24 h /
   7 d / 30 d, magnitudes, depth classes, world regions + Ring of Fire share, cumulative energy) and M7+ per year since 1900
   (USGS FDSN CSV), each with a short explanation; aggregation in lib/seismic-stats.ts (tested), GET /api/science/data
   re-checks the plan (403 plus_required); charts in components/science/DataCharts.tsx (SVG, tap readout, sr-only tables)
   Colours: time charts mint (--chart), above the average coral (--chart-hot) with the dashed average line; magnitudes --mag-N;
   depths depthColor (globe Depth mode); regions --mag-2 when most of their events are on the Ring of Fire, else --ink2
7. Me / account dashboard (skeleton done: app/app/me): email + password (sign-in, sign-up, reset, change; no email-link sign-in) and Google sign-in (components/Account.tsx, lib/oauth.ts;
   Google button shows when the provider is on in Supabase; Android: in-app account picker via @capgo/capacitor-social-login →
   signInWithIdToken with a nonce; Android OAuth clients per signing key, docs/android-setup.md §4), profile + plan, alerts saved to
   alerts (sisma+: master switch on alert_settings, up to 5 alert_rules at app/me/alerts — name, minimum magnitude, saved places + radius, countries/regions, quiet hours, 30-day match chart in alerts/rule; alert history from alert_deliveries), language, appearance (components/Theme.tsx), delete account (DELETE /api/account), saved locations (Supabase
   saved_locations for accounts, localStorage for guests, moved into the account on sign-in) with place search (GET /api/places →
   Nominatim, lib/places.ts; search on submit only, credit OpenStreetMap). Subscription page (done): app/me/subscription — status,
   price, next date; Stripe customer portal via POST /api/stripe/portal, Google Play link for app purchases
8. Billing (done): Stripe Checkout + webhook (web); Google Play Billing in the Android app (@capgo/native-purchases,
   lib/play-client.ts → POST /api/play/verify, Pub/Sub notifications → POST /api/play/rtdn, lib/play.ts;
   docs/play-billing-setup.md); paywall sheet with trial-or-subscribe, restore and the post-payment activation step
   (components/Paywall.tsx); lib/billing.ts for trial eligibility and running subscriptions
9. Push: FCM via @capacitor/push-notifications; supabase edge function matches new quakes to alert_rules (done as POST /api/cron/alerts, lib/alerts/match.ts matchRules)
10. Service worker (todo) + manifest (done: app/manifest.ts, icons from components/Logo.tsx); iOS Add to Home Screen prompt (done: components/InstallPrompt.tsx,
    iPhone / iPad browser only, once after onboarding, Not now = 14 days, Got it = never again; web push on iOS needs it), Play Store assets (done: mobile/store/ — listing text, icon, feature graphic, phone
    screenshots, release notes)
    SEO (done): lib/seo.ts — title, description, canonical and a social card per topic (home, feed, map, globe, science and
    each article) in app/public/og/, rebuilt with app/scripts/og-cards.mjs; robots.ts, sitemap.ts; account pages noindex
    Indexing (done, docs/search-setup.md): JSON-LD structured data (lib/structured-data.tsx: Organization, WebSite, app,
    Article / TechArticle + breadcrumbs), webmaster verification tags from env (siteVerification in lib/seo.ts), IndexNow
    key + scripts/indexnow.mjs, X-Robots-Tag noindex on hosts other than sisma.io (next.config.ts)
    Help centre (done): /help hub (popular questions, all topics, contact) and one page per topic at /help/<slug>
    (app/help/topics.tsx; translations app/help/i18n/<locale>.tsx loaded per language by help-i18n.ts, the server
    renders English; HelpChrome: sticky header with Back, topic sidebar on wide screens, prev / next).
    Follows light / dark through the theme tokens; screenshots in app/public/help/ come in -light and -dark versions
    (scripts/help-shots.mjs). Linked from Me → Account and the site footer; old /help#anchors redirect to their topic
11. Splash (done: components/splash/Splash.tsx, once per session, hands over from the Android launch screen; mobile/assets/splash*.png)
12. Onboarding (v1 done: components/onboarding/): welcome, language, location primer, disclaimer. Alerts step waits for 8 + 9.
    Spec and status: docs/onboarding.md
13. Administration (done: app/me/admin, profiles.is_admin checked by lib/admin.ts on every /api/admin request): automatic
    Bluesky posts of significant earthquakes with the share card, alt text and link (lib/bluesky.ts, run by the alert job;
    sign in to Bluesky on the page (session in Supabase Vault, password never stored; env is the fallback), on/off,
    minimum magnitude, preview, Post now, log); In Depth articles posted by hand with editable text, hashtags and alt text
    (components/admin/LibraryBluesky.tsx, /api/admin/bluesky/library; also a Bluesky button on articles for administrators); daily Play Store posts
    (lib/promo.ts: 10 posts × 10 languages in content/promo/, store pictures in public/promo/, one a day at a random time, no
    repeat until all 100 are used; components/admin/PromoPosts.tsx with Post now and recent posts; /api/admin/promo); admin-only English guide at
    app/me/admin/guide, linked from the top of the admin page — keep it current with admin changes). The card is drawn in-process (lib/share-card.tsx); a new event waits up to
    15 min for its card, then posts as text. docs/bluesky-setup.md
