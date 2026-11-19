import { describe, expect, it } from 'vitest';
import { fetchDyfi, isUsgsEventId, parseDyfiGeoJson, parseDyfiText, usgsEventId } from './dyfi';

const box = (lon: number, lat: number): [number, number][] => [[lon, lat], [lon + 0.1, lat], [lon + 0.1, lat + 0.1], [lon, lat + 0.1], [lon, lat]];
const GEO = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [box(-122.4, 37.7)] }, properties: { cdi: 4.2, nresp: 12, dist: 20 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.0, 37.5] }, properties: { cdi: '2.1', nresp: '3' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.0, 37.5] }, properties: { cdi: 0, nresp: 3 } },
    { type: 'Feature', geometry: null, properties: { cdi: 3, nresp: 1 } },
  ],
};
const TXT = `# Columns: Geocoded box,CDI,No. of responses,Hypocentral distance,Latitude,Longitude,Suspect?,City,State
UTM:(10S 0550 4180 10000),4.1,7,25,37.76,-122.43,0,San Francisco,CA
UTM:(10S 0560 4180 10000),3.0,2,30,37.70,-122.30,1,Oakland,CA
UTM:(10S 0570 4180 10000),2.0,1,35,37.60,-122.20,0,,`;

describe('dyfi', () => {
  it('finds the USGS event id', () => {
    expect(usgsEventId({ id: 'usgs:us7000abcd' })).toBe('us7000abcd');
    expect(usgsEventId({ id: 'emsc:20261118_1', otherIds: ['usgs:ci123456'] })).toBe('ci123456');
    expect(usgsEventId({ id: 'emsc:20261118_1' })).toBeNull();
    expect(isUsgsEventId('us7000abcd')).toBe(true);
    expect(isUsgsEventId('../x')).toBe(false);
  });

  it('parses the 10 km GeoJSON: polygon centre and outline, numeric strings, drops invalid cells', () => {
    const cells = parseDyfiGeoJson(GEO);
    expect(cells).toHaveLength(2);
    expect(cells[0].lat).toBeCloseTo(37.75); expect(cells[0].lon).toBeCloseTo(-122.35);
    expect(cells[0]).toMatchObject({ cdi: 4.2, n: 12 });
    expect(cells[0].ring).toHaveLength(5);
    expect(cells[1]).toEqual({ lat: 37.5, lon: -122.0, cdi: 2.1, n: 3 });
    expect(parseDyfiGeoJson(null)).toEqual([]);
  });

  it('parses the text table and skips suspect rows', () => {
    expect(parseDyfiText(TXT)).toEqual([
      { cdi: 4.1, n: 7, lat: 37.76, lon: -122.43 },
      { cdi: 2.0, n: 1, lat: 37.6, lon: -122.2 },
    ]);
  });

  it('fetches the 10 km GeoJSON, else falls back to the text table', async () => {
    const detail = (contents: Record<string, { url: string }>) => ({ properties: { felt: 40, products: { dyfi: [{ properties: { 'num-responses': '41' }, contents }] } } });
    const make = (routes: Record<string, unknown>) => (async (url: string) => {
      const v = routes[Object.keys(routes).find(k => url.includes(k)) ?? ''];
      return v === undefined ? new Response('', { status: 404 }) : new Response(typeof v === 'string' ? v : JSON.stringify(v), { status: 200 });
    }) as unknown as typeof fetch;

    const a = await fetchDyfi('us1', make({ eventid: detail({ 'dyfi_geo_10km.geojson': { url: 'https://x/geo10' }, 'cdi_geo.txt': { url: 'https://x/txt' } }), geo10: GEO, '/txt': TXT }));
    expect(a).toMatchObject({ responses: 41, maxCdi: 4.2 });
    expect(a?.cells).toHaveLength(2);

    const b = await fetchDyfi('us1', make({ eventid: detail({ 'cdi_geo.txt': { url: 'https://x/txt' } }), '/txt': TXT }));
    expect(b).toMatchObject({ responses: 41, maxCdi: 4.1 });

    const none = await fetchDyfi('us1', make({ eventid: { properties: { products: {} } } }));
    expect(none).toBeNull();
  });
});
