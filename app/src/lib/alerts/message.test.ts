import { describe, expect, it } from 'vitest';
import { alertMessage, formatDistance } from './message';
import type { Quake } from '../quakes/types';

const S = { title_near: 'M{mag} earthquake · {dist} from {place}', title_any: 'M{mag} earthquake', title_area: 'M{mag} earthquake · {area}', body: '{region} · {depth} deep' };
const q: Quake = { id: 'usgs:us1', source: 'usgs', mag: 5.04, title: '', region: 'Japan', time: 0, lat: 0, lon: 0, depthKm: 12.3, tsunami: false };

describe('alertMessage', () => {
  it('names the nearest saved place and distance', () => {
    const m = alertMessage(q, { name: 'Home', distanceKm: 123.4 }, S, 'en', 'km');
    expect(m.title).toBe('M5.0 earthquake · 125 km from Home');
    expect(m.body).toBe('Japan · 12 km deep');
    expect(m.url).toBe('/app/map?focus=usgs%3Aus1');
  });
  it('uses miles and the locale', () => {
    expect(alertMessage(q, { name: 'Casa', distanceKm: 16.09 }, S, 'de', 'mi').title).toBe('M5,0 earthquake · 10 mi from Casa');
    expect(alertMessage(q, null, S, 'en', 'km').title).toBe('M5.0 earthquake');
    expect(alertMessage(q, null, S, 'en', 'km', 'Japan').title).toBe('M5.0 earthquake · Japan');
  });
  it('rounds distances sensibly', () => {
    expect(formatDistance(4.26, 'km', 'en')).toBe('4.3 km');
    expect(formatDistance(47.6, 'km', 'en')).toBe('48 km');
    expect(formatDistance(1234, 'km', 'en')).toBe('1,235 km');
  });
});
