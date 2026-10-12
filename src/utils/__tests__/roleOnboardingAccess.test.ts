import { resolveRoleOnboardingAccess } from '../roleOnboardingAccess';

describe('role onboarding access', () => {
  it('lets a new account with no spaces open the choice', () => {
    expect(resolveRoleOnboardingAccess([])).toEqual({ status: 'allowed' });
    expect(resolveRoleOnboardingAccess([], null)).toEqual({ status: 'allowed' });
  });

  it('sends an account with one space to that space', () => {
    expect(resolveRoleOnboardingAccess(['owner-space'])).toEqual({
      status: 'space',
      spaceId: 'owner-space',
    });
    expect(resolveRoleOnboardingAccess(['member-space'])).toEqual({
      status: 'space',
      spaceId: 'member-space',
    });
  });

  it('uses the selected space when the account has several', () => {
    expect(resolveRoleOnboardingAccess(['a', 'b'], 'b')).toEqual({
      status: 'space',
      spaceId: 'b',
    });
  });

  it('sends several spaces without a selection to the picker', () => {
    expect(resolveRoleOnboardingAccess(['a', 'b'])).toEqual({ status: 'picker' });
    expect(resolveRoleOnboardingAccess(['a', 'b'], 'missing')).toEqual({
      status: 'picker',
    });
  });

  it('keeps a known default space closed while the membership list is still empty', () => {
    expect(resolveRoleOnboardingAccess([], 'default-space')).toEqual({
      status: 'space',
      spaceId: 'default-space',
    });
  });

  it('does not carry one account into another', () => {
    const owner = resolveRoleOnboardingAccess(['owner-space'], 'owner-space');
    const nextAccount = resolveRoleOnboardingAccess([]);
    expect(owner.status).toBe('space');
    expect(nextAccount).toEqual({ status: 'allowed' });
  });
});
