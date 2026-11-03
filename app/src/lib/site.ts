export const SITE = {
  name: 'sisma',
  domain: 'sisma.io',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sisma.io',
  appPath: '/app',
  // Google Play listing. Until the app is published the site's Play button points at the pricing section.
  playUrl: process.env.NEXT_PUBLIC_PLAY_URL || '#pricing',
  // Shown in the privacy policy (operator identity, postal address, privacy contact).
  legal: {
    operator: 'Crucible Insight LLC',
    entity: 'an Arizona limited liability company',
    address: '15990 S. Rancho Sahuarita Blvd, Sahuarita, AZ 85629, USA',
    privacyEmail: 'privacy@sisma.io',
    policyUpdated: '2026-11-03',
  },
};
