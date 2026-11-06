# Google Play store listing (en-US)

Paste into Play Console → Grow users → Store presence → Main store listing.

## App name (30 max)

Sisma - Earthquake Monitoring

## Short description (80 max, 75 used)

Live earthquakes worldwide on a feed, map and 3D globe, with custom alerts.

## Full description (4000 max)

sisma shows earthquakes around the world as they are reported, merged from four seismic agencies: USGS, EMSC, GeoNet (New Zealand) and JMA (Japan). The same event reported by several agencies appears once.

FEED
• Sort by latest, nearest or strongest
• Magnitude, depth, distance from you and time for every event
• Tap an event for the full details, its location on the map and a share card

MAP AND GLOBE
• World map centred on where you are, with plate boundaries
• Zoom from the whole world down to street level
• 3D globe you can spin, with a depth view that shows how deep each earthquake was
• Filter by time range, magnitude, country or world region

I FELT IT
• Report what you felt in the first hours after an earthquake
• See where other people felt it, shown only as anonymous counts by area

SCIENCE
• Seven illustrated articles: plate tectonics, fault types, seismic waves, magnitude and intensity, depth, tsunamis, and how to prepare

SISMA+ (optional subscription)
• Push alerts with your own minimum magnitude, places and radius, countries or regions, and quiet hours (up to 5 alert rules)
• Up to 10 saved locations
• Full history beyond 30 days
• Advanced filters: depth, magnitude, felt and tsunami
• 7-day free trial for new subscribers, then monthly or yearly. Cancel any time in Google Play.

Everything else is free, with no ads.

Available in English, Spanish, Japanese, Indonesian, Turkish, Italian, Portuguese, Chinese, French and German. Light and dark themes.

IMPORTANT
sisma is not an official warning service and does not provide earthquake early warnings. Always follow the instructions of your local authorities.

Privacy policy: https://sisma.io/privacy
Terms of service: https://sisma.io/terms
Help and how-to guides: https://sisma.io/help
Support: support@sisma.io

## Contact details

Play Console → Grow users → Store presence → Store settings → Store listing contact details.

| Field | Value |
|---|---|
| Email | support@sisma.io |
| Website | https://sisma.io/help |

## Graphics

Upload from `sisma-play-store-<locale>.zip` (one per language; build below). Each zip holds:

| Folder / file | Play Console field | Size |
|---|---|---|
| feature-graphic.jpg | Feature graphic | 1024 × 500 |
| phone/01…08 | Phone screenshots | 1080 × 1920 |
| tablet-7in/01…08 | 7-inch tablet screenshots | 1200 × 1920 |
| tablet-10in/01…08 | 10-inch tablet screenshots | 1250 × 2000 |

App icon: icon-512.png (512 × 512). All images are JPEG (no transparency), under 1 MB each.

Screen order: 1 feed (strongest; 10-inch: Overview) · 2 event details · 3 world map · 4 region view · 5 globe ·
6 globe depth view · 7 science article · 8 sisma+. Each screenshot shows the app in that language over backdrop.webp, in
a phone or tablet frame, under a two-line headline (white, then sisma violet) from store-text.json. Phone and 7-inch
tablets show the phone layout (360 × 640 and 600 × 960 CSS px); 10-inch tablets the wide layout (1024 × 1638).

Build (screens use the 26 Oct – 2 Nov 2026 earthquakes with the times moved forward so the newest is 25 minutes old;
location Tokyo; miles for English, kilometres otherwise; times in UTC; dark theme):

1. In app/: `npm run build`, then `npx next start -p 3100` with that data.
2. `NODE_PATH=$(npm root -g) node mobile/store/capture-screens.mjs` → out/screens/ (Japanese and Chinese need
   fonts-noto-cjk installed).
3. `NODE_PATH=$(npm root -g) node mobile/store/compose-store.mjs` → out/store/<locale>/ and out/zips/.

Pass locale codes to either script to build only those. out/ is not committed.
