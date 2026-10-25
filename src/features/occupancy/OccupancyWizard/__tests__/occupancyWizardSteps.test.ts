import { getWizardSteps, getWizardTitleKey } from '../occupancyWizardSteps';
import {
  shouldBlockOccupancyWizardBoot,
  shouldRefetchAllocationTarget,
} from '../../../../utils/occupancyWizardBoot';
import fs from 'fs';
import path from 'path';

describe('occupancyWizardSteps', () => {
  it('keeps allocate member step when a bed is already chosen', () => {
    expect(
      getWizardSteps('ALLOCATE', { bedId: 'bed-1' }),
    ).toEqual(['member', 'contract', 'review']);
  });

  it('uses Move In today title for allocate', () => {
    expect(getWizardTitleKey('ALLOCATE')).toBe('occupancyWizard.title.allocate');
  });

  it('reserves through the same wizard once a bed is chosen', () => {
    expect(getWizardSteps('RESERVE', { bedId: 'bed-1' })).toEqual([
      'member',
      'reserve_dates',
      'review',
    ]);
    expect(getWizardTitleKey('RESERVE')).toBe('occupancyWizard.title.reserve');
  });
});

describe('occupancy wizard boot from a known bed', () => {
  it('does not block the member step when the bed is already known', () => {
    expect(shouldBlockOccupancyWizardBoot({})).toBe(false);
    expect(
      shouldRefetchAllocationTarget({
        bedId: 'bed-1',
        catalogKnown: true,
      }),
    ).toBe(false);
  });

  it('still loads a bed that was not already shown', () => {
    expect(
      shouldRefetchAllocationTarget({
        bedId: 'bed-1',
        catalogKnown: false,
      }),
    ).toBe(true);
  });

  it('blocks until an existing occupancy record is loaded', () => {
    expect(shouldBlockOccupancyWizardBoot({ occupancyId: 'occ-1' })).toBe(true);
    expect(shouldBlockOccupancyWizardBoot({ memberId: 'member-1' })).toBe(true);
  });

  it('closes the bed details modal without a fade and reuses its catalog', () => {
    const sheet = fs.readFileSync(
      path.join(__dirname, '../../../../components/accommodation/BedInteractionSheet.tsx'),
      'utf8',
    );
    expect(sheet).toContain('animationType="none"');
    expect(sheet).toContain('catalogKnown');
    expect(sheet).toContain('onDismissBeforeFlow={onClose}');
    expect(sheet).not.toContain('animationType="fade"');
  });
});
