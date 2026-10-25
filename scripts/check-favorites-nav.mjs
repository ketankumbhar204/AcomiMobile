import assert from 'node:assert/strict';
import fs from 'node:fs';

const search = fs.readFileSync(new URL('../src/screens/FindAPlaceScreen.tsx', import.meta.url), 'utf8');
assert.match(search, /navigation\.navigate\('Favorites'\)/);
assert.match(search, /navigation\.favorites/);
assert.match(search, /SlidersHorizontal/);

const screen = fs.readFileSync(new URL('../src/screens/FavoritesScreen.tsx', import.meta.url), 'utf8');
assert.match(screen, /favoritesApi\.list/);
assert.match(screen, /item\.type === 'MESS'/);
assert.match(screen, /unavailable/);

console.log('mobile favorites navigation checks passed');
