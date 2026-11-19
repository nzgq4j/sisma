// NOAA tsunami warning centres: the Pacific Tsunami Warning Center (PHEB feed) and the National Tsunami Warning Center
// (PAAQ feed). Each Atom feed carries only the latest bulletin; its entry links the CAP 1.2 document, read here for the
// level (<event>), message type (Alert / Update / Cancel), incident, expiry, earthquake parameters and areas.
// Formats checked against the live feeds (tsunami.gov/events/xml/PHEBAtom.xml, PAAQAtom.xml) in November 2026.
import type { TsunamiCenter, TsunamiLevel, TsunamiMessage } from './types';

export const NOAA_FEEDS: { center: TsunamiCenter; url: string }[] = [
  { center: 'PTWC', url: 'https://www.tsunami.gov/events/xml/PHEBAtom.xml' },
  { center: 'NTWC', url: 'https://www.tsunami.gov/events/xml/PAAQAtom.xml' },
];

const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
/** Text of the first <name> element (namespace prefixes allowed), trimmed; '' when missing. */
const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${name}>`));
  return m ? decode(m[1]).trim() : '';
};
const tags = (xml: string, name: string) => [...xml.matchAll(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${name}>`, 'g'))].map(m => decode(m[1]).trim());
const attr = (el: string, name: string) => decode(el.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? '').trim();
const toHttps = (u: string) => u.trim().replace(/^http:\/\/(www\.)?tsunami\.gov\//, 'https://www.tsunami.gov/');
const time = (s: string) => { const t = Date.parse(s); return Number.isFinite(t) ? t : null; };

export interface NoaaEntry { title: string; updated: number | null; cap: string; bulletin: string; category: string }

/** The entries of an Atom feed with their CAP and bulletin links. */
export function parseNoaaAtom(xml: string): NoaaEntry[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const links = [...e.matchAll(/<link\b[^>]*>/g)].map(m => m[0]);
    const cap = links.find(l => /cap\+xml/i.test(attr(l, 'type')) || /CapXML/i.test(attr(l, 'title')));
    const bulletin = links.find(l => attr(l, 'rel') === 'alternate');
    const category = e.match(/Category:<\/strong>\s*([^<]+)/)?.[1]?.trim() ?? '';
    return { title: tag(e, 'title'), updated: time(tag(e, 'updated')), cap: cap ? toHttps(attr(cap, 'href')) : '', bulletin: bulletin ? toHttps(attr(bulletin, 'href')) : '', category };
  }).filter(e => e.cap);
}

/** CAP <event> (e.g. "Tsunami Information", "Tsunami Warning") to a level; null when it names none. */
export function noaaLevel(event: string): TsunamiLevel | null {
  const e = event.toLowerCase();
  if (e.includes('warning')) return 'warning';
  if (e.includes('threat')) return 'threat';
  if (e.includes('watch')) return 'watch';
  if (e.includes('advisory')) return 'advisory';
  if (e.includes('information') || e.includes('statement')) return 'information';
  return null;
}

/** One CAP 1.2 document from a NOAA centre. `bulletin` (from the Atom entry) is preferred over CAP <web>. */
export function parseNoaaCap(xml: string, center: TsunamiCenter, bulletin = ''): TsunamiMessage | null {
  const id = tag(xml, 'identifier'), sent = time(tag(xml, 'sent'));
  const level = noaaLevel(tag(xml, 'event'));
  if (!id || sent == null || !level) return null;
  const params = new Map<string, string>();
  for (const p of tags(xml, 'parameter')) params.set(tag(p, 'valueName'), tag(p, 'value'));
  const [lat, lon] = (params.get('EventLatLon') ?? '').split(/[ ,]+/).map(Number);
  const mag = Number(params.get('EventPreliminaryMagnitude'));
  const place = params.get('EventLocationName') ?? '';
  const areas = [...new Set(tags(xml, 'areaDesc'))].filter(a => a && a !== place).map(name => ({ name, level }));
  return {
    id: `${center.toLowerCase()}:${id}`, center, incident: `${center.toLowerCase()}:${tag(xml, 'incidents') || id}`, level,
    cancelled: tag(xml, 'msgType').toLowerCase() === 'cancel',
    title: tag(xml, 'event'), issued: sent, expires: time(tag(xml, 'expires')), origin: time(params.get('EventOriginTime') ?? ''),
    lat: Number.isFinite(lat) ? lat : null, lon: Number.isFinite(lon) ? lon : null, mag: Number.isFinite(mag) && mag > 0 ? mag : null,
    place, areas, url: bulletin || toHttps(tag(xml, 'web')),
  };
}
