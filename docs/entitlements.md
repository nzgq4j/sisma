# Entitlements

Source of truth: app/src/lib/entitlements.ts (UI) and public.effective_plan(profile) (database).

| Key | Free | sisma+ | Enforced in |
|---|---|---|---|
| historyDays | 30 | unlimited | /api/quakes (range), UI range chips (lock icon) |
| maxLocations | 1 | 10 | saved_locations trigger, Me → Add location |
| pushAlerts | false | true | alert_settings trigger, Me → Push alerts |
| advancedFilters | false | true | /api/quakes ignores minMag/maxDepth/felt/tsunami for free |

Pricing: monthly $3.99 (Stripe price STRIPE_PRICE_MONTHLY, Play product sisma_plus_monthly),
yearly $36 (STRIPE_PRICE_YEARLY, sisma_plus_yearly). One 7-day trial per account (profiles.trial_ends_at).

A plan is effective while subscription_status is trialing, active or past_due.
Cancelling happens in the Stripe billing portal or Play subscriptions, never by editing profiles.plan.
