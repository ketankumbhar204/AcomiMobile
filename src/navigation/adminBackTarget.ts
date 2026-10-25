import type { AdminStackParamList } from './types';

/**
 * Parent screen when an admin route is opened with no navigation history.
 * The dashboard is the stack root and has no back target.
 */
export function adminParentRoute(
  route: keyof AdminStackParamList,
): keyof AdminStackParamList | null {
  switch (route) {
    case 'AdminDashboard':
      return null;
    case 'AdminEnquiryDetail':
      return 'AdminEnquiryList';
    case 'AdminPropertyDetail':
    case 'AdminAddProperty':
      return 'AdminPropertyList';
    case 'AdminMessDetail':
    case 'AdminAddMess':
      return 'AdminMessList';
    case 'AdminCreateTestUser':
    case 'AdminRegisteredUserDetail':
      return 'AdminRegisteredUsers';
    case 'AdminInquiryCreditRequests':
      return 'AdminInquiryCreditsConfig';
    case 'AdminNotificationTesting':
      return 'AdminDashboard';
    case 'AdminActiveSpaceDetail':
      return 'AdminDashboard';
    default:
      return 'AdminDashboard';
  }
}
