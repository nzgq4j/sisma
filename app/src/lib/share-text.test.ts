import { describe, expect, it } from 'vitest';
import { emWidth, fillPost, fitLine, postWithLink } from './share-text';

const T = 'M{mag} earthquake · {place}\n{when} · {depth} deep';

describe('fillPost', () => {
  it('fills every placeholder', () => {
    expect(fillPost(T, { mag: '6.4', place: 'Easter Island', when: 'Nov 1, 2026 5:39 PM', depth: '10 km' }))
      .toBe('M6.4 earthquake · Easter Island\nNov 1, 2026 5:39 PM · 10 km deep');
  });
  it('drops fragments whose values are empty, with no dangling separator', () => {
    expect(fillPost(T, { mag: '5.0', place: '', when: 'Nov 1', depth: undefined }))
      .toBe('M5.0 earthquake\nNov 1');
  });
  it('drops a line with nothing left and never prints undefined or null', () => {
    const out = fillPost(T, { mag: '5.0', place: null });
    expect(out).toBe('M5.0 earthquake');
    expect(out).not.toMatch(/undefined|null| · $|\n$/);
  });
  it('keeps fragments without placeholders', () => {
    expect(fillPost('{a} · shared from sisma', { a: '' })).toBe('shared from sisma');
  });
});

describe('postWithLink', () => {
  it('puts the link last, after the hashtag', () => {
    expect(postWithLink('M6.4 earthquake', 'https://sisma.io/app/map?focus=x', '#earthquake'))
      .toBe('M6.4 earthquake\n#earthquake\nhttps://sisma.io/app/map?focus=x');
  });
  it('leaves out empty parts', () => {
    expect(postWithLink('  M6.4  ', 'https://sisma.io', '')).toBe('M6.4\nhttps://sisma.io');
    expect(postWithLink('', 'https://sisma.io')).toBe('https://sisma.io');
  });
});

describe('fitLine', () => {
  it('keeps the design size when the text fits', () => {
    expect(fitLine('Japan', { maxWidth: 600, size: 50, min: 34 })).toEqual({ text: 'Japan', size: 50 });
  });
  it('shrinks a long name until it fits', () => {
    const r = fitLine('Near The Coast Of Western Turkey', { maxWidth: 600, size: 50, min: 34 });
    expect(r.size).toBeLessThan(50);
    expect(r.size).toBeGreaterThanOrEqual(34);
    expect(r.text).toBe('Near The Coast Of Western Turkey');
    expect(emWidth(r.text) * r.size).toBeLessThanOrEqual(600);
  });
  it('cuts at a word and adds an ellipsis when even the smallest size is too wide', () => {
    const r = fitLine('South Sandwich Islands Region And Bouvet Island Area', { maxWidth: 500, size: 50, min: 34 });
    expect(r.size).toBe(34);
    expect(r.text.endsWith('…')).toBe(true);
    expect(r.text).not.toMatch(/\s…$/);
    expect(emWidth(r.text) * 34).toBeLessThanOrEqual(500);
  });
  it('counts CJK characters as full width', () => {
    expect(emWidth('日本')).toBe(2);
  });
});
