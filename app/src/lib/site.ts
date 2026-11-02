export const SITE = {
  name: 'sisma',
  domain: 'sisma.io',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sisma.io',
  appPath: '/app',
  // Google Play listing. Until the app is published the site's Play button points at the pricing section.
  playUrl: process.env.NEXT_PUBLIC_PLAY_URL || '#pricing',
  // Shown in the privacy policy. TODO before publishing: the operator's legal name, legal form and registered address.
  legal: {
    operator: 'Crucible Insight',
    address: '[legal form and registered address]',
    privacyEmail: 'privacy@sisma.io',
    policyUpdated: '2026-11-02',
  },
};
