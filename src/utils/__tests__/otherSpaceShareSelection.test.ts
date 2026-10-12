import fs from 'fs';
import path from 'path';
import {
  defaultOtherSpaceIds,
  nextOtherSpaceSelection,
  otherSpaceSelectAllState,
  selectedShareDestinations,
  shouldOfferOtherSpaceShare,
} from '../otherSpaceShareSelection';

describe('other space share selection', () => {
  it('hides the section when the current space is the only eligible one', () => {
    expect(shouldOfferOtherSpaceShare(0)).toBe(false);
  });

  it('shows the section when another eligible space exists', () => {
    expect(shouldOfferOtherSpaceShare(1)).toBe(true);
    expect(shouldOfferOtherSpaceShare(2)).toBe(true);
  });

  it('selects every additional eligible space by default', () => {
    expect(defaultOtherSpaceIds([{ spaceId: 'b' }, { spaceId: 'c' }])).toEqual(['b', 'c']);
    expect(defaultOtherSpaceIds([])).toEqual([]);
  });

  it('shares only selected eligible destinations', () => {
    const eligible = [{ spaceId: 'b' }, { spaceId: 'c' }];
    expect(selectedShareDestinations(eligible, ['b', 'c']).map(row => row.spaceId)).toEqual([
      'b',
      'c',
    ]);
    expect(selectedShareDestinations(eligible, ['c']).map(row => row.spaceId)).toEqual(['c']);
    expect(selectedShareDestinations(eligible, []).map(row => row.spaceId)).toEqual([]);
  });

  it('selects or clears every eligible space, including ones hidden by search', () => {
    const eligible = ['a', 'b', 'c'];
    expect(otherSpaceSelectAllState(eligible, [])).toBe('none');
    expect(otherSpaceSelectAllState(eligible, ['b'])).toBe('some');
    expect(otherSpaceSelectAllState(eligible, ['a', 'b', 'c', 'gone'])).toBe('all');
    expect(nextOtherSpaceSelection(eligible, ['b'])).toEqual(['a', 'b', 'c']);
    expect(nextOtherSpaceSelection(eligible, eligible)).toEqual([]);
  });

  it('drops ineligible ids even if they were previously selected', () => {
    const eligible = [{ spaceId: 'b' }];
    expect(selectedShareDestinations(eligible, ['b', 'rental']).map(row => row.spaceId)).toEqual([
      'b',
    ]);
  });

  it('shows the section only for extra destinations and selects them in the share screens', () => {
    const mobile = fs.readFileSync(
      path.join(__dirname, '../../screens/meals/MenuSharePreviewScreen.tsx'),
      'utf8',
    );
    expect(mobile).toContain('offerOtherSpaces');
    expect(mobile).toContain('selectedShareDestinations(otherTargets, otherSpaceIds)');
    expect(mobile).toContain('defaultOtherSpaceIds');
    expect(mobile).toContain('styles.spaceRowLocked');
    const lockedAt = mobile.indexOf('styles.spaceRowLocked');
    const toggleAt = mobile.indexOf('toggleOtherSpace(space.spaceId)');
    expect(lockedAt).toBeGreaterThan(-1);
    expect(toggleAt).toBeGreaterThan(lockedAt);
  });
});
