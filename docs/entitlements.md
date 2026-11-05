# Entitlements

Source of truth: app/src/lib/entitlements.ts (UI) and public.effective_plan(profile) (database).

| Key | Free | sisma+ | Enforced in |
|---|---|---|---|
| historyDays | 30 | unlimited | /api/quakes (range), UI range chips (lock icon) |
| maxLocations | 1 | 10 | saved_locations trigger, Me → Add location |
| pushAlerts | false | true | alert_settings trigger, Me → Push alerts |
| maxAlertRules | 0 | 5 | alert_rules trigger (enforce_alert_rules), Me → Alerts |
| advancedFilters | false | true | /api/quakes ignores minMag/maxDepth/felt/tsunami for free |

Pricing: monthly $2.99 (Stripe price STRIPE_PRICE_MONTHLY, Play product sisma_plus_monthly),
yearly $19.99 (STRIPE_PRICE_YEARLY, sisma_yearly). The 7-day trial is only for accounts that have never
subscribed (lib/billing.ts trialEligible; /api/stripe/checkout re-checks with Stripe; Google Play applies its own
new-customer eligibility). Checkout refuses accounts with a running subscription in either store (409), and reuses a
returning subscriber's Stripe customer. profiles.billing_source records which store the subscription comes from.

A plan is effective while subscription_status is trialing, active or past_due.
Cancelling happens in the Stripe billing portal or Play subscriptions, never by editing profiles.plan.

## Managing a subscription
Me → sisma+ card → Manage subscription (/app/me/subscription) shows the status, price and next date.
Website subscriptions open Stripe's customer portal (POST /api/stripe/portal; the customer id comes from the
signed-in user's profile on the server). Configure the portal once in Stripe (Settings → Billing → Customer portal):
allow cancelling, updating the payment method, viewing invoices and switching between the monthly and yearly prices.
Subscriptions bought in the Android app link to Google Play's subscription page instead.
