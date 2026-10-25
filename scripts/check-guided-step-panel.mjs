import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const footer = source('src/components/progressive/ProgressiveWorkflowFooter.tsx');
const colors = source('src/theme/colors.ts');
const sticky = source('src/components/progressive/StickyFormActions.tsx');
const addMember = source('src/screens/AddMemberScreen.tsx');
const meals = source('src/components/meals/ProgressiveMealPlanningFooter.tsx');

assert.match(colors, /guidance:\s*\{/);
assert.match(footer, /colors\.guidance/);
assert.match(footer, /guidance\.surface/);
assert.match(footer, /StepDots/);
assert.match(footer, /primaryOnGuidanceTint/);
assert.match(footer, /secondaryOnGuidanceTint/);
assert.doesNotMatch(footer, /stickyBarChrome/);
assert.match(addMember, /ProgressiveWorkflowFooter/);
assert.match(addMember, /stepCurrent=/);
assert.match(meals, /stepCurrent=/);
assert.match(sticky, /stickyBarChrome/);
assert.doesNotMatch(sticky, /colors\.guidance/);

console.log('guided-step-panel: ok');
