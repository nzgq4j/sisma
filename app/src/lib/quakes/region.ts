const US_STATES = new Set('Alabama,Alaska,Arizona,Arkansas,California,CA,Colorado,Connecticut,Delaware,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming,Puerto Rico'.split(','));

/** Splits a USGS-style place ("12 km SW of Ridgecrest, CA") into title + country/region. */
export function splitPlace(place: string): { title: string; region: string } {
  const i = place.lastIndexOf(', ');
  if (i < 0) {
    const r = place.replace(/^.*?\bof\s+/i, '').replace(/^the\s+/i, '');
    return { title: place, region: r.charAt(0).toUpperCase() + r.slice(1) };
  }
  let region = place.slice(i + 2).trim();
  if (US_STATES.has(region)) region = 'United States';
  if (region === 'MX') region = 'Mexico';
  return { title: place.slice(0, i), region };
}
// TODO: replace string parsing with reverse geocoding against world-atlas polygons (point-in-polygon)
// so every source yields ISO country codes and localized country names via Intl.DisplayNames.
