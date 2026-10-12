import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const screen = source('src/screens/AddMemberScreen.tsx');
const picker = source('src/features/occupancy/OccupancyWizard/steps/MemberPickerStep.tsx');
const sheet = source('src/components/membership/AddPersonChoiceSheet.tsx');
const hub = source('src/screens/AddCustomersHubScreen.tsx');
const members = source('src/screens/MembersScreen.tsx');
const menu = source('src/screens/meals/MenuPlanningScreen.tsx');
const dashboard = source('src/screens/dashboard/DashboardScreen.tsx');
const health = source('src/screens/dashboard/DashboardSpaceHealthScreen.tsx');
const locked = source('src/components/ui/LockedCapabilityScreen.tsx');
const importing = source('src/screens/ImportExistingPeopleScreen.tsx');

assert.match(screen, /AddPersonChoiceSheet/);
assert.match(screen, /shouldOfferImportChoice/);
assert.match(screen, /searchImportCandidates/);
assert.match(screen, /ActivityIndicator/);
assert.match(screen, /onAddNew=\{chooseAddNew\}/);
assert.match(screen, /onImportFromAnotherSpace=\{chooseImport\}/);
assert.match(screen, /navigation\.goBack\(\)/);
assert.match(screen, /hideModeToggle/);
assert.doesNotMatch(screen, /setPickerMode\('search'\)/);
assert.match(screen, /RolePicker/);
assert.match(screen, /MemberMealBillingTypeSection/);
assert.match(screen, /function validateCreate/);
assert.match(screen, /enrollMemberInFullMeals/);

assert.match(sheet, /onRequestClose=\{onClose\}/);
assert.match(sheet, /membership\.add\.choice\.titleCustomer/);
assert.match(sheet, /membership\.add\.choice\.addNewCustomer/);
assert.match(sheet, /membership\.add\.choice\.import/);
assert.match(sheet, /importableCount/);
assert.match(sheet, /common\.cancel/);
assert.doesNotMatch(sheet, /memberApi|mealBillingApi|addMember\(/);

assert.match(picker, /allowAddNew && !hideModeToggle/);
assert.match(hub, /navigation\.replace\('AddMember', \{ spaceId \}\)/);
assert.match(members, /navigation\.navigate\('AddMember', \{ spaceId \}\)/);
assert.match(menu, /navigateMain\('AddCustomersHub', \{ spaceId \}\)/);
assert.match(dashboard, /navigateFromTab\('AddMember', \{ spaceId \}\)/);
assert.match(dashboard, /navigateFromTab\('AddCustomersHub', \{ spaceId \}\)/);
assert.match(health, /navigateFromTab\('AddMember', \{ spaceId \}\)/);
assert.match(health, /navigateFromTab\('AddCustomersHub', \{ spaceId \}\)/);
assert.match(locked, /navigateFromTab\('AddMember', \{ spaceId \}\)/);
assert.match(locked, /navigateFromTab\('AddCustomersHub', \{ spaceId \}\)/);
assert.match(importing, /initialMode: 'new'/);

console.log('add-person-choice: ok');
