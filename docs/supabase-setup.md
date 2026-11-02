# Supabase setup for sisma

Project **sisma**, ref `ukmvbfhfbohdlxoxlqhc`, region us-east-1, organization Crucible Insight.
Dashboard: https://supabase.com/dashboard/project/ukmvbfhfbohdlxoxlqhc

Already done (by Claude, through the Supabase and Vercel connectors):

| Step | State |
| --- | --- |
| Schema `20261102000100_core.sql` (hardened: reports server-only, summary view not public, trigger functions not callable) | Applied |
| `20261102000200_fk_indexes.sql` | Applied |
| `20261102000300_saved_locations_places.sql` (detail column, length limits, one default place, authenticated-only policies, race-free plan limit) | Applied |
| Security advisor | Clean apart from the intentional "RLS enabled, no policy" on `felt_reports` |
| Vercel env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key) | Added for Production, Preview, Development |
| Vercel ↔ Supabase integration (`STORAGE_` variables, incl. the secret key) | Connected by you |

Everything below is done by hand in the dashboards. Menu names are given first; links are shortcuts.

## 1. Secret key → Vercel (done)

Connected through **Vercel → Storage → Supabase** with the env prefix `STORAGE`, which added `STORAGE_SUPABASE_URL`,
`STORAGE_SUPABASE_SECRET_KEY`, `STORAGE_SUPABASE_SERVICE_ROLE_KEY`, `STORAGE_POSTGRES_*` and the public
`NEXT_PUBLIC_STORAGE_SUPABASE_*` keys (Production and Preview). The server reads them through
`app/src/lib/supabase-env.ts`, which also accepts the unprefixed names (`SUPABASE_SERVICE_ROLE_KEY`). Never put the
secret key in the app, a `NEXT_PUBLIC_` variable, the repo or a chat.

## 2. Authentication → URL Configuration (`/auth/url-configuration`)

| Field | Value |
| --- | --- |
| Site URL | `https://sisma.io` |
| Redirect URLs | `https://sisma.io/**` |
| | `https://sisma-*-crucible-insight.vercel.app/**` (preview deployments) |
| | `http://localhost:3000/**` (local development) |

These are where confirmation, password-reset, magic-link and OAuth links may return to. The Android app loads
`https://sisma.io/app`, so it needs no extra entry until native sign-in (a custom scheme such as `io.sisma.app://**`) is added.

## 3. Authentication → Sign In / Providers (`/auth/providers`)

**Email**
- Enable email provider: **on**
- Confirm email: **on** (sign-up sends the *Confirm sign up* email)
- Secure email change: **on** (both addresses must confirm)
- Secure password change: **on** (recent sign-in required)
- Minimum password length: **8** or more; password requirements: **letters and digits** (or stronger)

**Others**
- Allow new users to sign up: **on**
- Anonymous sign-ins: **off**
- Manual linking: **off**
- Phone: **off**
- Google / Apple: optional later; each needs OAuth credentials from Google Cloud / Apple Developer, and the
  callback URL Supabase shows on the provider page.

## 4. Authentication → Emails → Templates (`/auth/templates`)

Paste the sisma templates from `supabase/templates/` (see that folder's README for the table). For each template:
paste the `.html` file as the **Message body**, the matching `subjects/*.txt` line as the **Subject**, then **Save changes**.

| Dashboard template | Body | Subject |
| --- | --- | --- |
| Confirm sign up | `confirmation.html` | `subjects/confirmation.txt` |
| Reset password | `recovery.html` | `subjects/recovery.txt` |
| Magic link | `magic_link.html` | `subjects/magic_link.txt` |
| Change email address | `email_change.html` | `subjects/email_change.txt` |
| Invite user, Reauthentication | not used by sisma; leave as they are | |

**Security notifications** (same page, *Security* section): switch on **Password changed** and
**Email address changed**, and paste `password_changed.html` / `email_changed.html` with their subjects.
Leave the phone, identity and MFA notices off (sisma doesn't use them).

Each template holds all 10 languages and picks one from the user's `locale` metadata. When accounts are built, the
app must send it at sign-up (`supabase.auth.signUp({ email, password, options: { data: { locale } } })`) and
update it when the language changes (`supabase.auth.updateUser({ data: { locale } })`). Without it, emails are English.

## 5. Authentication → Emails → SMTP Settings (`/auth/smtp`)

Supabase's built-in mailer only sends a few emails an hour and only to your team's addresses, so production needs
your own SMTP provider (for example Resend, Postmark or Amazon SES):

1. In the provider, add the domain **sisma.io** and create the DNS records it gives you (SPF, DKIM, and a DMARC
   record such as `v=DMARC1; p=quarantine`) wherever sisma.io's DNS is managed (Vercel → Domains if the nameservers
   point to Vercel). Wait for the provider to verify the domain.
2. In Supabase, enable custom SMTP with the provider's host, port (465 or 587), username and password/API key.
3. Sender email **no-reply@sisma.io**, sender name **sisma**.

With **Resend**: host `smtp.resend.com`, port `465`, username `resend`, password = a Resend API key with
**Sending access** limited to the sisma.io domain. The key goes only into this Supabase form; it is not needed in
Vercel or the repo (the app sends no email itself).

## 6. Authentication → Rate Limits (`/auth/rate-limits`)

After custom SMTP is on: emails sent per hour **100** (raise as sign-ups grow). Keep the defaults for sign-ups,
token refreshes and verifications unless they cause problems.

## 7. Authentication → Attack Protection (`/auth/protection`)

- Leaked password protection (HaveIBeenPwned): **on** if your plan includes it
- CAPTCHA (Cloudflare Turnstile or hCaptcha): recommended before launch; needs the provider's secret here and a
  widget on the sign-up form

## 8. Authentication → Sessions (`/auth/sessions`)

Defaults are fine: refresh-token rotation on, reuse interval 10 s. Optionally set an inactivity timeout.

## 9. Project Settings

- **Data API** (`/settings/api`): exposed schemas **public** only (default).
- **Database → Connection pooling / Auth server**: switch the Auth server's connections from an absolute number
  to a **percentage** (performance advisor: *Auth DB Connection Strategy is not Percentage*;
  https://supabase.com/docs/guides/deployment/going-into-prod).
- **Backups**: daily backups come with paid plans; point-in-time recovery is an add-on.
- **Free plan only**: inactive projects are paused after a week; upgrade or keep traffic flowing before launch.

## Later (when those features are built)

- **Quake cache and push alerts**: enable `pg_cron` and `pg_net`, deploy an ingest edge function, store its URL and
  key in Vault, schedule it (same pattern as polar lights' `supabase/README.md`), and add the FCM credentials as
  **Edge Functions → Secrets**.
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` in Vercel, and
  a Stripe webhook pointing at `https://sisma.io/api/stripe/webhook`.
