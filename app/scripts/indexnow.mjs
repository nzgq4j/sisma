// Tells IndexNow search engines (Bing, Yandex, Seznam, Naver …) to recrawl sisma.io's public pages, e.g. after a deploy
// that changed them. Reads the live sitemap, checks the key file is served, then submits all its URLs in one request.
//   node scripts/indexnow.mjs                  # every URL in https://sisma.io/sitemap.xml
//   node scripts/indexnow.mjs /help/alerts     # only these paths
// The key is public by design (src/lib/indexnow.ts, public/<key>.txt). Google doesn't use IndexNow. docs/search-setup.md
const KEY = 'c61d31aa14c556d162cb21743e2ba311';
const HOST = 'sisma.io', SITE = `https://${HOST}`;

const keyFile = await fetch(`${SITE}/${KEY}.txt`);
if (!keyFile.ok || (await keyFile.text()).trim() !== KEY) {
  console.error(`The key file ${SITE}/${KEY}.txt is not live yet (HTTP ${keyFile.status}). Deploy first.`);
  process.exit(1);
}

let urls = process.argv.slice(2).map(p => (p.startsWith('http') ? p : SITE + (p.startsWith('/') ? p : `/${p}`)));
if (!urls.length) {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}
urls = urls.filter(u => new URL(u).host === HOST);
if (!urls.length) { console.error('No sisma.io URLs to submit.'); process.exit(1); }

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
// 200 = accepted, 202 = received (key check pending); 403 = key not valid, 422 = URLs don't match the host, 429 = too many.
console.log(`IndexNow: HTTP ${r.status} for ${urls.length} URL${urls.length === 1 ? '' : 's'}`);
if (r.status >= 300) { console.error(await r.text()); process.exit(1); }
