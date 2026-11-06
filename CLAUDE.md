# Instructions for Claude Code

Read README.md, then design/SismaApp.dc.html top to bottom. It is the visual and behavioural spec:
colours, spacing, radii, copy keys, sheet flows, map/globe rendering and the science canvases.
Recreate it in React components under app/src — match it, do not copy its internal structure.

## First step
Rename app/src/app/app/science/-slug-/ to app/src/app/app/science/[slug]/ (the export tool can't write brackets).

## Rules
- Every user-facing string comes from src/i18n/messages/<locale>.json via useT(). Add keys to en.json
  first, then all 9 other locales in the same change. Run npm run check:i18n.
- Entitlement checks go through src/lib/entitlements.ts (client) and public.effective_plan() (server/DB).
  Never trust the client for paid features; /api routes re-check.
- Colours come from src/lib/theme.ts / CSS variables in globals.css. Magnitude colours use MAG_SCALE only.
- Quake data is always the normalised Quake type (src/lib/quakes/types.ts). New sources = new adapter + test.
- Mobile first: 360-412 px widths, 44 px touch targets, env(safe-area-inset-*) padding.
- sisma is not an official warning service; keep the disclaimer on Me and the site footer.
- Selectors and pop-ups use components/Sheet.tsx (as in the polar lights app: swipe down, double tap away from
  controls, tap outside or Escape to close). Lists of choices use SheetOptions; no native <select> in the UI.
- Keep the help centre current: any change users can see (feature, wording, button, flow, price, plan limit) updates
  the matching topic in src/app/help/topics.tsx in the same PR. When a pictured screen changes, retake its screenshots
  in both themes with scripts/help-shots.mjs (<name>-light.webp and <name>-dark.webp in public/help/) and check them.

## Suggested build order
1. App shell /app/layout.tsx + BottomNav + top app bar + Sheet (done as scaffolds — polish to the design)
2. Feed (scaffolded): nearest card, sort segmented control, rows, detail sheet; filters in the pull-up FilterPanel (fixed mode)
   Region filter (sisma+): world regions (lib/world-regions.ts: country within 800 km, else ocean) — one setting in
   QuakeData for Feed, Map, Globe and dashboard (RegionFilterChip). Magnitude badges use the pin colours (--mag-N)
3. Felt report sheet (done): "I felt it" on quakes < 6 h old (lib/quakes/report-window.ts), quick → details → thanks
   (components/FeltReport.tsx), POST /api/reports re-checks the quake and the window. Todo: rate limiting, show felt_summary
   Automatic felt map (done): anonymous blurred app-activity pings (components/FeltMap.tsx → POST /api/presence) →
   GET /api/felt-map heatmap in Show region (lib/feltmap.ts; 180 s window, ≥ 3 people per ~10 km cell; Me toggle)
4. Map tab (done): d3-geo Mercator rotated to the user's longitude, d3-zoom, plate boundaries toggle — components/dash/WorldMap.tsx
   Filters + layers + legend in a pull-up panel (components/stage/FilterPanel.tsx, peek / half / full like polar lights);
   choosing a world region zooms the map (lib/world-regions.ts REGION_VIEW) and turns the Globe to face it
   Region view (/app/map?focus=<id>): ~7.5° across the shorter side, pulsing focus marker, callouts for nearby events,
   1:50m coastlines when zoomed in. Share = portrait PNG card from GET /api/share-card (lib/share-map.ts, components/ShareCard.tsx) with editable post
   text + alt text; Android app shares through the system sheet (@capacitor/share + filesystem, lib/native-share.ts)
   Street level: OpenStreetMap tiles fade in from web zoom 6.5–7.5 up to 18 (lib/tiles.ts; NEXT_PUBLIC_STREET_TILES=off
   disables; docs/maps-setup.md for the OSM tile policy). Events are drop pins of one size in screen pixels, filled by
   band (--mag-0…5: MAG_MARKER_LIGHT in light mode, MAG_SCALE in dark) with the magnitude in the head (--mag-ink-N);
   a tap picks the nearest pin within ~22 px
5. Globe tab (done): canvas orthographic, drag-rotate, auto-spin, Depth mode (radial lines scaled by depth) — components/Globe.tsx
   Events are the same numbered pins as the maps (lib/pin.ts; Depth mode fills them by depth), drawn from cached sprites
6. Science (done): list + article with the four canvas visuals (plates, faults, waves, tsunami) and the
   magnitude / depth / preparedness widgets — components/science/. Article text is English only (content/science.json)
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
10. Service worker (todo) + manifest (done: app/manifest.ts, icons from components/Logo.tsx), Play Store assets (done: mobile/store/ — listing text, icon, feature graphic, phone
    screenshots, release notes)
    SEO (done): lib/seo.ts — title, description, canonical and a social card per topic (home, feed, map, globe, science and
    each article) in app/public/og/, rebuilt with app/scripts/og-cards.mjs; robots.ts, sitemap.ts; account pages noindex
    Help centre (done): /help hub (popular questions, all topics, contact) and one page per topic at /help/<slug>
    (app/help/topics.tsx, English; HelpChrome: sticky header with Back, topic sidebar on wide screens, prev / next).
    Follows light / dark through the theme tokens; screenshots in app/public/help/ come in -light and -dark versions
    (scripts/help-shots.mjs). Linked from Me → Account and the site footer; old /help#anchors redirect to their topic
11. Splash (done: components/splash/Splash.tsx, once per session, hands over from the Android launch screen; mobile/assets/splash*.png)
12. Onboarding (v1 done: components/onboarding/): welcome, language, location primer, disclaimer. Alerts step waits for 8 + 9.
    Spec and status: docs/onboarding.md
13. Administration (done: app/me/admin, profiles.is_admin checked by lib/admin.ts on every /api/admin request): automatic
    Bluesky posts of significant earthquakes with the share card, alt text and link (lib/bluesky.ts, run by the alert job;
    sign in to Bluesky on the page (session in Supabase Vault, password never stored; env is the fallback), on/off,
    minimum magnitude, preview, Post now, log). The card is drawn in-process (lib/share-card.tsx); a new event waits up to
    15 min for its card, then posts as text. docs/bluesky-setup.md
