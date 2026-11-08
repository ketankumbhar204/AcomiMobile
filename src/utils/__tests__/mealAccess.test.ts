import {
  canEnableMealsForMember,
  isReceivingMealsForMember,
  mealsApplicableForSpace,
  shouldShowMealAccessForMember,
} from '../mealAccess';

describe('mealsApplicableForSpace', () => {
  it('matches backend meal access: rental is the only unsupported type', () => {
    expect(mealsApplicableForSpace('RENTAL')).toBe(false);
    expect(mealsApplicableForSpace(undefined)).toBe(false);
    expect(mealsApplicableForSpace(null)).toBe(false);
    expect(mealsApplicableForSpace('PG')).toBe(true);
    expect(mealsApplicableForSpace('HOSTEL')).toBe(true);
    expect(mealsApplicableForSpace('CO_LIVING')).toBe(true);
    expect(mealsApplicableForSpace('CORPORATE_STAY')).toBe(true);
    expect(mealsApplicableForSpace('MESS')).toBe(true);
  });
});

describe('shouldShowMealAccessForMember / canEnableMealsForMember', () => {
  it('shows and enables food toggle for reserved and moved-in tenants', () => {
    expect(
      shouldShowMealAccessForMember({
        spaceType: 'PG',
        occupancyStatus: 'RESERVED',
        memberStatus: 'ACTIVE',
      }),
    ).toBe(true);
    expect(
      canEnableMealsForMember({
        spaceType: 'HOSTEL',
        occupancyStatus: 'ALLOCATED',
        memberStatus: 'ACTIVE',
      }),
    ).toBe(true);
  });

  it('hides toggle for vacated occupancy and inactive member statuses', () => {
    expect(
      shouldShowMealAccessForMember({
        spaceType: 'PG',
        occupancyStatus: 'VACATED',
        memberStatus: 'ACTIVE',
      }),
    ).toBe(false);
    expect(
      shouldShowMealAccessForMember({
        spaceType: 'PG',
        occupancyStatus: 'RESERVED',
        memberStatus: 'VACATED',
      }),
    ).toBe(false);
    expect(
      shouldShowMealAccessForMember({
        spaceType: 'PG',
        occupancyStatus: 'ALLOCATED',
        memberStatus: 'BLACKLISTED',
      }),
    ).toBe(false);
    expect(
      shouldShowMealAccessForMember({
        spaceType: 'PG',
        occupancyStatus: 'ALLOCATED',
        memberStatus: 'SUSPENDED',
      }),
    ).toBe(false);
  });
});

describe('isReceivingMealsForMember', () => {
  const active = { status: 'ACTIVE' as const };

  it('reflects food included for reserved tenants with active participation', () => {
    expect(
      isReceivingMealsForMember(active, {
        spaceType: 'PG',
        occupancyStatus: 'RESERVED',
      }),
    ).toBe(true);
  });

  it('is false when participation is off even if reserved', () => {
    expect(
      isReceivingMealsForMember({ status: 'STOPPED' } as never, {
        spaceType: 'PG',
        occupancyStatus: 'RESERVED',
      }),
    ).toBe(false);
  });
});
