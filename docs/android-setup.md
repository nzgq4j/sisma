# Android app setup — step by step, in plain language

The Android app is a thin shell (Capacitor, in `mobile/`) that opens **https://sisma.io/app** and adds what only a
phone app can do: push notifications, the system location prompt, and Google Play subscriptions. Most of the work below
is clicking through Google's consoles. Where code is needed, the step says **"→ Claude"**: tell me when you reach it.

**Rules that apply everywhere**

- **Secret files** (anything called a *private key*, *service account JSON*, *client secret*, *keystore*) never go in
  email, chat, the GitHub repo, or anything starting with `NEXT_PUBLIC_`. Each step says exactly where they go.
- Policies and prices below are correct at the time of writing (late 2026); Google shows the current rules inside each console.
- Package name everywhere: **`io.sisma.app`** (already set in `mobile/capacitor.config.ts`). It can never change after the
  first upload, so type it carefully.

## Order to do things in

| # | Step | Needed for | Time |
| - | ---- | ---------- | ---- |
| 0 | Prerequisites: sisma.io email, privacy policy page | everything below | 1 h + **→ Claude** |
| 1 | Google Play Console account | publishing | 30 min + 1–7 days verification |
| 2 | Firebase project (push notifications) | alerts | 15 min |
| 3 | Google Cloud: Play subscriptions access | sisma+ in the app | 30 min |
| 4 | Google sign-in (OAuth) — optional | "Continue with Google" | 30 min + **→ Claude** |
| 5 | Payments: Play subscriptions; Google Pay on the website | sisma+ | 30 min + **→ Claude** |
| 6 | Build the app and the upload key | first upload | 1–2 h, **→ Claude** for code |
| 7 | Play Console app listing and policy forms | publishing | 2–3 h |
| 8 | Testing tracks, then production | publishing | 14+ days |

---

## 0. Prerequisites

1. **A sisma.io email** — done: mail is hosted at InMotion (david@sisma.io), with privacy@ and support@ forwarding to it. Use **support@sisma.io** wherever Google asks for a support email.
2. **A privacy policy page** — drafted at https://sisma.io/privacy (operator: Crucible Insight LLC; details in
   `app/src/lib/site.ts` → `legal`). Have it reviewed before launch. Google Play and Google sign-in both refuse apps without
   one. It must say what data sisma collects (email for accounts, approximate location in felt reports, saved places,
   subscription status), why, who processes it (Supabase, Vercel, Resend, Stripe, Google), and how to delete it.
   **→ Claude:** I can draft the page and the account-deletion page from what the app actually does; have a lawyer review it.
3. **Decide who publishes:** a *personal* developer account (your name is shown as the developer) or an *organization*
   account for Crucible Insight (needs a free **D-U-N-S number** from Dun & Bradstreet, which can take a couple of weeks,
   but skips the 12-tester rule in step 8 and shows the company name).

## 1. Google Play Console account

1. Go to **play.google.com/console** and sign in with the Google account that will own the app. A business account is
   best: you can create a Google account for **david@sisma.io** at accounts.google.com → *Create account* →
   *Use your existing email* (no Gmail needed). Forwarding addresses like support@ can't be Google accounts.
