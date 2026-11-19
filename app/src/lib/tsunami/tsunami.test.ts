import { describe, expect, it } from 'vitest';
import { noaaLevel, parseNoaaAtom, parseNoaaCap } from './noaa';
import { jmaCoordinate, jmaLevel, parseJmaDetail, parseJmaList } from './jma';
import { alertFor, incidents } from './alerts';
import type { TsunamiMessage } from './types';

// Trimmed from the live PTWC feed and CAP document (tsunami.gov, 18 Nov 2026); the structure is verbatim.
const ATOM = `<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom" xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:georss="http://www.georss.org/georss">
    <id>urn:uuid:573a1bc4-5b0d-402c-95d3-575617ac6829</id><title>        TSUNAMI INFORMATION STATEMENT NUMBER   1        </title>
    <updated>2026-11-18T02:30:47Z</updated>
   <entry>
    <title>ABOUT 94 MILES SOUTHWEST OF GUAM</title><updated>2026-11-18T02:30:47Z</updated>
<geo:lat>12.073</geo:lat>
<geo:long>143.992</geo:long>
<summary type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml">
     <strong>Category:</strong> Information<br/><strong>Bulletin Issue Time: </strong> 2026.11.18 02:30:47 UTC <br/></div></summary>
    <id>urn:uuid:c23bd481-3e1a-4962-b760-e2e69b484d1c</id><link rel="related" title="CapXML document" href="https://www.tsunami.gov/events/PHEB/2026/11/18/26322050/1/WEGM42/PHEBCAP.xml" type="application/cap+xml" />
<link rel="alternate" title="Bulletin" href="https://www.tsunami.gov/events/PHEB/2026/11/18/26322050/1/WEGM42/WEGM42.txt" type="application/xml" />
</entry>
</feed>`;

const CAP = (event = 'Tsunami Information', msgType = 'Alert', areas = '<area>\n      <areaDesc>ABOUT 94 MILES SOUTHWEST OF GUAM</areaDesc>\n      <circle>12.073,143.992 0.0</circle>\n    </area>') => `<?xml version="1.0" encoding="UTF-8" standalone="no"?><alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>PHEB-1-26322050</identifier>
  <sender>ntwc@noaa.gov</sender>
  <sent>2026-11-18T02:30:47-00:00</sent>
  <status>Actual</status>
  <msgType>${msgType}</msgType>
  <source>PTWC</source>
  <scope>Public</scope>
  <incidents>26322050</incidents>
  <info>
    <category>Geo</category>
    <event>${event}</event>
    <expires>2026-11-18T03:30:47-00:00</expires>
    <senderName>NWS PACIFIC TSUNAMI WARNING CENTER HONOLULU HI</senderName>
    <web>http://www.tsunami.gov/events/PHEB/2026/11/18/26322050/1/WEGM42/WEGM42.txt</web>
    <parameter>
      <valueName>EventLocationName</valueName>
      <value>ABOUT 94 MILES SOUTHWEST OF GUAM</value>
    </parameter>
    <parameter>
      <valueName>EventPreliminaryMagnitude</valueName>
      <value>5.9</value>
    </parameter>
    <parameter>
      <valueName>EventOriginTime</valueName>
      <value>2026-11-18T02:22:58-00:00</value>
    </parameter>
    <parameter>
      <valueName>EventLatLon</valueName>
      <value>12.073,143.992 0.000</value>
    </parameter>
    <parameter>
      <valueName>NWSUGC</valueName>
      <value>GUZ001-MPZ001&gt;003-180430-</value>
    </parameter>
    <parameter>
      <valueName>ProductDefinition</valueName>
      <value/>
    </parameter>
    ${areas}
  </info>
</alert>`;

// Trimmed from the live JMA list.json and detail file (6 Nov 2026); field names and values verbatim.
const LIST = [{ ctt: '20261106195344', eid: '20261106193937', rdt: '2026-11-06T19:53:00+09:00', ttl: '津波予報', ift: '発表', ser: 0, at: '2026-11-06T19:39:00+09:00',
  anm: '関東東方沖', acd: '472', cod: '+35.0+142.2-10000/', mag: '6.1', kind: [{ code: '310', kind: '津波予報（若干の海面変動）' }],
  json: '20261106195344_20261106193937_VTSE41_0.json', en_ttl: 'Tsunami Forecast', en_anm: 'Off the east Coast of Kanto' }];
