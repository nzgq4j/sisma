import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import CODES from './country-codes.json';
import { worldRegion } from './world-regions';

describe('worldRegion', () => {
  it('places well-known seismic areas', () => {
    const cases: [number, number, string][] = [
      [35.7, 139.7, 'east_asia'],          // Tokyo
      [37.8, -122.4, 'north_america'],     // San Francisco
      [61.2, -149.9, 'north_america'],     // Anchorage
      [19.4, -99.1, 'north_america'],      // Mexico City
      [14.6, -90.5, 'central_america'],    // Guatemala
      [18.5, -72.3, 'central_america'],    // Haiti
      [-33.4, -70.6, 'south_america'],     // Santiago
      [37.9, 23.7, 'europe'],              // Athens
      [42.4, 13.4, 'europe'],              // L'Aquila
      [37.2, 37.0, 'middle_east'],         // Kahramanmaraş, Türkiye
      [35.7, 51.4, 'middle_east'],         // Tehran
      [27.7, 85.3, 'south_asia'],          // Kathmandu
      [43.2, 76.9, 'central_asia'],        // Almaty
      [-6.2, 106.8, 'southeast_asia'],     // Jakarta
      [14.6, 121.0, 'southeast_asia'],     // Manila
      [-41.3, 174.8, 'pacific'],           // Wellington
      [-15.2, 167.5, 'pacific'],           // Vanuatu
      [-21.1, -175.2, 'pacific'],          // Tonga (open ocean in the 1:110m outlines)
      [53.0, 158.6, 'east_asia'],          // Kamchatka
      [38.7, -27.2, 'atlantic'],           // Azores (> 300 km from mainland Portugal in these outlines)
      [64.1, -21.9, 'europe'],             // Reykjavík
      [51.8, -176.6, 'north_america'],     // Aleutian Islands (Alaska)
      [19.4, -155.3, 'pacific'],           // Hawaiʻi
      [9.0, 38.7, 'africa'],               // Addis Ababa
      [0.0, -25.0, 'atlantic'],            // Mid-Atlantic Ridge
      [-6.5, 129.5, 'southeast_asia'],     // Banda Sea
      [45.5, 151.5, 'east_asia'],          // Kuril Islands
      [-30.0, 70.0, 'indian_ocean'],       // Indian Ocean ridge
      [-65.0, 0.0, 'polar'],
    ];
    expect(cases.map(([la, lo]) => worldRegion(la, lo))).toEqual(cases.map(c => c[2]));
  });
  it('assigns every bundled country code a region', () => {
    // Any code missing from the table would fall back to an ocean region; this keeps the table complete.
    const src = readFileSync(join(__dirname, 'world-regions.ts'), 'utf8');
    const listed = new Set(src.match(/'[a-z ]+'/g)!.flatMap(s => s.slice(1, -1).split(' ')));
    const missing = [...new Set(Object.values(CODES as Record<string, string>))].filter(c => c !== 'ru' && !listed.has(c));
    expect(missing).toEqual([]);
  });
});
