import { describe, expect, it } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { emscUnid, fetchEmscFelt, isEmscUnid, parseEmscFelt, unzip } from './emsc-felt';

const TXT = `#20170919_0000091
#thumbnails 1.0
#Correction from Bossu et al. 2016
#longitude,latitude,iraw,icorr
-99.1332,19.4319,6,7.1
-99.1332,19.4326,5,5.8
-96.133,19.1854,4,4.5
bad,line
-99.1,19.43,0,0
`;

/** A one-file zip (deflated or stored), built the way zip writers lay it out. */
function zip(name: string, text: string, deflate = true) {
  const raw = Buffer.from(text, 'utf8'), data = deflate ? deflateRawSync(raw) : raw, n = Buffer.from(name);
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(deflate ? 8 : 0, 8);
  local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(n.length, 26);
  const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(deflate ? 8 : 0, 10);
  cd.writeUInt32LE(data.length, 20); cd.writeUInt32LE(raw.length, 24); cd.writeUInt16LE(n.length, 28); cd.writeUInt32LE(0, 42);
  const cdOff = 30 + n.length + data.length;
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10);
  end.writeUInt32LE(46 + n.length, 12); end.writeUInt32LE(cdOff, 16);
  return new Uint8Array(Buffer.concat([local, n, data, cd, n, end]));
}

describe('emsc felt reports', () => {
  it('finds the EMSC unid', () => {
    expect(emscUnid({ id: 'emsc:20261118_0000342' })).toBe('20261118_0000342');
    expect(emscUnid({ id: 'usgs:us7000abcd', otherIds: ['emsc:20261118_0000342'] })).toBe('20261118_0000342');
    expect(emscUnid({ id: 'usgs:us7000abcd' })).toBeNull();
    expect(isEmscUnid('20261118_0000342')).toBe(true);
    expect(isEmscUnid('2026_1')).toBe(false);
  });

  it('groups reports into 0.1° cells with a mean corrected intensity, skipping comments and bad lines', () => {
    const r = parseEmscFelt(TXT);
    expect(r.reports).toBe(3);
    expect(r.cells).toEqual([{ lat: 19.4, lon: -99.1, n: 2, mmi: 6.5 }, { lat: 19.2, lon: -96.1, n: 1, mmi: 4.5 }]);
    expect(r.maxMmi).toBe(6.5);
  });

  it('reads deflated and stored zip entries', () => {
    expect(unzip(zip('a.txt', TXT))['a.txt']).toBe(TXT);
    expect(unzip(zip('a.txt', TXT, false))['a.txt']).toBe(TXT);
    expect(() => unzip(new Uint8Array([1, 2, 3]))).toThrow();
  });

  it('fetches the archive for the event; no archive means no reports', async () => {
    const get = (body: BodyInit | null, status = 200) => (async () => new Response(body, { status })) as unknown as typeof fetch;
    const a = await fetchEmscFelt('20170919_0000091', get(zip('20170919_0000091.txt', TXT)));
    expect(a.reports).toBe(3);
    expect((await fetchEmscFelt('20170919_0000091', get('[]'))).reports).toBe(0);
    expect((await fetchEmscFelt('20170919_0000091', get(null, 204))).cells).toEqual([]);
    await expect(fetchEmscFelt('20170919_0000091', get('x', 500))).rejects.toThrow();
  });
});
