export const SITE = {
  name: 'sisma',
  domain: 'sisma.io',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sisma.io',
  appPath: '/app',
  // Google Play listing. Until the app is published the site's Play button points at the pricing section.
  playUrl: process.env.NEXT_PUBLIC_PLAY_URL || '#pricing',
};
