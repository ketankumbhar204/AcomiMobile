import { canManageNotifications, isSpaceOperator } from '../spaceOperator';

describe('spaceOperator', () => {
  it('treats meal managers as operators', () => {
    expect(
      isSpaceOperator({
        canManageMembers: false,
        canManageMeals: true,
        canManageOccupancy: false,
        canViewSpaceOccupancies: false,
      }),
    ).toBe(true);
  });

  it('treats occupancy-only managers as operators (not meals-only gate)', () => {
    expect(
      canManageNotifications({
        canManageMembers: false,
        canManageMeals: false,
        canManageOccupancy: true,
        canViewSpaceOccupancies: false,
      }),
    ).toBe(true);
  });

  it('treats tenants as non-operators', () => {
    expect(
      isSpaceOperator({
        canManageMembers: false,
        canManageMeals: false,
        canManageOccupancy: false,
        canViewSpaceOccupancies: false,
      }),
    ).toBe(false);
  });
});
