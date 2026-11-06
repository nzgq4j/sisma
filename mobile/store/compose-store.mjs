// Store screenshots, step 2: frames the screens from capture-screens.mjs over backdrop.webp with a two-line headline
// (white line, violet line; store-text.json), and draws the feature graphic, for every language. Writes
// out/store/<locale>/{phone,tablet-7in,tablet-10in}/NN-name.jpg and feature-graphic.jpg, and one zip per language in
// out/zips/sisma-play-store-<locale>.zip.
//
//   NODE_PATH=$(npm root -g) node mobile/store/compose-store.mjs [locale …]
//
// Sizes follow Google Play: phone 1080 × 1920, 7-inch tablet 1200 × 1920, 10-inch tablet 1250 × 2000, feature graphic
// 1024 × 500; JPEG (no transparency), well under 8 MB. Fonts: Figtree (the app's typeface, SIL OFL) for Latin scripts,
// Noto Sans CJK from the system for Japanese and Chinese.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(new URL('../../app/package.json', import.meta.url));
const { chromium } = require('playwright');
const sharp = require('sharp');

const TEXT = JSON.parse(readFileSync(`${dir}store-text.json`, 'utf8'));
const LOCALES = Object.keys(TEXT).filter(k => !k.startsWith('_'));
const ONLY = process.argv.slice(2);
const ACCENT = '#8F74FF'; // sisma violet (dark theme)
const MAG = ['#B5179E', '#EE4266', '#FF7A59', '#FFA94D', '#F7CF4A', '#86DCC4']; // magnitude colours (dark theme), strongest first
const CJK = { ja: "'Noto Sans CJK JP'", zh: "'Noto Sans CJK SC'" };

/** Canvas, screen size inside the frame, frame top and the headline band for each device. */
const DEVICES = {
  phone: { out: 'phone', W: 1080, H: 1920, screen: [720, 1280], top: 470, band: 430, radius: 54, bezel: 26 },
  tablet7: { out: 'tablet-7in', W: 1200, H: 1920, screen: [840, 1344], top: 450, band: 410, radius: 40, bezel: 30 },
  tablet10: { out: 'tablet-10in', W: 1250, H: 2000, screen: [880, 1408], top: 470, band: 430, radius: 34, bezel: 32 },
};

const b64 = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;
const backdrop = b64(`${dir}backdrop.webp`, 'image/webp');
const icon = b64(`${dir}icon-512.png`, 'image/png');
const fonts = `
@font-face { font-family: Figtree; src: url(${b64(`${dir}fonts/Figtree-latin.woff2`, 'font/woff2')}) format('woff2'); font-weight: 300 900;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: Figtree; src: url(${b64(`${dir}fonts/Figtree-latin-ext.woff2`, 'font/woff2')}) format('woff2'); font-weight: 300 900;
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1E00-1EFF, U+2020, U+20A0-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }`;
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

