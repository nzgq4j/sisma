# Google Play Billing — how it works and what to set up

In the Android app, sisma+ is sold through Google Play Billing (Google Play's payments policy covers subscriptions
sold inside apps distributed on Play). On the website it is Stripe. Both write the same profile columns, so an account
has sisma+ wherever it signs in.

## How it works

- **Products:** two subscriptions, `sisma_plus_monthly` and `sisma_yearly` (`lib/play-config.ts`, as in
  docs/android-setup.md), each with one auto-renewing base plan (IDs `monthly` and `yearly`). The 7-day free trial is
  an *offer* on the base plan for new customers; Google decides who is eligible.
- **Buying (app):** the upgrade sheet uses the Capacitor plugin `@capgo/native-purchases` (installed in `mobile/`).
  The purchase is tagged with the account id `sha-256(user id)` (Google asks for an obfuscated id; the same value is
  `profiles.play_account_id`). The app then sends the purchase token to `POST /api/play/verify`.
- **Verifying:** `/api/play/verify` reads the purchase from the Google Play Developer API (`purchases.subscriptionsv2.get`),
  checks it was made for this account and that the token is not already used by another account, **acknowledges** it
  (Google refunds purchases not acknowledged within 3 days) and writes the plan (`lib/play.ts`).
- **Changes later** (renewal, cancellation, grace period, expiry): Google sends a Real-time Developer Notification
  through Pub/Sub to `POST /api/play/rtdn`. The route checks the push's Google-signed token, re-reads the subscription
  from the API and updates the account (found by the token, the token it replaced, or the account id).
- **Restore purchase** (upgrade sheet in the app): sends this account's Google Play subscriptions on the device to
  `/api/play/verify` — for a reinstall or a new phone.
- **Two stores:** `profiles.billing_source` records where the current subscription comes from. An ending
  subscription in one store does not switch off a running one in the other. The Subscription page links to Google
  Play or the Stripe portal accordingly.
- **Older app versions** (without the plugin) show "update sisma from Google Play" instead of a purchase button.

## Setup (once)

Nothing here needs to be sent to Claude. The service account key is a secret: put it only in Vercel.

1. **App release with billing.** Build and upload the new version (versionCode 3, includes the billing plugin) to a
   testing track first. Play Console only lets you create subscriptions once a build with billing has been uploaded.
2. **Subscription products** — as in docs/android-setup.md (*Set up Play subscriptions*): `sisma_plus_monthly`
   (base plan ID `monthly`, every 1 month, US$2.99) and `sisma_yearly` (base plan ID `yearly`, every 1 year,
   US$19.99), each with a 7-day free-trial offer for new customers. The product IDs must match exactly. If you already
   created the base plans with other IDs, it still works: the app then uses the product's first offer.
3. **Service account for the API**:
   - Google Cloud console (the project linked to Play Console, or a new one) → *APIs & Services* → enable
     **Google Play Android Developer API**.
   - *IAM & Admin → Service accounts → Create*, e.g. `play-billing`. *Keys → Add key → JSON*.
   - Play Console → *Users and permissions → Invite new users* → the service account's email → *App permissions* →
     sisma → allow viewing financial data and managing orders and subscriptions. The exact labels may differ from
     these words; choose the permissions for orders and subscriptions.
   - Vercel → sisma → Settings → Environment Variables → `GOOGLE_PLAY_SERVICE_ACCOUNT` = the whole JSON file
     (Production, mark Sensitive). Google can take up to about a day to accept a newly invited service account.
4. **Real-time Developer Notifications**:
   - Google Cloud console → *Pub/Sub → Topics → Create topic* `play-rtdn`. On the topic, *Add principal*
     `google-play-developer-notifications@system.gserviceaccount.com` with role **Pub/Sub Publisher**.
   - Create a second service account for the push, e.g. `pubsub-push` (no key needed).
   - *Pub/Sub → Subscriptions → Create*: topic `play-rtdn`, delivery type **Push**, endpoint
     `https://sisma.io/api/play/rtdn`, **Enable authentication** with the `pubsub-push` service account, audience
     `https://sisma.io/api/play/rtdn`.
   - Vercel env: `PLAY_RTDN_AUDIENCE` = `https://sisma.io/api/play/rtdn`, `PLAY_RTDN_SERVICE_ACCOUNT` = the
     `pubsub-push` service account's email. Redeploy.
   - Play Console → *Monetize with Play → Monetization setup → Real-time developer notifications*: topic name
     `projects/<project-id>/topics/play-rtdn` → *Send test notification*. The route answers `{"test":true}`.
5. **Test** — Play Console → *Settings → License testing*: add your Google account. On a phone signed in with that
   account, install the testing build, sign in to sisma, open the upgrade sheet and subscribe (test purchases are
   free and renew quickly). Check Me → Subscription shows "Manage in Google Play", then cancel in Google Play and
   check the notification updates it.

## Not yet verified

This code has been unit-tested (state mapping, Pub/Sub token check) but not run against Google Play. The first real
check is step 5 with a license tester. One point to watch there: the plugin chooses the first offer Google returns
for the base plan; confirm that an eligible new tester gets the free-trial offer.
