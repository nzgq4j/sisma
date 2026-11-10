# Search engines — indexing sisma.io

What the site does so search engines can find, verify and understand it, and what to set up in each engine's
webmaster tool.

## What the site provides

| Piece | Where | What it does |
|---|---|---|
| `robots.txt` | `app/src/app/robots.ts` | Everything may be crawled except `/api/`; points to the sitemap. The account pages (`/app/me`) are crawlable but `noindex` (meta tag and `X-Robots-Tag`), so search engines see that and drop them. |
| `sitemap.xml` | `app/src/app/sitemap.ts` | Home, feed, map, globe, science list, every science article, help hub and topics, privacy, terms. New articles and help topics are added automatically. |
| Titles, descriptions, canonical URLs, social cards | `app/src/lib/seo.ts` | One per page; every page names its `https://sisma.io/...` address as canonical. Account pages are `noindex`. |
| Structured data (JSON-LD) | `app/src/lib/structured-data.tsx` | Every page: the publisher (Organization) and the WebSite. Home: the app (SoftwareApplication; free, with the sisma+ prices). Science articles: Article + breadcrumbs. Help topics: TechArticle + breadcrumbs. No ratings or reviews. |
| Ownership tags | `siteVerification()` in `app/src/lib/seo.ts` | `<meta>` tags for Google, Bing and Yandex, from Vercel env (below). |
| IndexNow key | `app/public/c61d31aa14c556d162cb21743e2ba311.txt`, `app/src/lib/indexnow.ts` | Proves ownership to IndexNow engines; `app/scripts/indexnow.mjs` submits changed pages. |
| One address only | `app/next.config.ts` | The same site under `*.vercel.app` answers with `X-Robots-Tag: noindex`, so only sisma.io is listed. |

The pages are rendered on the server, so crawlers see the full text (article text, help topics, titles) without
running JavaScript. Interface text is translated in the browser; search results show the English pages.

## Google Search Console

The **domain property `sisma.io`** is verified by DNS: a `google-site-verification=…` TXT record on sisma.io (Vercel
DNS, added 3 Nov 2026). It covers every address on the domain.

1. Open search.google.com/search-console and choose the **sisma.io** property. If it isn't listed, *Add property →
   Domain → sisma.io*; the existing TXT record verifies it (or Google shows a new one to add in Vercel → Domains →
   sisma.io → DNS records).
2. **Sitemaps** → enter `sitemap.xml` → *Submit*. Status should become *Success* with the number of pages.
3. **URL inspection** → `https://sisma.io/` → *Request indexing*. Repeat for a few key pages (`/app/map`,
   `/app/science`) to speed up the first crawl; the sitemap covers the rest.
4. Later: *Pages* (what is indexed and why not), *Enhancements* (structured data: breadcrumbs, etc.).

A URL-prefix property (`https://sisma.io/`) can instead be verified with a meta tag: put the tag's `content` value
into Vercel env `GOOGLE_SITE_VERIFICATION` (Production) and redeploy.

## Bing Webmaster Tools (also feeds DuckDuckGo, Yahoo and Ecosia results)

1. bing.com/webmasters → sign in → **Import from Google Search Console** (quickest: imports the verified site and its
   sitemap). Or *Add site* → `https://sisma.io` and verify one of these ways:
   - *HTML meta tag*: copy the `content` value of the `msvalidate.01` tag into Vercel env `BING_SITE_VERIFICATION`
     (Production), redeploy, then *Verify*.
   - *DNS (CNAME)*: add the record Bing shows in Vercel → Domains → sisma.io (or send it to Claude to add).
2. *Sitemaps* → submit `https://sisma.io/sitemap.xml` if it wasn't imported.
3. IndexNow (below) is already set up; Bing shows the submissions under *IndexNow*.

## Yandex Webmaster (optional)

webmaster.yandex.com → *Add site* → `https://sisma.io` → *Meta tag*: put the tag's `content` value into Vercel env
`YANDEX_VERIFICATION`, redeploy, *Check*. Then *Indexing → Sitemap files* → add the sitemap.

## IndexNow (Bing, Yandex, Seznam, Naver …)

After a deploy that adds or changes public pages (a new science article, a new help topic, new wording):

```
cd app
node scripts/indexnow.mjs                 # every URL in the sitemap
node scripts/indexnow.mjs /help/alerts    # or just the changed paths
```

The script checks that `https://sisma.io/c61d31aa14c556d162cb21743e2ba311.txt` is live, then submits. HTTP 200 or 202
means accepted. The key is public by design; to change it, rename the file in `app/public/`, and update
`app/src/lib/indexnow.ts` and the script. Google does not use IndexNow; it reads the sitemap.

## Checks

- `https://sisma.io/robots.txt` and `https://sisma.io/sitemap.xml` open in a browser.
- Rich Results Test (search.google.com/test/rich-results) or validator.schema.org on `https://sisma.io/` and an
  article such as `https://sisma.io/app/science/ring`.
- A page under `*.vercel.app` sends `X-Robots-Tag: noindex`; sisma.io doesn't.
