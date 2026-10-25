import { navigateFromNotificationType } from '../notificationDeepLinks';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { navigateToMembersTab, navigateToPaymentsTab } from '../../navigation/navigationRef';
import { todayIsoDate } from '../mealDates';

jest.mock('../../navigation/mainStackNavigation', () => ({
  navigateMainStack: jest.fn(),
}));

jest.mock('../../navigation/navigationRef', () => ({
  navigateToMembersTab: jest.fn(),
  navigateToPaymentsTab: jest.fn(),
}));

describe('notificationDeepLinks push types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the published menu for the date in a MENU_PUBLISHED message', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'MENU_PUBLISHED',
        entityId: 'menu-1',
        actionRoute: 'DailyMenuToday',
        message: 'LUNCH · 2026-10-09 · Sunrise PG',
        title: "Today's menu is ready",
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('DailyMenuToday', {
      spaceId: 'space-1',
      menuDate: '2026-10-09',
      mealType: 'LUNCH',
    });
  });

  it('opens today when a menu notification has no date', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'MENU_PUBLISHED',
        entityId: 'menu-1',
        actionRoute: 'DailyMenuToday',
        message: "Check today's menu for Sunrise PG.",
        title: "Today's menu is ready",
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('DailyMenuToday', {
      spaceId: 'space-1',
      menuDate: todayIsoDate(),
    });
  });

  it('opens the meal poll for the space, date, and meal', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'MEAL_POLL_PUBLISHED',
        entityId: 'poll-1',
        actionRoute: 'MealPollResponse',
        message: 'DINNER · 2026-10-09 · Sunrise PG',
        title: 'Meal poll opened',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('MealPollResponse', {
      spaceId: 'space-1',
      menuDate: '2026-10-09',
      mealType: 'DINNER',
    });
  });

  it('opens member dashboard for ALLOCATION_CREATED when not an operator', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'ALLOCATION_CREATED',
        entityId: 'occ-1',
        actionRoute: 'Dashboard',
        message: 'Your room is reserved.',
        title: 'Allocation confirmed',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('SpaceTabs', {
      spaceId: 'space-1',
      screen: 'Dashboard',
      params: { spaceId: 'space-1' },
    });
  });

  it('opens AcceptInvitations for invitee PENDING_INVITATION', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'PENDING_INVITATION',
        entityId: 'inv-1',
        actionRoute: 'AcceptInvitations',
        message: 'You were invited to join Sunrise PG',
        title: 'Space invitation',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('AcceptInvitations', undefined);
  });

  it('opens Members for operator PENDING_INVITATION', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'PENDING_INVITATION',
        entityId: 'inv-1',
        actionRoute: 'Members',
        message: 'A new member has been invited to your space',
        title: 'Pending invitation',
      },
      true,
    );
    expect(navigateToMembersTab).toHaveBeenCalledWith('space-1');
  });

  it('opens PaymentDetail for PAYMENT_REMINDER_SENT when entityId is present', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'PAYMENT_REMINDER_SENT',
        entityId: 'pay-1',
        actionRoute: 'PaymentDetail',
        message: 'A payment is overdue. Open the app to review.',
        title: 'Payment reminder',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('PaymentDetail', {
      spaceId: 'space-1',
      paymentId: 'pay-1',
    });
  });

  it('falls back to Payments tab for PAYMENT_REMINDER_SENT without entityId', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'PAYMENT_REMINDER_SENT',
        entityId: undefined,
        actionRoute: 'Payments',
        message: 'A payment reminder was sent.',
        title: 'Payment reminder sent',
      },
      true,
    );
    expect(navigateToPaymentsTab).toHaveBeenCalledWith('space-1');
  });

  it('opens tenant dashboard for MOVE_OUT_COMPLETED instead of occupancy list', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'MOVE_OUT_COMPLETED',
        entityId: 'occ-1',
        actionRoute: 'Dashboard',
        message: 'Your move-out is complete.',
        title: 'Move-out completed',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('SpaceTabs', {
      spaceId: 'space-1',
      screen: 'Dashboard',
      params: { spaceId: 'space-1' },
    });
  });

  it('opens occupancy list for operator MOVE_OUT_COMPLETED', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'MOVE_OUT_COMPLETED',
        entityId: 'occ-1',
        actionRoute: 'DashboardOccupancyList',
        message: 'Ravi vacated',
        title: 'Move-out completed',
      },
      true,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('DashboardOccupancyList', {
      spaceId: 'space-1',
      mode: 'active',
    });
  });

  it('opens complaint detail', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'COMPLAINT_COMMENTED',
        entityId: 'c-1',
        actionRoute: 'ComplaintDetail',
        message: 'Leaky tap',
        title: 'New comment on your complaint',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('ComplaintDetail', {
      spaceId: 'space-1',
      complaintId: 'c-1',
    });
  });

  it('opens meals tab for customer subscription approval', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'SUBSCRIPTION_ACTIVATION_APPROVED',
        entityId: 'sub-1',
        actionRoute: 'Meals',
        message: 'Monthly 60 is now active.',
        title: 'Subscription approved',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('SpaceTabs', {
      spaceId: 'space-1',
      screen: 'Meals',
      params: { spaceId: 'space-1' },
    });
  });

  it('opens AcceptInvitations for expired invitations', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'INVITATION_EXPIRED',
        entityId: 'inv-1',
        actionRoute: 'AcceptInvitations',
        message: 'Your invitation has expired.',
        title: 'Invitation expired',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('AcceptInvitations', undefined);
  });

  it('opens the listing for a photo request and not the enquiry inbox', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'PHOTO_REQUEST_RECEIVED',
        entityId: 'space-1',
        actionRoute: 'FindAPlaceDetail',
        message: 'Someone interested in Green PG has requested photos. Open ACOMI to review the request.',
        title: 'Photo request received',
      },
      true,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('FindAPlaceDetail', { spaceId: 'space-1' });
    expect(navigateMainStack).not.toHaveBeenCalledWith(
      'MemberTabs',
      expect.anything(),
    );
  });

  it('opens MySpaces after space deactivation', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'SPACE_DEACTIVATED',
        entityId: 'space-1',
        actionRoute: 'MySpaces',
        message: 'Sunrise PG is no longer active.',
        title: 'Space closed',
      },
      false,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('MySpaces', undefined);
  });

  it('opens the listing for a photo request', () => {
    navigateFromNotificationType(
      'space-1',
      {
        notificationType: 'PHOTO_REQUEST_RECEIVED',
        entityId: 'space-1',
        actionRoute: 'FindAPlaceDetail',
        message: 'Someone interested in Green PG has requested photos. Open ACOMI to review the request.',
        title: 'Photo request received',
      },
      true,
    );
    expect(navigateMainStack).toHaveBeenCalledWith('FindAPlaceDetail', { spaceId: 'space-1' });
  });
});
