// Google Play subscription ids (shared by the app and the server). Play Console: one subscription product per billing
// interval (docs/android-setup.md), each with one auto-renewing base plan; the 7-day free trial is an offer on the base
// plan for new customers. docs/play-billing-setup.md
import { PRICES, type Billing } from './entitlements';

export const PLAY = {
  packageName: 'io.sisma.app',
  /** Subscription product ids, as in PRICES. */
  products: { monthly: PRICES.monthly.playProductId, yearly: PRICES.yearly.playProductId } as Record<Billing, string>,
  /** Base plan ids (if a product's base plan has another id, the plugin falls back to the product's first offer). */
  basePlans: { monthly: 'monthly', yearly: 'yearly' } as Record<Billing, string>,
};

/** The billing interval of a Play subscription product id, or null if it is not one of ours. */
export const playBilling = (productId: string | undefined): Billing | null =>
  productId === PLAY.products.monthly ? 'monthly' : productId === PLAY.products.yearly ? 'yearly' : null;

/** Google Play's page for managing this app's subscriptions. */
export const PLAY_MANAGE_URL = `https://play.google.com/store/account/subscriptions?package=${PLAY.packageName}`;
