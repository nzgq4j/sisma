# Bundled data

`plate-boundaries.json` — plate boundary lines from PB2002 (Peter Bird, *An updated digital model of plate
boundaries*, G³ 4(3) 1027, 2003, doi:10.1029/2001GC000252), via the GeoJSON conversion by Hugo Ahlenius,
Nordpil (https://github.com/fraxen/tectonicplates). Open Data Commons Attribution License 1.0.
Reduced to a single MultiLineString with coordinates rounded to 0.01°.

`lakes.json` — lakes from Natural Earth 1:50m (`ne_50m_lakes`, scalerank ≤ 3; public domain,
https://www.naturalearthdata.com). Reduced to a single MultiPolygon rounded to 0.01° by `scripts/build-lakes.mjs`.
Seas such as the Caspian, Black and Mediterranean are already water in the world-atlas country shapes.
