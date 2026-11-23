# Automatic Bluesky posts — how it works and what to set up

sisma can post significant earthquakes to its Bluesky account on its own. Administrators have a short how-to in the app
at **Me → Administration → Admin guide** (`/app/me/admin/guide`, administrators only, not indexed). Administrators control it in
**Me → Administration** (shown only to accounts with `profiles.is_admin`).

## What a post contains

- **Image:** the event's share card (`GET /api/share-card`, 1080×1350 PNG, English, km, UTC).
- **Alt text:** a description of the card: the map around the epicentre (ringed dot in the magnitude colour), other earthquakes of the
  last 7 days (coloured dots), plate boundaries (dashed lines, where present), then time, depth, coordinates, source
  and "Not an official warning service".
- **Text** (at most 300 characters, English):

  ```
  M6.4 earthquake · Japan
  6 Nov, 03:01 UTC · 35 km (22 mi) deep
  Tsunami information issued: follow official warnings.      ← only when the agency flags a tsunami
  Map and details: https://sisma.io/app/map?focus=…           ← clickable link to the event's region view
  #earthquake #Japan                                          ← country tag when the event is in or near a country
  Not an official warning service
  ```

## When it posts

- The every-minute alert job (`POST /api/cron/alerts`) also runs the Bluesky step (`lib/bluesky.ts`), alongside the
  alerts so it never delays them.
- It posts events at or above the **minimum magnitude** (Me → Administration; M4.5 to M7.5, default M6.0) that
  happened in the **last 30 minutes**. Switching it on never posts a backlog.
- **One post per earthquake**: each event is claimed in `bluesky_posts` before posting. The same event reported by
  another agency (within 90 s and 100 km) is not posted again. At most 2 posts per minute, largest first.
- A failed post is recorded with Bluesky's error and is not retried automatically (to avoid repeated posts). An
  administrator can post it with **Post now**.
- **Post now** (Me → Administration → an event from the last 24 hours → Preview) posts any event by hand. The preview
  shows the exact image, text and alt text first.

## In Depth articles (posted by hand)

Administrators can post any In Depth article: **Me → Administration → In Depth on Bluesky** (pick the article from the
**Article** selector; the editor opens below it), or the **Bluesky** button
next to Share on an article (shown to administrators only). The sheet shows:

- **Image:** the article's share card, `public/og/library-<id>.jpg` (1200×630 JPEG, made by `scripts/og-cards.mjs`).
- **Text** (editable, at most 300 characters, English): the title, as much of the standfirst as fits, the link and the
  article's hashtags (`hashtags` in `content/library.json`):

  ```
  Faults and Stress: Why Earthquakes Happen

  An earthquake is the sudden release of stress that a fault has stored for decades or centuries.

  Read: https://sisma.io/app/science/in-depth/faults-and-stress

  #geology #faults #earthquake
  ```
- **Alt text** (editable, at most 2,000 characters): what the card shows, built from the title and the article's
  `cardImage` description in `content/library.json`. Update `cardImage` when a card's picture changes.

Links and #hashtags in the text as posted (also after editing) become clickable facets. `GET /api/admin/bluesky/library?id=`
returns the suggestion; `POST /api/admin/bluesky/library { id, text, alt }` posts it (both check `profiles.is_admin`).
Article posts are not recorded in `bluesky_posts` (that table is for earthquakes), so posting the same article twice
makes two posts.

## Play Store posts (daily, automatic or by hand)

Ten posts about the Android app, each written in all 10 languages with its own hashtags and image description
(`app/src/content/promo/<locale>.json`), with that language's Play Store screenshot or feature graphic
(`app/public/promo/<locale>/*.jpg`) and a link to the Play listing in that language (`&hl=`). 100 combinations in all.

- **Me → Administration → Play Store posts:** *Post daily* on/off, the time of the next post, progress this round
  (e.g. 23 of 100) and **Post now** (a random unused post and language, or choose both and see the exact post first).
  Below it, the recent Play Store posts with links.
- **Daily:** when on, the every-minute alert job (`lib/promo.ts autoPromo`) posts once a day at a random minute
  (UTC), choosing a random post and language not yet posted this round. After all 100 have been posted, the next round
  starts. Switching it on schedules the first post at a random time later the same day.
- **Post now** counts as that day's post: if the automatic post was still due later today, it moves to tomorrow.
  Choosing a combination already posted this round posts it again (the sheet says so).
- A failed post is logged with Bluesky's error; that combination stays unused and can come up again.
- Database: `promo_settings` (one row: enabled, next_at, cycle) and `promo_posts` (every post), migration
  `supabase/migrations/20261118000100_promo_posts.sql`. API: `GET/PATCH/POST /api/admin/promo` (administrators only).