/** One framed screenshot. The headline is sized in the page to fit the band (both lines the same size). */
function screenPage(l, d, shot, [a, b]) {
  const { W, H, screen: [sw, sh], top, band, radius, bezel } = d;
  const rim = 6, fw = sw + 2 * (bezel + rim), fh = sh + 2 * (bezel + rim), font = CJK[l] ? `${CJK[l]}, sans-serif` : 'Figtree, sans-serif';
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><style>${fonts}
* { margin: 0; box-sizing: border-box; }
body { width: ${W}px; height: ${H}px; overflow: hidden; position: relative; background: #05060a url(${backdrop}) center / cover no-repeat; font-family: ${font}; }
.shade { position: absolute; inset: 0 0 auto 0; height: ${band + 320}px; background: linear-gradient(rgba(3,4,10,.9) 0%, rgba(3,4,10,.74) 50%, rgba(3,4,10,0) 100%); }
.foot { position: absolute; inset: auto 0 0 0; height: 280px; background: linear-gradient(rgba(3,4,10,0), rgba(3,4,10,.6)); }
.head { position: absolute; top: 0; left: 50px; right: 50px; height: ${band}px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.head div { white-space: nowrap; font-weight: ${CJK[l] ? 700 : 900}; line-height: 1.02; letter-spacing: ${CJK[l] ? '0.02em' : '-0.01em'}; text-shadow: 0 6px 30px rgba(0,0,0,.6); }
.l1 { color: #fff; } .l2 { color: ${ACCENT}; }
.dev { position: absolute; left: ${(W - fw) / 2}px; top: ${top}px; width: ${fw}px; height: ${fh}px; padding: ${rim}px; border-radius: ${radius + bezel + rim}px;
       background: linear-gradient(140deg, #f2f4f8 0%, #9aa0ad 18%, #4b505c 42%, #2b2e36 58%, #7d8290 80%, #e6e9ef 100%);
       box-shadow: 0 0 0 1.5px rgba(255,255,255,.55), 0 44px 100px rgba(0,0,0,.7), 0 0 150px rgba(255,90,60,.22); }
.bezel { position: relative; width: 100%; height: 100%; padding: ${bezel}px; border-radius: ${radius + bezel}px; background: #030305; box-shadow: inset 0 0 0 2px rgba(255,255,255,.08); }
.bezel img { display: block; width: ${sw}px; height: ${sh}px; border-radius: ${radius}px; }
.cam { position: absolute; top: ${Math.round(bezel / 2) - 9}px; left: 50%; width: 18px; height: 18px; margin-left: -9px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #3a4a6a, #0a0d16 55%, #000); }
.btn { position: absolute; width: 8px; border-radius: 4px; background: linear-gradient(90deg, #5d626e, #c8ccd5 50%, #5d626e); }
</style></head><body><div class="shade"></div><div class="foot"></div>
<div class="head"><div class="l1">${esc(a)}</div><div class="l2">${esc(b)}</div></div>
<div class="dev"><div class="btn" style="right:-6px;top:${Math.round(fh * .24)}px;height:${Math.round(fh * .1)}px"></div>
<div class="btn" style="left:-6px;top:${Math.round(fh * .2)}px;height:${Math.round(fh * .08)}px"></div><div class="btn" style="left:-6px;top:${Math.round(fh * .3)}px;height:${Math.round(fh * .08)}px"></div>
<div class="bezel"><img src="${shot}" alt=""><div class="cam"></div></div></div></body></html>`;
}

/** Feature graphic: backdrop, app icon and wordmark, two-line tagline, and the magnitude colours as a bar. */
function featurePage(l, [a, b]) {
  const font = CJK[l] ? `${CJK[l]}, sans-serif` : 'Figtree, sans-serif';
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><style>${fonts}
* { margin: 0; box-sizing: border-box; }
body { width: 1024px; height: 500px; overflow: hidden; position: relative; background: #05060a url(${backdrop}) center 34% / 1024px auto no-repeat; font-family: Figtree, sans-serif; }
.shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(3,4,10,.92) 0%, rgba(3,4,10,.8) 42%, rgba(3,4,10,.25) 75%, rgba(3,4,10,.05) 100%); }
.box { position: absolute; left: 84px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; }
.brand { display: flex; align-items: center; gap: 26px; }
.brand img { width: 104px; height: 104px; border-radius: 26px; box-shadow: 0 10px 30px rgba(0,0,0,.5); }
.brand span { font-size: 92px; font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1; }
.brand b { color: ${ACCENT}; font-weight: 800; }
.tag { margin-top: 30px; font-family: ${font}; font-weight: ${CJK[l] ? 700 : 900}; font-size: 42px; line-height: 1.12; color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,.6); white-space: nowrap; }
.bars { display: flex; gap: 10px; margin-top: 34px; }
.bars i { width: 58px; height: 8px; border-radius: 4px; }
</style></head><body><div class="shade"></div><div class="box">
<div class="brand"><img src="${icon}" alt=""><span>sisma<b>.io</b></span></div>
<div class="tag"><div>${esc(a)}</div><div>${esc(b)}</div></div>
<div class="bars">${[...MAG].reverse().map(c => `<i style="background:${c}"></i>`).join('')}</div></div></body></html>`;
}

/** Largest font size (both lines equal) that fits `maxW` px and the band height. */
async function fitHeadline(tab, { maxSize, maxW, maxH }) {
  return tab.evaluate(([maxSize, maxW, maxH]) => {
    const lines = [...document.querySelectorAll('.head div, .tag div')];
    let s = maxSize;
    const fits = () => lines.every(n => n.scrollWidth <= maxW) && lines.reduce((h, n) => h + n.offsetHeight, 0) <= maxH;
    for (; s > 20; s -= 2) { lines.forEach(n => { n.style.fontSize = `${s}px`; }); if (fits()) break; }
    return s;
  }, [maxSize, maxW, maxH]);
}

const browser = await chromium.launch();
for (const l of LOCALES) {
  if (ONLY.length && !ONLY.includes(l)) continue;
  const t = TEXT[l], out = `${dir}out/store/${l}`;
  rmSync(out, { recursive: true, force: true });
  for (const [key, d] of Object.entries(DEVICES)) {
    const src = `${dir}out/screens/${l}/${key}`;
    if (!existsSync(src)) { console.warn(`${l}/${key}: no screens (run capture-screens.mjs first)`); continue; }
    mkdirSync(`${out}/${d.out}`, { recursive: true });
    const tab = await browser.newPage({ viewport: { width: d.W, height: d.H }, deviceScaleFactor: 1 });
    for (const f of readdirSync(src).filter(x => x.endsWith('.png')).sort()) {
      const name = f.replace(/^\d+-|\.png$/g, ''), n = f.split('-')[0].padStart(2, '0');
      await tab.setContent(screenPage(l, d, b64(`${src}/${f}`, 'image/png'), t[name]), { waitUntil: 'load' });
      await tab.evaluate(() => document.fonts.ready);
      const size = await fitHeadline(tab, { maxSize: Math.round(d.W * 0.118), maxW: d.W - 120, maxH: d.band - 90 });
      await sharp(await tab.screenshot({ type: 'png' })).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toFile(`${out}/${d.out}/${n}-${name}.jpg`);
      console.log(`${l}/${d.out}/${n}-${name}.jpg  ${size}px  ${t[name].join(' / ')}`);
    }
    await tab.close();
  }
  const fg = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await fg.setContent(featurePage(l, t.tagline), { waitUntil: 'load' });
  await fg.evaluate(() => document.fonts.ready);
  await fitHeadline(fg, { maxSize: 44, maxW: 520, maxH: 120 });
  await sharp(await fg.screenshot({ type: 'png' })).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(`${out}/feature-graphic.jpg`);
  await fg.close();
  console.log(`${l}/feature-graphic.jpg  ${t.tagline.join(' / ')}`);
  mkdirSync(`${dir}out/zips`, { recursive: true });
  const zip = `${dir}out/zips/sisma-play-store-${l}.zip`;
  rmSync(zip, { force: true });
  execFileSync('zip', ['-qr', zip, '.'], { cwd: out });
  console.log(`zips/sisma-play-store-${l}.zip`);
}
await browser.close();
