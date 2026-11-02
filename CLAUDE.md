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

## Suggested build order
1. App shell /app/layout.tsx + BottomNav + top app bar + Sheet (done as scaffolds — polish to the design)
2. Feed (scaffolded): nearest card, sort segmented control, range + region chips, rows, detail sheet
3. Felt report sheet (done): "I felt it" on quakes < 6 h old (lib/quakes/report-window.ts), quick → details → thanks
   (components/FeltReport.tsx), POST /api/reports re-checks the quake and the window. Todo: rate limiting, show felt_summary
4. Map tab (done): d3-geo Mercator rotated to the user's longitude, d3-zoom, plate boundaries toggle — components/dash/WorldMap.tsx
5. Globe tab (done): canvas orthographic, drag-rotate, auto-spin, Depth mode (radial lines scaled by depth) — components/Globe.tsx
6. Science (done): list + article with the four canvas visuals (plates, faults, waves, tsunami) and the
   magnitude / depth / preparedness widgets — components/science/. Article text is English only (content/science.json)
7. Me / account dashboard (skeleton done: app/app/me): email-link sign-in (components/Account.tsx), profile + plan, alerts saved to
   alert_settings, language, appearance (components/Theme.tsx), delete account (DELETE /api/account). Todo: saved locations in
   Supabase, place search, display name, subscription management
8. Billing: Stripe Checkout + webhook; Play Billing via a Capacitor plugin; paywall sheet (done: components/Paywall.tsx)
9. Push: FCM via @capacitor/push-notifications; supabase edge function matches new quakes to alert_settings
10. Service worker (todo) + manifest (done: app/manifest.ts, icons from components/Logo.tsx), Play Store assets
11. Splash (done: components/splash/Splash.tsx, once per session, hands over from the Android launch screen; mobile/assets/splash*.png)
12. Onboarding (v1 done: components/onboarding/): welcome, language, location primer, disclaimer. Alerts step waits for 8 + 9.
    Spec and status: docs/onboarding.md
