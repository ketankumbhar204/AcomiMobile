import { canEditEntityPhoto } from '../entityPhoto';

describe('canEditEntityPhoto', () => {
  it('allows only the account holder (OWNER)', () => {
    expect(canEditEntityPhoto('OWNER')).toBe(true);
  });

  it('rejects manager, staff, tenant, and missing roles', () => {
    expect(canEditEntityPhoto('MANAGER')).toBe(false);
    expect(canEditEntityPhoto('STAFF')).toBe(false);
    expect(canEditEntityPhoto('TENANT')).toBe(false);
    expect(canEditEntityPhoto('CUSTOMER')).toBe(false);
    expect(canEditEntityPhoto(null)).toBe(false);
    expect(canEditEntityPhoto(undefined)).toBe(false);
  });
});
