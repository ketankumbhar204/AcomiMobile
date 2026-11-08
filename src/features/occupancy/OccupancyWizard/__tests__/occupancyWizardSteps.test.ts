import { getWizardSteps, getWizardTitleKey } from '../occupancyWizardSteps';
import {
  shouldBlockOccupancyWizardBoot,
  shouldRefetchAllocationTarget,
} from '../../../../utils/occupancyWizardBoot';
import { pricingDefaultsForStayChoice } from '../../../../utils/shortStay';
import fs from 'fs';
import path from 'path';

describe('occupancyWizardSteps', () => {
  it('puts stay type before member when a bed is already chosen (ALLOCATE)', () => {
    expect(getWizardSteps('ALLOCATE', { bedId: 'bed-1' })).toEqual([
      'stay_type',
      'member',
      'stay_details',
      'contract',
      'review',
    ]);
  });

  it('puts stay type before member for RESERVE', () => {
    expect(getWizardSteps('RESERVE', { bedId: 'bed-1' })).toEqual([
      'stay_type',
      'member',
      'reserve_dates',
      'contract',
      'review',
    ]);
  });

  it('keeps stay type first when member is already known', () => {
    expect(getWizardSteps('ALLOCATE', { bedId: 'bed-1', memberId: 'm1' })).toEqual([
      'stay_type',
      'stay_details',
      'contract',
      'review',
    ]);
  });

  it('always includes stay type (shortStayEnabled option ignored)', () => {
    expect(
      getWizardSteps('ALLOCATE', { bedId: 'bed-1' }, { shortStayEnabled: false }),
    ).toEqual(['stay_type', 'member', 'stay_details', 'contract', 'review']);
    expect(
      getWizardSteps('ALLOCATE', { bedId: 'bed-1' }, { shortStayEnabled: true }),
    ).toEqual(['stay_type', 'member', 'stay_details', 'contract', 'review']);
  });

  it('uses Move In today title for allocate', () => {
    expect(getWizardTitleKey('ALLOCATE')).toBe('occupancyWizard.title.allocate');
  });

  it('includes stay type for move-in and transfer before destination pricing', () => {
    expect(getWizardSteps('MOVE_IN', { occupancyId: 'occ-1' })).toEqual([
      'stay_type',
      'stay_details',
      'contract',
      'review',
    ]);
    expect(getWizardSteps('TRANSFER', { memberId: 'm1' })).toEqual([
      'transfer_current',
      'target',
      'stay_type',
      'stay_details',
      'contract',
      'review',
    ]);
  });

  it('places target before stay type when bed is not preselected', () => {
    expect(getWizardSteps('ALLOCATE', {})).toEqual([
      'target',
      'stay_type',
      'member',
      'stay_details',
      'contract',
      'review',
    ]);
  });
});

describe('pricingDefaultsForStayChoice', () => {
  it('prefills monthly rent and deposit from bed catalog', () => {
    expect(
      pricingDefaultsForStayChoice({
        choice: 'MONTHLY',
        catalogRent: 6000,
        catalogDeposit: 3000,
      }),
    ).toEqual({
      rentSnapshot: '6000',
      depositSnapshot: '3000',
      agreedTotal: '',
      clearExpectedExit: false,
    });
  });

  it('does not prefill monthly catalog rent for Until I Leave daily rent', () => {
    expect(
      pricingDefaultsForStayChoice({
        choice: 'OPEN_ENDED',
        catalogRent: 6000,
        catalogDeposit: 3000,
      }),
    ).toEqual({
      rentSnapshot: '',
      depositSnapshot: '3000',
      agreedTotal: '',
      clearExpectedExit: true,
    });
  });

  it('does not carry monthly rent into Short Stay; deposit stays separate', () => {
    expect(
      pricingDefaultsForStayChoice({
        choice: 'SHORT',
        catalogRent: 6000,
        catalogDeposit: 3000,
      }),
    ).toEqual({
      rentSnapshot: '',
      depositSnapshot: '3000',
      agreedTotal: '',
      clearExpectedExit: true,
    });
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
