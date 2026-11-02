# Onboarding workflow (backlog)

Status: **backlog — not started.** Tracked in the GitHub issue "Onboarding workflow". Build after Me (step 7) and
alongside Push (step 9) in CLAUDE.md's build order, because two of its steps depend on them.

## Why

Today a first-time visitor sees the splash and lands straight in the Feed, and the browser's location prompt appears
immediately with no explanation (`AppState.tsx` calls `navigator.geolocation` on load). People who decline get
distances from the default location without knowing why. Onboarding should explain what sisma is, ask for location
with context, set language, and make the "not an official warning service" disclaimer explicit before anyone relies
on the app.

## Flow

Shown once, after the splash, on the first visit to `/app` (web, PWA and the Android app). Full-screen on phones,
a centred card (max 520 px) on desktop. Every step has **Skip** (top right) and a progress indicator (dots).
Back is allowed; swipe left/right on phones; Escape skips on desktop.

| # | Step | Content | Action |
| - | ---- | ------- | ------ |
| 1 | Welcome | Logo, "Earthquakes, live and explained", three short points: live data from USGS · EMSC · GeoNet · JMA; Map and Globe; Science explainers | Continue |
| 2 | Language | Detected language preselected; the LanguageSheet list inline (same rows, flags and check mark) | Continue (saves `sisma.locale`) |
| 3 | Your location | Why: nearest quakes, distances, "Did you feel it?" reports. Privacy: used on the device; reports are rounded to ~10 km | **Use my location** (system prompt only now) · **Choose a place** (search sheet, saved as the primary location) · Not now |
| 4 | Alerts | What sisma+ alerts do (magnitude + radius). Free users see the plan comparison and "Try sisma+"; on Android, notification permission is requested only after they opt in | Turn on alerts · Maybe later |
| 5 | Important | "sisma is not an official warning service. Follow your local civil protection authority." Link to the authority list for the detected country | **I understand** (required to finish; not skippable) |

Finish lands on the Feed with the nearest-quake card focused.

## Rules

- **Once per device:** `localStorage['sisma.onboarded'] = <version>`; signed-in users also store it on `profiles`
  (new column `onboarded_version smallint`, written through the existing "own profile prefs" grant). Bumping the
  version re-shows only the new or changed steps.
- **Location prompt:** remove the automatic `getCurrentPosition` call from `AppState.tsx`; request only from step 3,
  or later from Me → Saved locations. A returning user who already granted permission keeps working without prompting.
- **Skip** finishes onboarding (marks it as done) but still shows step 5 once.
- **Deep links** (`/app/map?focus=…`, shared quake links) skip onboarding on the first visit and show it on the next
  plain app open, so a shared link opens straight to its content.
- **Re-run** from Me → "Show introduction".
- **Components:** `components/onboarding/` (Onboarding.tsx, steps, CSS module); choice lists use SheetOptions, and
  pickers use Sheet — no native `<select>`.
- **i18n:** all copy under a new `onboard` namespace in en.json, then all 9 other locales in the same change; run
  `npm run check:i18n`.
- **Accessibility:** focus moves to each step's heading; dots are announced as "Step 2 of 5"; 44 px targets;
  `prefers-reduced-motion` turns the slide transition into a fade; safe-area insets on all edges.
- **Entitlements:** step 4 reads the plan through `src/lib/entitlements.ts`; starting a trial goes through the paywall
  sheet / Checkout, never directly from the client.

## Acceptance criteria

1. A first visit to `/app` shows the splash, then step 1. A second visit goes straight to the Feed.
2. No location prompt appears before step 3. Declining or choosing "Not now" leaves the app usable with the default
   location and a "Set your location" hint on the nearest card.
3. A language chosen in step 2 applies immediately and persists across reloads and into auth emails (`locale`
   metadata, see docs/supabase-setup.md §4).
4. Step 5 can't be skipped; the disclaimer still also shows on Me and the site footer.
5. Works at 360–412 px, at 1024 px and up, in light and dark mode, and in all 10 locales without truncation
   (use FitLine where needed).
6. Playwright test: first-run flow, skip, deep-link bypass, and re-run from Me.

## Dependencies

- Me tab, saved locations and place search (build step 7) — for "Choose a place" and "Show introduction".
- Push (step 9) and billing (step 8) — for step 4. Until they exist, step 4 is hidden.
- Accounts — only for syncing `onboarded_version`; device storage works without them.