- To change the wording, edit the language files and run the length check in `lib/promo.test.ts` (every post must stay
  within 300 characters including the link and hashtags). To change pictures, regenerate the store images
  (`mobile/store/compose-store.mjs`) and copy them to `app/public/promo/` at 720 × 1280 (feature graphic 1024 × 500).

## In Depth posts (twice a day, automatic or by hand)

Every In Depth article in all 10 languages: the title and standfirst from `app/src/content/library/<locale>.json`
(English: `library.json`), hashtags (every post also carries `#geosky` and `#sciencesky`, `LIBRARY_FEED_TAGS` in
`lib/bluesky.ts`, as do the English posts made by hand), the share card's image description and the alt-text wording from
`app/src/content/library-social/<locale>.json`, the share card in that language (`app/public/og/<locale>/library-<id>.jpg`;
English `app/public/og/library-<id>.jpg`) and a link that opens the article in that language (`?lang=<locale>`, which
the app applies for that visit without changing the reader's saved language). Articles × 10 combinations per round.

- **Me → Administration → In Depth posts:** *Post twice a day* on/off, the next post, progress this round and
  **Post now** (a random unused article and language, or choose both and see the exact post first), then the recent posts.
- **Twice a day:** when on, the every-minute alert job (`lib/library-posts.ts autoLibraryPost`) posts at a random minute
  in each half of the UTC day (00:00–12:00, 12:00–24:00), choosing a random article and language not yet posted this
  round. When every combination has been posted, the next round starts. A new article joins the current round.
- **Post now** counts as the post for that half-day: if the automatic post was still due in the same half, it moves to
  the next half.
- Database: `library_post_settings` and `library_posts`, migration `supabase/migrations/20261123000100_library_posts.sql`.
  API: `GET/PATCH/POST /api/admin/library-posts` (administrators only).
- **New article:** add its hashtags and card description to all 10 `library-social` files, then make its cards in every
  language: `node scripts/og-cards.mjs http://localhost:3100 --locale=all library-<id>` (server started with
  `OG_CARDS=1`). `lib/library-posts.test.ts` checks that every post fits in 300 characters and that every card exists.

## Setup (once)

Do not send the password to Claude.

1. **App password** — in Bluesky, sign in to the sisma account → *Settings → Privacy and security → App passwords →
   Add app password* (name it "sisma.io"; the menu names may differ slightly in the current Bluesky app). An app
   password can post but cannot change the account's password or email, and can be revoked on its own. Do not use the
   account's main password (with two-factor sign-in it is refused anyway, and the page says so).
2. **Sign in on the admin page** — Me → Administration → *Sign in to Bluesky*: the handle (e.g. `sisma.bsky.social`) or
   email and the app password. *Account on another server* is only for accounts not hosted on bsky.social.
   - The password is sent once to Bluesky to sign in and is **never stored**. sisma keeps only the session Bluesky
     returns (access and refresh tokens), encrypted in **Supabase Vault** (`bluesky_session`), readable only by the
     server. The server renews the session by itself (Bluesky rotates the refresh token; the new one is saved).
   - *Check connection* gets a token and asks Bluesky whose it is: "Connection works: posting as @…".
   - *Sign out* ends the session on Bluesky too and forgets it.
   - If the session stops working (e.g. the app password was revoked), the page shows the error; sign in again.
3. **Optional fallback: Vercel env** — `BLUESKY_IDENTIFIER`, `BLUESKY_APP_PASSWORD` (and `BLUESKY_SERVICE` for another
   server), marked Sensitive. They are used only when no account is signed in on the admin page, or when the signed-in
   session cannot be renewed.
4. **Administrator** — your account gets `is_admin` in the database (Claude sets it with the Supabase connector, or in
   the Supabase SQL editor: `update public.profiles set is_admin = true where id = (select id from auth.users where
   email = '<your email>');`). Users cannot set it themselves (column permissions and a trigger).
5. On **Me → Administration**: check the connection, choose the minimum magnitude, preview an event, then turn on
   **Post automatically**.

## Handle: @sisma.io

Verified with a DNS TXT record (`_atproto.sisma.io`) in Vercel DNS.

## Database

Migrations `20261106000100_bluesky.sql`: `profiles.is_admin` (with the `protect_is_admin` trigger),
`bluesky_settings` (one row) and `bluesky_posts` (the log); `20261107000100_bluesky_login.sql`: the signed-in account's
handle and status on `bluesky_settings`, and `bluesky_session_get` / `bluesky_session_set` (service role only) for the
session in Supabase Vault. Both tables have row-level security with no policies:
only the server (service role) reads and writes them, for administrators (`lib/admin.ts` checks `is_admin` on every
request).
