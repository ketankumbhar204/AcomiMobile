import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const screen = readFileSync(join(root, 'src/screens/MySpacesScreen.tsx'), 'utf8');
const api = readFileSync(join(root, 'src/api/mySpacesApi.ts'), 'utf8');
const client = readFileSync(join(root, 'src/api/client.ts'), 'utf8');
const edit = readFileSync(join(root, 'src/screens/EditSpaceScreen.tsx'), 'utf8');

assert.match(screen, /listMyListings/);
assert.match(screen, /status: "PENDING"/);
assert.match(screen, /isPendingLead/);
assert.match(screen, /showsResidentialInventory/);
assert.match(screen, /updatePropertyLead/);
assert.match(screen, /updateMessLead/);
assert.doesNotMatch(screen, /apiClient\.post\(['"]\/spaces['"]\)/);
assert.match(api, /\/me\/listings/);
assert.match(api, /\/spaces\/my/);
assert.match(client, /ANDROID/);
assert.match(edit, /genderPolicy/);
assert.match(edit, /updateSpace/);

console.log('mobile my spaces checks passed');
