import { contextualMembershipRole } from '../memberRoles';

describe('contextualMembershipRole', () => {
  it('shows Tenant for a lodging space even if the stored role is Customer', () => {
    expect(contextualMembershipRole('TENANT', 'PG')).toBe('TENANT');
    expect(contextualMembershipRole('CUSTOMER', 'HOSTEL')).toBe('TENANT');
    expect(contextualMembershipRole('CUSTOMER', 'CO_LIVING')).toBe('TENANT');
    expect(contextualMembershipRole('TENANT', 'RENTAL')).toBe('TENANT');
  });

  it('shows Customer for a mess even if the stored role is Tenant', () => {
    expect(contextualMembershipRole('CUSTOMER', 'MESS')).toBe('CUSTOMER');
    expect(contextualMembershipRole('TENANT', 'MESS')).toBe('CUSTOMER');
  });

  it('shows Member when no service context is available', () => {
    expect(contextualMembershipRole('TENANT', undefined)).toBe('MEMBER');
    expect(contextualMembershipRole('CUSTOMER', null)).toBe('MEMBER');
    expect(contextualMembershipRole(undefined, undefined)).toBe('MEMBER');
  });

  it('keeps owner, manager, and staff labels', () => {
    expect(contextualMembershipRole('OWNER', 'PG')).toBe('OWNER');
    expect(contextualMembershipRole('MANAGER', 'MESS')).toBe('MANAGER');
    expect(contextualMembershipRole('STAFF', undefined)).toBe('STAFF');
  });
});
