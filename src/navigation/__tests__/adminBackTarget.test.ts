import { adminParentRoute } from '../adminBackTarget';

describe('adminParentRoute', () => {
  it('does not add a back target on the dashboard root', () => {
    expect(adminParentRoute('AdminDashboard')).toBeNull();
  });

  it('returns the list that opened a nested detail', () => {
    expect(adminParentRoute('AdminPropertyList')).toBe('AdminDashboard');
    expect(adminParentRoute('AdminPropertyDetail')).toBe('AdminPropertyList');
    expect(adminParentRoute('AdminEnquiryDetail')).toBe('AdminEnquiryList');
    expect(adminParentRoute('AdminAddProperty')).toBe('AdminPropertyList');
  });

  it('falls back to the dashboard when an active space is opened directly', () => {
    expect(adminParentRoute('AdminActiveSpaceDetail')).toBe('AdminDashboard');
    expect(adminParentRoute('AdminNotificationTesting')).toBe('AdminDashboard');
  });
});
