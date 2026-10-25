import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const choice = source('src/screens/OnboardingChoiceScreen.tsx');
const createSpace = source('src/screens/CreateSpaceScreen.tsx');
const memberHome = source('src/screens/MemberHomeScreen.tsx');
const navigation = source('src/navigation/navigationRef.ts');
const access = source('src/utils/roleOnboardingAccess.ts');
const linking = source('src/navigation/linking.ts');

assert.match(choice, /resolveRoleOnboardingAccess/);
assert.match(choice, /navigation\.navigate\('CreateSpace'\)/);
assert.match(choice, /navigation\.replace\('MemberTabs'/);
assert.match(choice, /navigation\.reset\(/);
assert.match(choice, /hardwareBackPress/);
assert.match(choice, /ActivityIndicator/);
assert.doesNotMatch(choice, /AsyncStorage|hasSeenRoleSelection|onboardingDone/);

assert.match(createSpace, /navigation\.reset\(/);
assert.match(createSpace, /name: 'SpaceTabs'/);
assert.doesNotMatch(createSpace, /navigation\.replace\('SpaceTabs'/);

assert.match(memberHome, /navigation\.navigate\('CreateSpace'\)/);
assert.doesNotMatch(memberHome, /navigate\('OnboardingChoice'\)/);

assert.match(navigation, /resolveRoleOnboardingAccess/);
assert.match(access, /spaceIds\.length === 0/);
assert.doesNotMatch(access, /AsyncStorage|localStorage|accountIntent/);
assert.doesNotMatch(linking, /OnboardingChoice/);

console.log('role-onboarding-guard: ok');
