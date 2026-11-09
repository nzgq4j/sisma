# Automatic X posts — how it works and what to set up

sisma can post significant earthquakes to its X (formerly Twitter) account on its own, the same way and at the same
time as the Bluesky posts ([bluesky-setup.md](bluesky-setup.md)). Administrators control it in **Me → Administration →
X** (shown only to accounts with `profiles.is_admin`).

## What a post contains

The same as on Bluesky, in English:

- **Image:** the event's share card (1080×1350 PNG, km, UTC), with the same **alt text** (at most 1,000 characters on X).
- **Text:** magnitude and place, time and depth, the tsunami line when the agency flags one, `Map and details:` with the
  link to the event's region view, `#earthquake` and the country tag, and `Automated post · not an official warning
  service`. X counts at most 280 characters, with every link as 23 and some characters (CJK, emoji, "…") as 2
  (`xLength` in `lib/x.ts`). A long place name is shortened to fit.

## When it posts

Exactly as for Bluesky, with its own settings and log:

- The every-minute alert job (`POST /api/cron/alerts`) runs the X step (`autoPostX` in `lib/x.ts`) alongside the
  alerts and the Bluesky step, so it never delays them.
- Events at or above the X **minimum magnitude** (M4.5 to M7.5, default M6.0) from the **last 30 minutes**; switching
  it on never posts a backlog. At most 2 posts a minute, largest first. A new event waits up to 15 minutes for its
  card, then goes out as text.
- **One post per earthquake** (`x_posts`); the same event from another agency (within 90 s and 100 km) is not posted
  again. A failed post is recorded with X's error and not retried automatically; **Post now** posts it by hand.

## Signing in: "Sign in with X"

You sign in on x.com and approve sisma there (OAuth 2.0 authorization code with PKCE). **sisma never sees the X
password**, and you should not send it to anyone, including Claude. X gives sisma an access token (valid for 2 hours)
and a refresh token; the server keeps them encrypted in **Supabase Vault** (`x_session`, readable only by the server)
and renews them itself (X issues a new refresh token each time; the new one is saved). sisma asks X for these
permissions: `tweet.read`, `tweet.write`, `users.read`, `media.write` (to upload the card) and `offline.access` (to
stay signed in).

- **Check connection** gets a token and asks X whose account it is: "Connection works: posting as @…".
- **Sign out** revokes the tokens at X and forgets them. You can also remove sisma's access on X (Settings and privacy
  → Security and account access → Apps and sessions → Connected apps); the admin page then shows the error and asks you
  to sign in again.

## Setup (once)

1. **X developer app** — sign in to the X developer portal (developer.x.com) with the account that will own the app,
   create an app, and open its **User authentication settings** (the names in X's portal may differ slightly):
   - App permissions: **Read and write**.
   - Type of app: **Web App, Automated App or Bot** (a confidential client: it has a client secret).
   - Callback URI / Redirect URL: `https://sisma.io/api/admin/x/callback`
   - Website URL: `https://sisma.io`
2. **Keys** — in the app's *Keys and tokens*, copy the **OAuth 2.0 Client ID** and **Client Secret** (not the API key
   and secret of OAuth 1.0a). In Vercel → sisma → Settings → Environment Variables, add `X_CLIENT_ID` and
   `X_CLIENT_SECRET` (Production, mark the secret Sensitive), then redeploy. Do not send the secret to Claude.
3. **Costs** — X's API is paid: as of 2026, reports describe pay-per-use billing, charged per post, with a higher
   price for posts that contain a link (each sisma post has one). Check the plan, the current prices and your credits
   in the developer portal before turning on automatic posting. When the credits run out, posts fail with
   "no credits left" in the log.
4. **Sign in** — Me → Administration → **X** → **Sign in with X**. On x.com, sign in with the **sisma account** (the
   account the posts should come from, not a personal one) and tap **Authorize app**. You come back to the admin page,
   which says "Signed in to X."
5. **Label the account as automated** (recommended by X for bots): in X, on the sisma account, Settings → Your account
   → Account information → Automation, and set the managing account.
6. On the X tab: check the connection, choose the minimum magnitude, preview an event (Post now posts it), then turn on
   **Post automatically**.

## Database

Migration `supabase/migrations/20261109000100_x_posts.sql` (additive): `x_settings` (one row), `x_posts` (one row per
event), `x_oauth_states` (sign-ins in progress: random state and PKCE verifier, 10 minutes, used once) and the Vault
functions `x_session_get` / `x_session_set` (service role only). All tables have RLS on and no policies: only the
server reads them.

## Request formats

Taken from X's own SDK (`@xdevplatform/xdk` 0.6.6) and `twitter-api-v2` 1.31, because X's documentation site could not
be reached from the build environment: `https://x.com/i/oauth2/authorize`, `POST https://api.x.com/2/oauth2/token`
(Basic client authentication), `/2/oauth2/revoke`, `GET /2/users/me`, `POST /2/media/upload/initialize` (JSON:
`media_type`, `total_bytes`, `media_category: tweet_image`), `/2/media/upload/{id}/append` (multipart: `segment_index`,
`media`), `/2/media/upload/{id}/finalize`, `POST /2/media/metadata` (`{ id, metadata: { alt_text: { text } } }`) and
`POST /2/tweets` (`{ text, media: { media_ids } }`). Unit tests: `src/lib/x.test.ts`.
