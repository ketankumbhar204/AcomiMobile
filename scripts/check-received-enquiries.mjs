import assert from 'node:assert/strict';
import fs from 'node:fs';

const screen = fs.readFileSync(new URL('../src/screens/ReceivedEnquiriesScreen.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(screen, /styles\.chip/);
assert.match(screen, /receivedSummary/);
assert.match(screen, /filterAllListings/);
assert.match(screen, /View enquiry/);
assert.match(screen, /spaceType === 'MESS'/);

const web = fs.readFileSync(
  new URL('../../AcomiWeb/src/modules/onboarding/pages/ReceivedEnquiriesPage.tsx', import.meta.url),
  'utf8',
);
assert.match(web, /receivedSummary/);
assert.match(web, /Search by name, property, or email/);
assert.match(web, /View enquiry/);

console.log('received enquiries layout checks passed');
