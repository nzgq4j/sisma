import { describe, expect, it } from 'vitest';
import { onRingOfFire } from './ring-of-fire';

describe('onRingOfFire', () => {
  it.each([
    ['Tokyo', 35.7, 139.8], ['Kamchatka', 53, 159], ['Philippines', 13, 124], ['Taiwan', 23.5, 121], ['Java', -7.5, 110],
    ['Sumatra', -1, 100], ['Papua New Guinea', -6, 147], ['Vanuatu', -16, 168], ['Fiji', -18, 178.5], ['Tonga', -21, -175],
    ['Kermadec', -30, -177.5], ['New Zealand', -41, 174], ['Aleutians', 52, -175], ['Anchorage', 61.2, -150],
    ['Seattle', 47.6, -122.3], ['Cascadia offshore', 44, -125], ['San Francisco', 37.8, -122.4], ['Mexico City', 19.4, -99.1],
    ['Guatemala', 14.6, -90.5], ['Ecuador', -1, -79], ['Lima', -12, -77], ['Santiago', -33.4, -70.6], ['Valdivia', -39.8, -73.2],
  ])('includes %s', (_, lat, lon) => expect(onRingOfFire(lat, lon)).toBe(true));

  it.each([
    ['Hawaii', 19.4, -155.3], ['Easter Island', -27.1, -109.4], ['East Pacific Rise', -20, -113], ['Italy', 42, 13],
    ['Turkey', 38, 37], ['Iceland', 64, -18], ['Puerto Rico', 18.2, -66.5], ['Mid-Atlantic Ridge', 0, -20],
    ['Nepal', 28, 84], ['Iran', 32, 53], ['South Sandwich Islands', -57, -26], ['New York', 40.7, -74],
  ])('leaves out %s', (_, lat, lon) => expect(onRingOfFire(lat, lon)).toBe(false));

  it('wraps longitudes past 180°', () => {
    expect(onRingOfFire(-21, 185)).toBe(true); // = -175, Tonga
    expect(onRingOfFire(35.7, -220.2)).toBe(true); // = 139.8, Tokyo
  });
});
