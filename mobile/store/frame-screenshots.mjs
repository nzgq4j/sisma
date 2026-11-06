// Google Play phone screenshots with a backdrop and a feature headline: each app screenshot in screenshots/ is placed
// in a rounded phone frame over backdrop.webp, under a one- or two-line headline, and saved as framed/<same name>.png
// (1080 × 1920, the size Play already accepts for these screenshots).
//
//   NODE_PATH=$(npm root -g) node mobile/store/frame-screenshots.mjs
//
// Needs Playwright with Chromium (global install is fine) and sharp from app/node_modules. Headlines are in HEADLINES
// below; the font is Figtree (SIL Open Font License), the app's own typeface.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(new URL('../../app/package.json', import.meta.url));
const { chromium } = require('playwright');
const sharp = require('sharp');

const W = 1080, H = 1920;
/** Screenshot file → headline. The order matches the listing (listing.md → Screenshot order). */
const HEADLINES = {
  'phone-1-feed.png': 'Every earthquake, as it happens',
  'phone-2-detail.png': 'Every detail of every quake',
  'phone-3-map.png': 'A live map of the world’s earthquakes',
  'phone-4-region.png': 'Zoom in on any earthquake',
  'phone-5-globe.png': 'Spin a live 3D globe',
  'phone-6-depth.png': 'See how deep each one struck',
  'phone-7-science.png': 'Learn how earthquakes work',
  'phone-8-plus.png': 'Alerts for the places you care about',
};

const b64 = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;
const backdrop = b64(`${dir}backdrop.webp`, 'image/webp');
const font = b64(`${dir}fonts/Figtree-latin.woff2`, 'font/woff2');

// Phone: 720 × 1280 screen (the 1080 × 1920 screenshot at 2/3) in a black 26 px bezel, a light metallic rim that stands
// out on the dark backdrop, side buttons and a camera dot; centred below the headline.
const page = (shot, headline) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Figtree; src: url(${font}) format('woff2'); font-weight: 300 900; }
* { margin: 0; box-sizing: border-box; }
body { width: ${W}px; height: ${H}px; overflow: hidden; background: #05060a url(${backdrop}) center / cover no-repeat; font-family: Figtree, sans-serif; position: relative; }
.shade { position: absolute; inset: 0 0 auto 0; height: 760px; background: linear-gradient(rgba(3,4,10,.88) 0%, rgba(3,4,10,.72) 45%, rgba(3,4,10,0) 100%); }
.foot { position: absolute; inset: auto 0 0 0; height: 260px; background: linear-gradient(rgba(3,4,10,0), rgba(3,4,10,.55)); }
h1 { position: absolute; top: 0; left: 80px; right: 80px; height: 470px; display: flex; align-items: center; justify-content: center; text-align: center;
     color: #fff; font-weight: 800; font-size: 84px; line-height: 1.06; letter-spacing: -0.025em; text-wrap: balance; text-shadow: 0 4px 28px rgba(0,0,0,.55); }
.phone { position: absolute; left: ${(W - 784) / 2}px; top: 488px; width: 784px; height: 1344px; padding: 6px; border-radius: 84px;
         background: linear-gradient(140deg, #f2f4f8 0%, #9aa0ad 18%, #4b505c 42%, #2b2e36 58%, #7d8290 80%, #e6e9ef 100%);
         box-shadow: 0 0 0 1.5px rgba(255,255,255,.55), 0 44px 100px rgba(0,0,0,.7), 0 0 140px rgba(255,90,60,.22); }
.bezel { position: relative; width: 100%; height: 100%; padding: 26px; border-radius: 78px; background: #030305;
         box-shadow: inset 0 0 0 2px rgba(255,255,255,.08); }
.bezel img { display: block; width: 720px; height: 1280px; border-radius: 54px; }
.cam { position: absolute; top: 44px; left: 50%; width: 24px; height: 24px; margin-left: -12px; border-radius: 50%;
       background: radial-gradient(circle at 35% 35%, #3a4a6a 0%, #0a0d16 55%, #000 100%); box-shadow: 0 0 0 3px #030305; }
.btn { position: absolute; width: 8px; border-radius: 4px; background: linear-gradient(90deg, #5d626e, #c8ccd5 50%, #5d626e); }
.power { right: -6px; top: 330px; height: 150px; }
.volup { left: -6px; top: 270px; height: 110px; }
.voldn { left: -6px; top: 400px; height: 110px; }
</style></head><body><div class="shade"></div><div class="foot"></div><h1>${headline}</h1>
<div class="phone"><div class="btn power"></div><div class="btn volup"></div><div class="btn voldn"></div><div class="bezel"><img src="${shot}" alt=""><div class="cam"></div></div></div></body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (const name of readdirSync(`${dir}screenshots`).filter(f => f.endsWith('.png')).sort()) {
  const headline = HEADLINES[name];
  if (!headline) { console.warn(`no headline for ${name}; skipped`); continue; }
  await tab.setContent(page(b64(`${dir}screenshots/${name}`, 'image/png'), headline), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  const lines = await tab.evaluate(() => { const h = document.querySelector('h1'); return Math.round(h.scrollHeight / parseFloat(getComputedStyle(h).lineHeight)); });
  const png = await tab.screenshot({ type: 'png' });
  await sharp(png).png({ compressionLevel: 9 }).toFile(`${dir}framed/${name}`);
  console.log(`framed/${name}  "${headline}"`);
}
await browser.close();