const DETAIL = (kind = { Name: '津波予報（若干の海面変動）', Code: '71', enName: 'Tsunami Forecast' }, infoType = '発表') => ({
  Control: { Title: '津波警報・注意報・予報a', DateTime: '2026-11-06T10:53:44Z', Status: '通常' },
  Head: { Title: '津波予報', ReportDateTime: '2026-11-06T19:53:00+09:00', TargetDateTime: '2026-11-06T19:53:00+09:00', ValidDateTime: '2026-11-06T23:00:00+09:00',
    EventID: '20261106193937', InfoType: infoType, Serial: null, enTitle: 'Tsunami Forecast' },
  Body: { Tsunami: { Forecast: { Item: [{ Area: { Name: '千葉県九十九里・外房', Code: '310', enName: 'KUJUKURI AND SOTOBO AREA, CHIBA PREF.' },
    Category: { Kind: kind, LastKind: { Name: '津波なし', Code: '00', enName: 'No Tsunami risk' } }, MaxHeight: { TsunamiHeight: '<0.2' } }] } },
  Earthquake: [{ OriginTime: '2026-11-06T19:39:00+09:00', Hypocenter: { Area: { Name: '関東東方沖', Code: '472', Coordinate: '+35.0+142.2-10000/', enName: 'Off the east Coast of Kanto' } }, Magnitude: '6.1' }] },
});

describe('NOAA feeds', () => {
  it('reads the CAP and bulletin links of an Atom entry', () => {
    expect(parseNoaaAtom(ATOM)).toEqual([{ title: 'ABOUT 94 MILES SOUTHWEST OF GUAM', updated: Date.parse('2026-11-18T02:30:47Z'),
      cap: 'https://www.tsunami.gov/events/PHEB/2026/11/18/26322050/1/WEGM42/PHEBCAP.xml',
      bulletin: 'https://www.tsunami.gov/events/PHEB/2026/11/18/26322050/1/WEGM42/WEGM42.txt', category: 'Information' }]);
  });

  it('reads a CAP information statement', () => {
    const m = parseNoaaCap(CAP(), 'PTWC', 'https://www.tsunami.gov/x.txt')!;
    expect(m).toMatchObject({ id: 'ptwc:PHEB-1-26322050', center: 'PTWC', incident: 'ptwc:26322050', level: 'information', cancelled: false,
      title: 'Tsunami Information', issued: Date.parse('2026-11-18T02:30:47Z'), expires: Date.parse('2026-11-18T03:30:47Z'),
      origin: Date.parse('2026-11-18T02:22:58Z'), lat: 12.073, lon: 143.992, mag: 5.9, place: 'ABOUT 94 MILES SOUTHWEST OF GUAM', url: 'https://www.tsunami.gov/x.txt' });
    expect(m.areas).toEqual([]); // the only area is the earthquake's own location
  });

  it('reads warnings, cancellations and named coasts; falls back to CAP <web> over https', () => {
    const m = parseNoaaCap(CAP('Tsunami Warning', 'Cancel', '<area><areaDesc>Coast of Guam</areaDesc></area>'), 'PTWC')!;
    expect(m).toMatchObject({ level: 'warning', cancelled: true, areas: [{ name: 'Coast of Guam', level: 'warning' }],
      url: 'https://www.tsunami.gov/events/PHEB/2026/11/18/26322050/1/WEGM42/WEGM42.txt' });
    expect(['Tsunami Advisory', 'Tsunami Watch', 'Tsunami Threat', 'Tsunami Information Statement', 'Test'].map(noaaLevel))
      .toEqual(['advisory', 'watch', 'threat', 'information', null]);
    expect(parseNoaaCap('<alert/>', 'NTWC')).toBeNull();
  });
});

