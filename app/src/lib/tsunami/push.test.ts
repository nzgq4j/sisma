import { describe, expect, it } from 'vitest';
import en from '@/i18n/messages/en.json';
import ja from '@/i18n/messages/ja.json';
import { pushable, tsunamiMessage, PUSH_MAX_AGE } from './push';
import type { TsunamiMessage } from './types';

const m: TsunamiMessage = { id: 'ptwc:PHEB-2-1', center: 'PTWC', incident: 'ptwc:1', level: 'warning', cancelled: false, title: 'Tsunami Warning',
  issued: 1_000_000, expires: null, origin: 999_000, lat: 12, lon: 144, mag: 7.8, place: 'GUAM', areas: [], url: 'https://www.tsunami.gov/x.txt' };

describe('tsunami push', () => {
  it('writes the notification in the device language and links the earthquake', () => {
    expect(tsunamiMessage(m, 'usgs:us1', { name: 'Hagåtña', km: 42.4 }, en, 'en', 'km')).toEqual({
      title: 'Tsunami warning · PTWC', body: 'M7.8 · GUAM · 42 km from Hagåtña. Follow local authorities.',
      url: '/app/map?focus=usgs%3Aus1', tag: 'tsunami-ptwc:1' });
    const j = tsunamiMessage({ ...m, center: 'JMA', level: 'major_warning', mag: null }, null, { name: '東京', km: 300 }, ja, 'ja', 'km');
    expect(j.title).toBe('大津波警報 · JMA');
    expect(j.body).toBe('GUAM · 東京から300 km。地元当局の指示に従ってください。');
    expect(j.url).toBe('https://www.tsunami.gov/x.txt');
  });

  it('pushes only recent hazard messages with a position', () => {
    const now = m.issued + 60_000;
    expect(pushable(m, now)).toBe(true);
    expect(['information', 'forecast', 'none'].map(level => pushable({ ...m, level: level as TsunamiMessage['level'] }, now))).toEqual([false, false, false]);
    expect(pushable({ ...m, cancelled: true }, now)).toBe(false);
    expect(pushable(m, m.issued + PUSH_MAX_AGE + 1)).toBe(false);
    expect(pushable({ ...m, lat: null }, now)).toBe(false);
  });
});
