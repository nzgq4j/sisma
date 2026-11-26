-- Fixed search_path for the Fire Ribbon terrain helpers (advisor 0011); they use only built-in functions.
alter function ribbon_build.vec(float8, float8) set search_path = '';
alter function ribbon_build.cross3(float8[], float8[]) set search_path = '';
alter function ribbon_build.dot3(float8[], float8[]) set search_path = '';
alter function ribbon_build.unit3(float8[]) set search_path = '';
alter function ribbon_build.lat_of(float8[]) set search_path = '';
alter function ribbon_build.lon_of(float8[]) set search_path = '';
