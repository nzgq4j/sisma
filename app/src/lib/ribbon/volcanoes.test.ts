import { describe, expect, it } from 'vitest';
import { decodeMixed, eruptionHistory, ribbonVolcanoes, weeklyReports } from './volcanoes';
import { GROUPS } from './shared';

// Shaped like the Smithsonian / USGS Weekly Volcanic Activity Report RSS (escaped HTML in the description).
const RSS = `<?xml version="1.0" encoding="ISO-8859-1"?><rss version="2.0"><channel><title>Weekly</title>
<pubDate>Thu, 19 Nov 2026 03:26:11 -0500</pubDate>
<item><title>Bulusan (Philippines) - Report for 12 November-18 November 2026 - New Unrest</title>
<description>&lt;p&gt;PHIVOLCS reported increased seismicity &amp;amp; weak emissions.&lt;/p&gt;
&lt;p&gt;Source: Philippine Institute of Volcanology and Seismology (PHIVOLCS) &lt;/p&gt;</description>
<guid isPermaLink="true">https://volcano.si.edu/reports_weekly.cfm#vn_273010</guid></item>
<item><title>Klyuchevskoy (Russia) - Report for 12 November-18 November 2026 - Continuing Eruptive Activity</title>
<description>&lt;p&gt;Strombolian activity continued.&lt;/p&gt;&lt;p&gt;Sources: KVERT,Tokyo VAAC&lt;/p&gt;</description>
<guid>https://volcano.si.edu/reports_weekly.cfm#vn_300260</guid></item>
<item><title>Somewhere (Nowhere) - Report for a week - Something New</title><guid>#vn_1</guid></item>
</channel></rss>`;

const volcano = (n: number, name: string, subregion: string, lat: number, lon: number, extra: Record<string, unknown> = {}) =>
  ({ properties: { Volcano_Number: n, Volcano_Name: name, Subregion: subregion, Country: 'X', Latitude: lat, Longitude: lon, Elevation: 1565, Primary_Volcano_Type: 'Stratovolcano', Last_Eruption_Year: 2026, ...extra } });

describe('volcanoes', () => {
  it('reads the weekly report: category, period, text and sources by volcano number', () => {
    const { published, reports } = weeklyReports(RSS);
    expect(published).toBe(Date.parse('Thu, 19 Nov 2026 03:26:11 -0500'));
    expect([...reports.keys()]).toEqual([273010, 300260]); // the unknown category is skipped
    const b = reports.get(273010)!;
    expect([b.name, b.category, b.period]).toEqual(['Bulusan', 'new_unrest', '12 November-18 November 2026']);
    expect(b.text).toBe('PHIVOLCS reported increased seismicity & weak emissions.');
    expect(b.sources).toBe('Philippine Institute of Volcanology and Seismology (PHIVOLCS)');
    expect(reports.get(300260)!.category).toBe('continuing');
    expect(reports.get(300260)!.sources).toBe('KVERT, Tokyo VAAC');
  });
  it('reads text that mixes Latin-1 and UTF-8 bytes', () => {
    const latin = Uint8Array.from([0x47, 0x65, 0x6f, 0x6c, 0xf3, 0x67, 0x69, 0x63, 0x6f]); // "Geológico" in Latin-1
    const utf8 = new TextEncoder().encode('Perú');
    expect(decodeMixed(new Uint8Array([...latin, 0x20, ...utf8]))).toBe('Geológico Perú');
  });
  it('counts confirmed eruptions only, with the latest start and the largest VEI', () => {
    const h = eruptionHistory({ features: [
      { properties: { Volcano_Number: 1, Activity_Type: 'Confirmed Eruption', StartDateYear: 1990, ExplosivityIndexMax: 2 } },
      { properties: { Volcano_Number: 1, Activity_Type: 'Confirmed Eruption', StartDateYear: -300, ExplosivityIndexMax: 4 } },
      { properties: { Volcano_Number: 1, Activity_Type: 'Uncertain Eruption', StartDateYear: 2020, ExplosivityIndexMax: 5 } },
    ] });
    expect(h.get(1)).toEqual({ eruptions: 2, lastConfirmed: 1990, maxVei: 4 });
  });
  it('keeps the ribbon’s subregions, places each volcano by its own position and gives the reported status', () => {
    const catalogue = { features: [
      volcano(273010, 'Bulusan', 'Eastern Philippine Volcanic Arc', 12.769, 124.056),
      volcano(300260, 'Klyuchevskoy', 'Central Kamchatka Volcanic Arc', 56.056, 160.642),
      volcano(283030, 'Fujisan', 'Izu Volcanic Arc', 35.361, 138.728, { Last_Eruption_Year: 1708 }),
      volcano(332010, 'Kilauea', 'Hawaiian-Emperor Hotspot Volcano Group', 19.421, -155.287),
    ] };
    const { reports } = weeklyReports(RSS);
    const v = ribbonVolcanoes(catalogue, new Map([[283030, { eruptions: 3, lastConfirmed: 1708, maxVei: 5 }]]), reports);
    expect(v.map(x => x.name)).toEqual(['Klyuchevskoy', 'Fujisan', 'Bulusan']); // along the route; Kilauea isn't on it
    const fuji = v.find(x => x.n === 283030)!;
    expect([fuji.lat, fuji.lon, fuji.elevation, fuji.status, GROUPS[fuji.group]]).toEqual([35.361, 138.728, 1565, 'catalogued', 'japan']);
    expect([fuji.eruptions, fuji.lastConfirmed, fuji.maxVei]).toEqual([3, 1708, 5]);
    expect(v.find(x => x.n === 273010)!.status).toBe('new_unrest');
    expect(v.find(x => x.n === 300260)!.report!.category).toBe('continuing');
    // Without the report no volcano gets a status, and none is called catalogued as if the report had been read.
    expect(ribbonVolcanoes(catalogue, new Map(), null).every(x => x.status === 'unknown')).toBe(true);
  });
});
