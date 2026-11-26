import { describe, expect, it } from 'vitest';
import { magTypeLabel } from './magtype';

describe('magTypeLabel', () => {
  it('writes magnitude types the conventional way', () => {
    expect(['mww', 'mw', 'mwr', 'ml', 'mb', 'md', 'm', 'mlr'].map(magTypeLabel)).toEqual(['Mww', 'Mw', 'Mwr', 'ML', 'mb', 'Md', 'M', 'MLr']);
  });
  it('falls back to plain M without a type', () => {
    expect(magTypeLabel(undefined)).toBe('M');
    expect(magTypeLabel('')).toBe('M');
  });
});