describe('JMA', () => {
  it('reads the list and a detail file', () => {
    expect(parseJmaList(LIST).map(e => e.json)).toEqual(['20261106195344_20261106193937_VTSE41_0.json']);
    expect(parseJmaList([{ eid: '1', json: '../x' }, null, 'x'])).toEqual([]);
    const m = parseJmaDetail(DETAIL(), '20261106195344_20261106193937_VTSE41_0.json')!;
    expect(m).toMatchObject({ id: 'jma:20261106195344_20261106193937_VTSE41_0', center: 'JMA', incident: 'jma:20261106193937', level: 'forecast',
      cancelled: false, title: 'Tsunami Forecast', issued: Date.parse('2026-11-06T10:53:00Z'), expires: Date.parse('2026-11-06T14:00:00Z'),
      origin: Date.parse('2026-11-06T10:39:00Z'), lat: 35, lon: 142.2, mag: 6.1, place: 'Off the east Coast of Kanto',
      areas: [{ name: 'KUJUKURI AND SOTOBO AREA, CHIBA PREF.', level: 'forecast' }] });
  });

  it('maps levels and cancellations', () => {
    expect(['Major Tsunami Warning', 'Tsunami Warning', 'Tsunami Advisory', 'Tsunami Forecast', 'No Tsunami risk'].map(jmaLevel))
      .toEqual(['major_warning', 'warning', 'advisory', 'forecast', 'none']);
    expect(parseJmaDetail(DETAIL({ Name: '', Code: '', enName: 'Tsunami Advisory' }, '取消'), 'a.json')).toMatchObject({ level: 'advisory', cancelled: true });
    expect(jmaCoordinate('-3.2+101.5-30000/')).toEqual({ lat: -3.2, lon: 101.5 });
    expect(parseJmaDetail({}, 'a.json')).toBeNull();
  });
});

describe('alerts for earthquakes', () => {
  const now = Date.parse('2026-11-18T02:40:00Z');
  const ptwc = (o: Partial<TsunamiMessage>): TsunamiMessage => ({ ...parseNoaaCap(CAP(), 'PTWC')!, ...o });
  const quake = { id: 'usgs:us1', time: Date.parse('2026-11-18T02:23:20Z'), lat: 12.2, lon: 144.1 };

  it('uses the latest message of an incident', () => {
    const list = incidents([ptwc({ id: 'a', level: 'warning', issued: 1, expires: null }), ptwc({ id: 'b', level: 'information', issued: 2, expires: null })], now);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ level: 'information', status: 'active', mag: 5.9 });
  });

  it('marks cancelled and expired incidents', () => {
    expect(incidents([ptwc({ cancelled: true })], now)[0].status).toBe('cancelled');
    expect(incidents([ptwc({})], Date.parse('2026-11-18T04:00:00Z'))[0].status).toBe('ended');
  });

  it('matches NOAA by time and distance, JMA by event id', () => {
    const list = incidents([ptwc({ level: 'warning' })], now);
    expect(alertFor(quake, list)).toMatchObject({ level: 'warning', center: 'PTWC', status: 'active' });
    expect(alertFor({ ...quake, time: quake.time + 10 * 60_000 }, list)).toBeUndefined();
    expect(alertFor({ ...quake, lat: 20 }, list)).toBeUndefined();
    const jma = incidents([parseJmaDetail(DETAIL({ Name: '', Code: '', enName: 'Tsunami Advisory' }), 'a.json')!], Date.parse('2026-11-06T11:00:00Z'));
    expect(alertFor({ id: 'usgs:x', otherIds: ['jma:20261106193937'], time: 0, lat: 0, lon: 0 }, jma)).toMatchObject({ level: 'advisory', center: 'JMA' });
  });

  it('prefers an active, more serious alert', () => {
    const list = incidents([
      ptwc({ incident: 'ptwc:1', level: 'information' }),
      { ...ptwc({}), id: 'n', center: 'NTWC', incident: 'ntwc:1', level: 'advisory' },
    ], now);
    expect(alertFor(quake, list)).toMatchObject({ level: 'advisory', center: 'NTWC' });
  });
});
