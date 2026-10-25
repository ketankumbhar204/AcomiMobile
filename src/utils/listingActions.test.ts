import { isPendingLead, showsMealsWorkspace, showsResidentialInventory } from './listingActions';

describe('my spaces listing actions', () => {
  it('keeps a pending lead off public and inventory navigation', () => {
    const lead = {
      publication: 'PENDING' as const,
      kind: 'PROPERTY' as const,
      spaceId: null,
      operationalManagementAvailable: false,
      accommodationPath: null,
      publicPath: null,
    };
    expect(isPendingLead(lead)).toBe(true);
    expect(showsResidentialInventory(lead)).toBe(false);
    expect(showsMealsWorkspace(lead)).toBe(false);
  });

  it('opens meals for a live mess and not residential inventory', () => {
    const mess = {
      publication: 'LIVE' as const,
      kind: 'MESS' as const,
      spaceType: 'MESS',
      spaceId: 'space-1',
      operationalManagementAvailable: true,
      accommodationPath: '/spaces/space-1/accommodation',
      mealsPath: '/spaces/space-1/meals',
    };
    expect(showsResidentialInventory(mess)).toBe(false);
    expect(showsMealsWorkspace(mess)).toBe(true);
  });

  it('opens accommodation for a live PG', () => {
    const pg = {
      publication: 'LIVE' as const,
      kind: 'PROPERTY' as const,
      spaceType: 'PG',
      spaceId: 'space-2',
      operationalManagementAvailable: true,
      accommodationPath: '/spaces/space-2/accommodation',
      mealsPath: null,
    };
    expect(showsResidentialInventory(pg)).toBe(true);
    expect(showsMealsWorkspace(pg)).toBe(false);
  });
});
