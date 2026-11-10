// IndexNow (Bing, Yandex, Seznam, Naver and other engines that take part): tells them which pages changed so they
// recrawl promptly. The key is public by design: the same value is served at https://sisma.io/<key>.txt
// (public/<key>.txt), which proves the site owns it. Google doesn't use IndexNow; it reads the sitemap.
// Submit with scripts/indexnow.mjs after a deploy that changes public pages. docs/search-setup.md
export const INDEXNOW_KEY = 'c61d31aa14c556d162cb21743e2ba311';
