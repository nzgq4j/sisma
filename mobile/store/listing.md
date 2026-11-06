# Google Play store listing (en-US)

Paste into Play Console → Grow users → Store presence → Main store listing.
Translations of the short and full description: listings/<locale>.md (es, ja, id, tr, it, pt, zh, fr, de), pasted under
Main store listing → Manage translations. The help centre is English, so the translated help links say so.

## App name (30 max)

Sisma - Earthquake Monitoring

Suggested, with the words people search for (30 used): sisma: Earthquake Map & Alerts

## Short description (80 max, 69 used)

Live earthquake tracker: map, 3D globe and alerts for quakes near you

## Full description (4000 max, 2777 used)

Felt a tremor? Open sisma to see what just happened, where, and how strong.

sisma is a live earthquake tracker for the whole world. It brings together reports from four seismic agencies, USGS, EMSC, GeoNet and JMA, so each earthquake appears once, with its magnitude, depth, time and distance from you. Follow seismic activity from Japan, Indonesia and the Philippines to Turkey, Italy, Greece, California, Mexico, Chile and New Zealand.

WHAT JUST SHOOK?
• A live feed of earthquakes, sorted by latest, nearest or strongest
• Magnitude, depth, time and distance for every event, with its country and whether it has been reviewed
• Region view zooms in on any quake and shows the others nearby, so you can follow aftershocks
• On tablets, an overview with daily activity, quakes by magnitude and the most active regions

LIVE EARTHQUAKE MAP AND 3D GLOBE
• A world map centred on you, with tectonic plate boundaries
• Zoom from the whole planet down to street level
• Spin a 3D globe, then switch to depth view to see how deep each quake struck
• Filter by time range and place

DID YOU FEEL IT?
• Report the shaking you felt in the first hours after an earthquake
• See where others felt it on a felt map, shown only as anonymous counts by area

SHARE WHAT HAPPENED
• Share any earthquake as a picture with a map of the area, plus ready-written post text and image description that you can edit

UNDERSTAND EARTHQUAKES
• Seven illustrated guides: plate tectonics, fault types, seismic waves, magnitude and intensity (and how they relate to the Richter scale), depth, tsunamis, and how to prepare

SISMA+ (OPTIONAL SUBSCRIPTION)
• Earthquake alerts on your phone: a push notification when a quake matches your rules
• Set a minimum magnitude, a distance from your places, or countries and world regions; up to 5 alert rules
• Quiet hours, with the option to still hear about major quakes
• Up to 10 saved locations (1 on the free plan)
• Up to a year of earthquake history (the free plan shows the last 30 days)
• Magnitude and world-region filters
• 7-day free trial for new subscribers, then monthly or yearly. Cancel any time in Google Play.

Everything else is free, with no ads.

Available in English, Spanish, Japanese, Indonesian, Turkish, Italian, Portuguese, Chinese, French and German, in light and dark themes.

Data: USGS (U.S. Geological Survey), EMSC (European-Mediterranean Seismological Centre), GeoNet (New Zealand) and JMA (Japan Meteorological Agency).

IMPORTANT
sisma is not an official warning service and does not provide earthquake early warnings. Always follow the instructions of your local authorities.

Help and guides: https://sisma.io/help
Privacy policy: https://sisma.io/privacy
Terms of service: https://sisma.io/terms
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