2. Choose **Personal** or **Organization** (see step 0.3), pay the one-time **US$25** registration fee.
3. Complete **identity verification** (government ID; for organizations also the D-U-N-S number and a website — use
   https://sisma.io). This can take from a few hours to several days.
4. Verify a **phone number** and the **developer email** when asked.

## 2. Firebase — push notifications

Firebase is Google's service that delivers notifications to Android phones (FCM, "Firebase Cloud Messaging").
A Firebase project is also a Google Cloud project, so you'll reuse it in steps 3 and 4.

1. Go to **console.firebase.google.com** → **Create a project** → name it **sisma**. Google Analytics: you can turn it
   **off** (sisma doesn't use it). Create.
2. On the project home page click the **Android** icon ("Add app"):
   - Android package name: **io.sisma.app**
   - App nickname: sisma
   - Debug signing certificate: leave empty
   - **Register app** → **Download google-services.json** → keep the file; it goes into the app in step 6
     (`mobile/android/app/google-services.json`). It isn't a password, but keep it out of public places.
   - Skip the remaining "add the SDK" screens (Capacitor already includes it).
3. ⚙ **Project settings** → **Cloud Messaging** tab → check that **Firebase Cloud Messaging API (V1)** says *Enabled*.
4. ⚙ **Project settings** → **Service accounts** → **Generate new private key** → a `.json` file downloads.
   **This is a secret.** It lets a server send notifications. Store it in your password manager. When we build alerts
   (build step 9), you'll paste its contents into **Supabase → Edge Functions → Secrets** as `FCM_SERVICE_ACCOUNT`.
   Don't send it to me; I'll give you the exact field.

## 3. Google Cloud — let sisma's server check Play subscriptions

When someone subscribes in the Android app, Google Play tells sisma's server, and the server asks Google "is this
purchase real?" before unlocking sisma+. That needs a *service account* (a robot user) and a *notification topic*.

1. Go to **console.cloud.google.com** and pick the **sisma** project at the top (the Firebase project from step 2).
2. ☰ **APIs & Services → Library** → search and **Enable**: **Google Play Android Developer API** and **Cloud Pub/Sub API**.
3. ☰ **IAM & Admin → Service accounts → Create service account**: name `play-billing` → Create and continue →
   no roles needed here → Done. Copy its email (looks like `play-billing@<project>.iam.gserviceaccount.com`).
4. Open it → **Keys → Add key → Create new key → JSON**. **Secret** — password manager. When we build Play Billing
   it goes into **Vercel → Project sisma → Settings → Environment Variables** as `PLAY_SERVICE_ACCOUNT_JSON`
   (Production only, marked *Sensitive*).
5. In **Play Console → Users and permissions → Invite new users**: paste the service account email; under
   *App permissions* add the sisma app (after step 7 creates it) with **View financial data** and
   **Manage orders and subscriptions** → Invite.
6. **Real-time notifications** (Play tells us about renewals, cancellations, refunds):
   - Cloud console ☰ **Pub/Sub → Topics → Create topic**: ID `play-rtdn` → Create.
   - Open the topic → **Permissions → Add principal**: `google-play-developer-notifications@system.gserviceaccount.com`,
     role **Pub/Sub Publisher** → Save.
   - **→ Claude:** I'll add the receiving endpoint (`/api/play/rtdn`); then you create a **push subscription** on the
     topic pointing to that URL, and in **Play Console → (app) → Monetize with Play → Monetization setup →
     Real-time developer notifications** enter the topic name `projects/<project-id>/topics/play-rtdn` and click
     *Send test notification*.

## 4. Google sign-in (optional)

Today sisma signs people in with an **email link** (no password). Adding "Continue with Google" is optional but
convenient. Skip this step if you don't want it.

1. Cloud console (sisma project) ☰ **APIs & Services → OAuth consent screen** (may be called **Google Auth Platform**):
   - **Branding:** App name *sisma*, support email *support@sisma.io*, logo (`app/public/icons/icon-512.png`),
     home page `https://sisma.io`, privacy policy `https://sisma.io/privacy`, terms (if you have one).
     Authorized domains: **sisma.io** and **supabase.co**. Developer contact: your email.
   - **Audience:** *External*. Scopes: only the defaults (`email`, `profile`, `openid`) — then Google review isn't needed.
     Click **Publish app** so anyone can sign in (not just test users).
2. **Clients → Create client** → type **Web application**, name "sisma web":
   - Authorized JavaScript origins: `https://sisma.io`
   - Authorized redirect URIs: `https://ukmvbfhfbohdlxoxlqhc.supabase.co/auth/v1/callback`
   - Create → copy the **Client ID** and **Client secret** (secret!).
3. **Supabase → Authentication → Sign In / Providers → Google** → Enable → paste the Client ID and Client secret → Save.
   The secret lives only there.
4. That's all on the Google/Supabase side — the app already has the **Continue with Google** button; it appears
   automatically as soon as the Google provider is switched on in Supabase. Test it on https://sisma.io/app/me.
   In the Android app, Google blocks sign-in inside embedded web pages, so the app opens Google in the phone's browser
   and comes back through an *app link* (step 6.6). Until the app link is verified, sign-in completes in the browser.

## 5. Payments — Google Play, Stripe and Google Pay

Three different things with similar names:

| | What it is | Used by sisma for |
| --- | --- | --- |
| **Google Play Billing** | Google's checkout inside Android apps; Google keeps a service fee (15 % on subscriptions at the time of writing) | sisma+ bought **in the Android app** |
| **Stripe** | Card processor for websites | sisma+ bought **on sisma.io** (already built) |
| **Google Pay** | A wallet (saved cards) shown as a button at checkout | Optional button inside Stripe's checkout on the website |

**Why both:** Google Play's rules require digital subscriptions bought *inside* a Play app to go through Play Billing.
(Some countries, e.g. the US, now allow alternatives under conditions that keep changing — Play Billing is the safe
default.) A subscription bought on either side unlocks sisma+ everywhere, because both end up on the same account.
**→ Claude:** when Play Billing is built, the Android app shows the Play checkout and hides the Stripe one.

**Set up Play subscriptions** (after step 7 creates the app and after the first build is uploaded to a testing track —
Play only enables subscriptions once an app bundle exists):

1. **Play Console → Settings → Payments profile**: create it (legal name, address, bank account, tax info). Payouts
   come here.
2. **(app) → Monetize with Play → Products → Subscriptions → Create subscription**, twice — the IDs must be exactly:

   | Product ID | Name | Base plan | Price | Offer |
   | --- | --- | --- | --- | --- |
   | `sisma_plus_monthly` | sisma+ monthly | auto-renewing, every **1 month** | US$3.99 | free trial **7 days**, new customers only |
   | `sisma_plus_yearly` | sisma+ yearly | auto-renewing, every **1 year** | US$36.00 | free trial **7 days**, new customers only |

   For each: add the *base plan* → set the US price → **Update prices for other countries** (Google converts) →
   *Activate*. Then **Add offer** → free trial 7 days → eligibility "New customer acquisition" → *Activate*.
   Benefits text (shown by Google): "Push alerts", "Up to 10 saved locations", "Full history", "Advanced filters".
3. Under **Settings → License testing**, add your own Gmail so your test purchases are free.

**Google Pay on the website (optional, 2 minutes):** Stripe Dashboard → **Settings → Payment methods** → turn on
**Google Pay** (and Apple Pay). Stripe's checkout then shows the button automatically on supported phones and browsers.

**Stripe (website) checklist** if not done yet: create the two prices (US$3.99/month, US$36/year) and add to Vercel:
`STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_WEBHOOK_SECRET`, with a webhook to
`https://sisma.io/api/stripe/webhook` for `customer.subscription.*` events. Until then the paywall says payments
aren't available yet.

## 6. Build the app

Done once on a computer (Mac or Windows). **→ Claude** can do the code parts in the repo; you need to do the signing
key yourself, because it must stay on your machine.

1. Install **Node.js** (LTS, nodejs.org) and **Android Studio** (developer.android.com/studio), open Android Studio once
   and let it install the SDK.
2. **→ Claude:** generate the Android project (`npx cap add android`), the icons and launch screen
   (`npx @capacitor/assets generate --android`), and the permissions: approximate + precise location (only while the
   app is open), notifications (Android 13+), internet. I'll commit `mobile/android/`.
3. Copy `google-services.json` from step 2 into `mobile/android/app/`.
4. Terminal in the repo: `cd mobile && npm install && npx cap sync android && npx cap open android` → Android Studio
   opens. Plug in an Android phone (with USB debugging on) and press ▶ to try it.
5. **Upload key** (proves future updates come from you): Android Studio → **Build → Generate Signed App Bundle** →
   Android App Bundle → *Create new…* key store. Save the `.jks` file and **both passwords** in your password manager
   **and** a backup. Never commit it. Finish → you get `app-release.aab` (this is what you upload).
   With **Play App Signing** (default, keep it on) Google holds the real signing key; if you lose the upload key,
   Google can reset it.
6. **App links** (so sign-in links and Google sign-in return to the app): after the first upload, in Play Console →
   **Test and release → App integrity → App signing**, copy the **SHA-256 certificate fingerprint** (not secret).
   Add it in **Vercel → Project sisma → Settings → Environment Variables** as `ANDROID_CERT_SHA256` (Production;
   for local test builds add the upload key's fingerprint too, comma-separated) and redeploy — or send it to me.
   sisma.io then serves https://sisma.io/.well-known/assetlinks.json. The app side is this intent filter in
   `mobile/android/app/src/main/AndroidManifest.xml`, inside the main `<activity>` (**→ Claude** adds it when generating
   the Android project):

   ```xml
   <intent-filter android:autoVerify="true">
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="https" android:host="sisma.io" android:pathPrefix="/app" />
   </intent-filter>
   ```
7. Each new version: raise *versionCode* by 1 (**→ Claude** can do it), build the bundle again, upload. Web changes to
   sisma.io/app reach the app instantly without a new upload; only native changes need one.

## 7. Play Console — create the app and fill in the forms

1. **Create app**: name *sisma*, default language, **App**, **Free** (in-app purchases are still allowed), accept the
   declarations.
2. **Store listing** (Grow → Store presence → Main store listing):
   - Short description (max 80 characters), e.g. *Live earthquakes worldwide — map, 3D globe and clear science.*
   - Full description (what it shows, data sources USGS/EMSC/GeoNet/JMA, sisma+, and "not an official warning service").
   - App icon 512×512 PNG, **feature graphic** 1024×500, 2–8 phone screenshots. **→ Claude** can produce these from the app.
   - Category: **Weather** (or Education), contact email support@sisma.io, website https://sisma.io.
3. **App content** (Policy → App content) — each is a short form:
   - **Privacy policy:** https://sisma.io/privacy
   - **Ads:** No ads.
   - **App access:** "All functionality is available without special access" (sign-in is optional) — or give a test account.
   - **Content rating:** questionnaire → category "Reference, News or Educational"; no violence etc. → usually *Everyone*.
   - **Target audience:** 13+ (or 18+); not designed for children.
   - **Data safety** (what sisma collects — answer truthfully; I can fill a checklist from the code):
     - *Email address* — collected, for account management, optional, can be deleted.
     - *Approximate location* — collected only when someone sends a felt report (rounded to ~10 km), app functionality,
       optional. Precise location is used **on the device only** and not sent.
     - *Purchase history* — collected (subscription status), app functionality.
     - Encrypted in transit: **Yes**. Users can request deletion: **Yes**.
   - **Account deletion:** Google requires a web link where people can delete their account without the app:
     use **https://sisma.io/privacy#delete** (explains the steps; deletion itself is in Me → Account → Delete account).
   - **Government apps / financial features / health:** No. **News app:** No.
4. **Location permission:** sisma only asks while the app is in use (foreground), so no background-location
   declaration is needed.

## 8. Testing, then production

1. **Internal testing** (Test and release → Testing → Internal testing): create a release, upload `app-release.aab`,
   add testers' emails, roll out. Testers install via a link within minutes. Use this to try everything, including a
   test subscription (free for license testers).
2. **Closed testing:** new **personal** developer accounts must run a closed test with at least **12 testers** opted in
   for **14 days in a row** before they can apply for production (Play Console shows the current numbers). Organization
   accounts are exempt. Ask friends to join via the opt-in link and keep the app installed.
3. **Apply for production** → answer the short questionnaire about the test → after approval, create a production
   release (start with a staged rollout, e.g. 20 %) → review usually takes a few days.

## What goes where (keep this table)

| Item | Secret? | Where it goes |
| --- | --- | --- |
| `google-services.json` | No (keep private) | `mobile/android/app/` |
| Firebase service account JSON | **Yes** | Supabase → Edge Functions → Secrets (`FCM_SERVICE_ACCOUNT`) |
| Play service account JSON | **Yes** | Vercel env `PLAY_SERVICE_ACCOUNT_JSON` (Production, Sensitive) |
| Google OAuth client secret | **Yes** | Supabase → Auth → Providers → Google only |
| Upload keystore `.jks` + passwords | **Yes** | Your password manager + backup only |
| App signing SHA-256 fingerprint | No | Send to Claude (for `assetlinks.json`) |
| Stripe keys / webhook secret | **Yes** | Vercel env vars |
