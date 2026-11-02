# sisma.io

Earthquake alerts and visual explanations. One Next.js codebase serves:

- **sisma.io/** — public overview website (marketing, science preview, pricing)
- **sisma.io/app** — the app (Feed · Map · Globe · Science · Me), also loaded by the Android app
- **Android** — a Capacitor shell (mobile/) that loads https://sisma.io/app, with native push and splash

Design source of truth: design/SismaApp.dc.html (app) and design/Sisma Website.dc.html (site).
Open them in a browser; they run on live USGS data.

## Layout

    app/                 Next.js (App Router, TypeScript)
      src/app/           routes: / (site), /app/* (app shell + tabs), /api/*
      src/components/    BottomNav, MagBadge, QuakeRow, Sheet
      src/lib/quakes/    source adapters (USGS, EMSC, GeoNet, JMA), normalise, merge, regions
      src/lib/           entitlements, theme tokens, site constants, geo
      src/i18n/          10 locales (messages/*.json) + provider
      src/content/       science library (science.json)
    mobile/              Capacitor 8 Android shell
    supabase/migrations/ schema: profiles, billing, saved locations, alerts, quakes cache, felt reports
    docs/                entitlements, data sources
    design/              Claude Design prototypes (reference only)

## Run

    cd app && npm install && npm run dev      # http://localhost:3000 and /app
    cd mobile && npm install && npx cap sync android && npx cap open android
    cd mobile && npx @capacitor/assets generate --android   # launcher icons and splash (splash.png, splash-dark.png) from mobile/assets/

Supabase: project `sisma` (ref `ukmvbfhfbohdlxoxlqhc`, us-east-1). Migrations in supabase/migrations are applied.
Vercel is connected to it through the Supabase integration (STORAGE_-prefixed variables, read by app/src/lib/supabase-env.ts). Full checklist (auth URLs, email templates, SMTP, …): docs/supabase-setup.md.

Copy app/.env.example to app/.env.local. Without Supabase/Stripe keys the app runs in demo mode
(local plan toggle, reports kept in memory).

## Plans

| | Free | sisma+ ($3.99 / month or $36 / year, 7-day trial) |
|---|---|---|
| Live feed, map, 3D globe, region filter, sorting | ✓ | ✓ |
| Felt reports, science library | ✓ | ✓ |
| History | 30 days | Full |
| Saved locations | 1 | 10 |
| Push alerts (custom magnitude + radius) | — | ✓ |
| Advanced filters (depth, magnitude range, felt, tsunami) | — | ✓ |

Web purchases use Stripe Checkout; Android uses Google Play Billing (required by Play policy for
in-app digital goods). Both write the same profiles.plan / subscription_status columns.
See docs/entitlements.md.
