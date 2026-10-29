import { mealsApplicableForSpace } from '../mealAccess';

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
