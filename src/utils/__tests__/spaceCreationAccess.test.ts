import { canCreateSpace } from '../spaceCreationAccess';

describe('canCreateSpace', () => {
  it('hides Add space from a member, tenant, or customer', () => {
    expect(canCreateSpace([{ membershipRole: 'TENANT' }])).toBe(false);
    expect(canCreateSpace([{ membershipRole: 'CUSTOMER' }])).toBe(false);
    expect(
      canCreateSpace([
        { membershipRole: 'TENANT' },
        { membershipRole: 'CUSTOMER' },
      ]),
    ).toBe(false);
  });

  it('does not treat staff or manager access as permission to create a space', () => {
    expect(canCreateSpace([{ membershipRole: 'STAFF' }])).toBe(false);
    expect(canCreateSpace([{ membershipRole: 'MANAGER' }])).toBe(false);
  });

  it('keeps Add space for an owner, including one who is also a tenant elsewhere', () => {
    expect(canCreateSpace([{ membershipRole: 'OWNER' }])).toBe(true);
    expect(
      canCreateSpace([
        { membershipRole: 'TENANT' },
        { membershipRole: 'OWNER' },
      ]),
    ).toBe(true);
  });

  it('allows a first space when the account has no membership yet', () => {
    expect(canCreateSpace([])).toBe(true);
  });
});
