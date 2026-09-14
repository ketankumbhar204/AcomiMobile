import { openPushNotification } from '../openPushNotification';

const mockMarkRead = jest.fn().mockResolvedValue({});
const mockNavigateFromNotificationType = jest.fn();
const mockSwitchSpace = jest.fn();

jest.mock('../../../api/notificationsApi', () => ({
  notificationsApi: {
    markRead: (...args: unknown[]) => mockMarkRead(...args),
  },
}));

jest.mock('../../../utils/notificationDeepLinks', () => ({
  navigateFromNotificationType: (...args: unknown[]) =>
    mockNavigateFromNotificationType(...args),
}));
jest.mock('../../../store/spaceStore', () => ({
  useSpaceStore: {
    getState: () => ({
      currentSpace: { spaceId: 'space-1', spaceType: 'PG' },
      mySpaces: [{ spaceId: 'space-1', membershipRole: 'TENANT', spaceType: 'PG' }],
      switchSpace: mockSwitchSpace,
    }),
  },
}));

jest.mock('../../../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      isAuthenticated: true,
      user: { systemRole: 'USER' },
    }),
  },
}));

jest.mock('../../../store/adminStore', () => ({
  isPlatformAdmin: () => false,
  useAdminStore: { getState: () => ({ setAdminMode: jest.fn() }) },
}));

jest.mock('../../../store/toastStore', () => ({
  useToastStore: { getState: () => ({ showToast: jest.fn() }) },
}));

jest.mock('../../../navigation/mainStackNavigation', () => ({
  navigateMainStack: jest.fn(),
}));

jest.mock('../../../utils/spacePermissions', () => ({
  findMySpaceEntry: () => ({ spaceId: 'space-1', membershipRole: 'TENANT', spaceType: 'PG' }),
  resolveSpacePermissions: () => ({}),
}));

jest.mock('../../../utils/spaceOperator', () => ({
  canManageNotifications: () => false,
}));

describe('openPushNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSwitchSpace.mockResolvedValue(true);
    mockMarkRead.mockClear();
    mockNavigateFromNotificationType.mockClear();
    mockSwitchSpace.mockClear();
  });

  it('skips space switch and routes invitation taps to deep links', async () => {
    await openPushNotification({
      type: 'PENDING_INVITATION',
      spaceId: 'space-1',
      entityId: 'inv-1',
      actionRoute: 'AcceptInvitations',
      notificationId: 'n-1',
      title: 'Space invitation',
      body: 'You were invited',
    });

    expect(mockSwitchSpace).not.toHaveBeenCalled();
    expect(mockMarkRead).toHaveBeenCalledWith('space-1', 'n-1');
    expect(mockNavigateFromNotificationType).toHaveBeenCalledWith(
      'space-1',
      expect.objectContaining({
        notificationType: 'PENDING_INVITATION',
        actionRoute: 'AcceptInvitations',
      }),
      false,
    );
  });

  it('does not switch space for SPACE_DEACTIVATED', async () => {
    await openPushNotification({
      type: 'SPACE_DEACTIVATED',
      spaceId: 'space-1',
      actionRoute: 'MySpaces',
      notificationId: 'n-2',
    });

    expect(mockSwitchSpace).not.toHaveBeenCalled();
    expect(mockNavigateFromNotificationType).toHaveBeenCalled();
  });
});
