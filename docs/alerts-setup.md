# Earthquake alerts — how they work and what to set up

sisma+ members get a notification when a quake at or above their minimum magnitude happens within their chosen
distance of **any of their saved locations** (or anywhere, with "Global"), or anywhere in a **country or world region
they chose** (Me → Alerts → "Also alert for"; up to 20 of each, stored in `alert_settings.countries` / `regions`).
An alert for a chosen area reads "M5.4 earthquake · Japan". Each event is sent once per person, to every
device they turned notifications on for (Me → Alerts → "Turn on notifications on this device").

## How it runs

1. Every minute, Supabase's scheduler (pg_cron job `quake-alerts`) calls `POST https://sisma.io/api/cron/alerts` with a
   single-use ticket. The ticket is checked against the database, so nobody else can trigger a run, and no shared
   password has to be copied between Supabase and Vercel.
2. The route loads everyone with alerts on, an active sisma+ plan, a saved location and a device
   (`public.alert_recipients()`). If there is nobody, it stops there.
3. It reads the merged feed (USGS, EMSC, GeoNet, JMA), keeps events from the last 30 minutes and matches them
   (`lib/alerts/match.ts`). The same event under a new id (another agency's solution) is recognised and not re-sent.
4. Each match is recorded in `alert_deliveries`, then pushed in the device's language and units:
   "M5.4 earthquake · 120 km from Home" / "Japan · 10 km deep". Tapping opens the event's region view.
   Devices that no longer exist are removed automatically.

Database objects: migration `supabase/migrations/20261103000200_alerts.sql`.

## Setup (once)

### Browsers and installed web app — Web Push

1. On your own computer, in any folder: `npx web-push generate-vapid-keys`. It prints a **public** and a **private** key.
2. Vercel → sisma → Settings → Environment Variables (Production and Preview):
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = the public key (not secret)
   - `VAPID_PRIVATE_KEY` = the private key (**Sensitive**; never share it, never commit it)
   - `VAPID_SUBJECT` = `mailto:support@sisma.io`
3. Redeploy. In Me → Alerts, "Turn on notifications on this device" now works in Chrome, Edge, Firefox and Safari
   (macOS). On iPhone/iPad, web notifications only work after "Add to Home Screen" (iOS 16.4+); the app says so.

Keep the same key pair from then on: changing it means every browser has to turn notifications on again.

### Android app — Firebase Cloud Messaging

1. Firebase project and `FCM_SERVICE_ACCOUNT` in Vercel: docs/android-setup.md, step 2. (Done.)
2. `google-services.json` is in `mobile/android/app/` and the app's *versionCode* is 2 (PR "Android project"). (Done.)
3. `NEXT_PUBLIC_FCM_MIN_BUILD` = `2` in Vercel. App builds below 2 have no Firebase configuration and would crash when
   asked to register, so they show "Update the sisma app to receive alerts on this phone" instead.
4. Build and install the app (docs/android-setup.md, step 6).

### Check it

- Me → Alerts → "Send a test alert" sends one notification to the device you're on.
- Supabase → Integrations → Cron → `quake-alerts` shows each run; each run's response is in `net._http_response`.
