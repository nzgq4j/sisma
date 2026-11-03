// Distance units shared by the app (components/Units.tsx) and tests. Data is always stored in km.
export type Units = 'km' | 'mi';
export const KM_PER_MI = 1.609344;

/** Converts distances written into source text ("81 km SSE of Palekastro", "5 km south of Whakatane") to miles. */
export function convertKmInText(text: string, units: Units, format: (mi: number) => string = mi => String(mi)): string {
  if (units !== 'mi') return text;
  return text.replace(/\b(\d+(?:[.,]\d+)?)\s?km\b/gi, (_, n: string) => {
    const mi = Number(n.replace(',', '.')) / KM_PER_MI;
    return `${format(mi < 10 ? Math.round(mi * 10) / 10 : Math.round(mi))} mi`;
  });
}
