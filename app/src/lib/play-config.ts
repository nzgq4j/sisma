// Google Play subscription ids (shared by the app and the server). Play Console: one subscription product, sisma+ yearly
// (docs/android-setup.md), with one auto-renewing base plan; the free trial (TRIAL_DAYS) is an offer on the base plan for
// new customers. docs/play-billing-setup.md
import { PRICES, type Billing } from './entitlements';

export const PLAY = {
  packageName: 'io.sisma.app',
  /** Subscription product ids, as in PRICES. */
  products: { yearly: PRICES.yearly.playProductId } as Record<Billing, string>,
  /** Base plan ids (if a product's base plan has another id, the plugin falls back to the product's first offer). */
  basePlans: { yearly: 'yearly' } as Record<Billing, string>,
};

/** The billing interval of a Play subscription product id, or null if it is not one of ours. */
export const playBilling = (productId: string | undefined): Billing | null =>
  productId === PLAY.products.yearly ? 'yearly' : null;

/** Google Play's page for managing this app's subscriptions. */
export const PLAY_MANAGE_URL = `https://play.google.com/store/account/subscriptions?package=${PLAY.packageName}`;
