import {
  ACCOMMODATION_STAY_SPACE_TYPES,
  hasConcreteAllocationTarget,
  isAccommodationStaySpaceType,
  primaryAllocationTargetType,
  stayTypesAvailableForSpace,
} from '../accommodationStaySupport';
import { getAllowedTargetTypes } from '../occupancyRules';
import { getWizardSteps } from '../../features/occupancy/OccupancyWizard/occupancyWizardSteps';
import { pricingDefaultsForStayChoice } from '../shortStay';
import { mealsApplicableForSpace } from '../mealAccess';

describe('accommodation stay support across SpaceTypes', () => {
  it('covers every accommodation SpaceType and excludes MESS', () => {
    expect(ACCOMMODATION_STAY_SPACE_TYPES).toEqual([
      'PG',
      'HOSTEL',
      'CO_LIVING',
      'RENTAL',
      'CORPORATE_STAY',
    ]);
    expect(isAccommodationStaySpaceType('MESS')).toBe(false);
    expect(stayTypesAvailableForSpace('MESS')).toBe(false);
    for (const spaceType of ACCOMMODATION_STAY_SPACE_TYPES) {
      expect(stayTypesAvailableForSpace(spaceType)).toBe(true);
      expect(getAllowedTargetTypes(spaceType).length).toBeGreaterThan(0);
    }
  });

  it('maps inventory levels correctly per space type', () => {
    expect(getAllowedTargetTypes('PG')).toEqual(['BED']);
    expect(getAllowedTargetTypes('HOSTEL')).toEqual(['BED']);
    expect(getAllowedTargetTypes('CO_LIVING')).toEqual(['BED', 'ROOM']);
    expect(getAllowedTargetTypes('RENTAL')).toEqual(['UNIT']);
    expect(getAllowedTargetTypes('CORPORATE_STAY')).toEqual(['UNIT']);
    expect(getAllowedTargetTypes('MESS')).toEqual([]);
    expect(primaryAllocationTargetType('RENTAL')).toBe('UNIT');
    expect(primaryAllocationTargetType('PG')).toBe('BED');
  });

  it('treats CO_LIVING roomId as a concrete target but not PG roomId alone', () => {
    expect(hasConcreteAllocationTarget('CO_LIVING', { roomId: 'r1' })).toBe(true);
    expect(hasConcreteAllocationTarget('PG', { roomId: 'r1' })).toBe(false);
    expect(hasConcreteAllocationTarget('RENTAL', { unitId: 'u1' })).toBe(true);
    expect(hasConcreteAllocationTarget('HOSTEL', { bedId: 'b1' })).toBe(true);
  });

  it('uses stay-type-first allocate steps for bed, room, and unit targets', () => {
    expect(
      getWizardSteps('ALLOCATE', { bedId: 'b1' }, { spaceType: 'PG' }),
    ).toEqual(['stay_type', 'member', 'stay_details', 'contract', 'review']);
    expect(
      getWizardSteps('ALLOCATE', { roomId: 'r1' }, { spaceType: 'CO_LIVING' }),
    ).toEqual(['stay_type', 'member', 'stay_details', 'contract', 'review']);
    expect(
      getWizardSteps('ALLOCATE', { unitId: 'u1' }, { spaceType: 'RENTAL' }),
    ).toEqual(['stay_type', 'member', 'stay_details', 'contract', 'review']);
    expect(
      getWizardSteps('ALLOCATE', { unitId: 'u1' }, { spaceType: 'CORPORATE_STAY' }),
    ).toEqual(['stay_type', 'member', 'stay_details', 'contract', 'review']);
  });

  it('keeps transfer stay type after destination target for every accommodation type', () => {
    for (const spaceType of ACCOMMODATION_STAY_SPACE_TYPES) {
      expect(getWizardSteps('TRANSFER', { memberId: 'm1' }, { spaceType })).toEqual([
        'transfer_current',
        'target',
        'stay_type',
        'stay_details',
        'contract',
        'review',
      ]);
    }
  });

  it('applies pricing defaults the same way for every accommodation catalog source', () => {
    for (const _spaceType of ACCOMMODATION_STAY_SPACE_TYPES) {
      expect(
        pricingDefaultsForStayChoice({
          choice: 'MONTHLY',
          catalogRent: 6000,
          catalogDeposit: 3000,
        }).rentSnapshot,
      ).toBe('6000');
      expect(
        pricingDefaultsForStayChoice({
          choice: 'SHORT',
          catalogRent: 6000,
          catalogDeposit: 3000,
        }).rentSnapshot,
      ).toBe('');
      expect(
        pricingDefaultsForStayChoice({
          choice: 'OPEN_ENDED',
          catalogRent: 6000,
          catalogDeposit: 3000,
        }).rentSnapshot,
      ).toBe('');
    }
  });

  it('hides meal food participation for Rental only', () => {
    expect(mealsApplicableForSpace('RENTAL')).toBe(false);
    expect(mealsApplicableForSpace('PG')).toBe(true);
    expect(mealsApplicableForSpace('HOSTEL')).toBe(true);
    expect(mealsApplicableForSpace('CO_LIVING')).toBe(true);
    expect(mealsApplicableForSpace('CORPORATE_STAY')).toBe(true);
  });
});
