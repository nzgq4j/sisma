# Automatic Bluesky posts — how it works and what to set up

sisma can post significant earthquakes to its Bluesky account on its own. Administrators control it in
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
  Automated post · not an official warning service
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
