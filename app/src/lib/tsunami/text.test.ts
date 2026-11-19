import { describe, expect, it } from 'vitest';
import en from '@/i18n/messages/en.json';
import ja from '@/i18n/messages/ja.json';
import { tsunamiLine } from './text';
import type { TsunamiAlert } from './types';

const a: TsunamiAlert = { level: 'major_warning', center: 'JMA', status: 'active', title: 'Tsunami Warning', issued: 0, url: '', areas: [] };

describe('tsunami line', () => {
  it('names the level and centre, and a status that no longer applies', () => {
    expect(tsunamiLine(a, en.tsu)).toBe('Major tsunami warning · JMA');
    expect(tsunamiLine(a, ja.tsu)).toBe('大津波警報 · JMA');
    expect(tsunamiLine({ ...a, level: 'advisory', status: 'cancelled' }, en.tsu)).toBe('Tsunami advisory · JMA · Cancelled');
    expect(tsunamiLine({ ...a, level: 'information', center: 'PTWC', status: 'ended' }, en.tsu)).toBe('Tsunami information · PTWC · No longer in effect');
  });
});
