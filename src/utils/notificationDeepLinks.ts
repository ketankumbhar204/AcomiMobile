import type { PendingActionGroup, SpaceNotification, UUID } from '../api/types';
import { navigateMainStack } from '../navigation/mainStackNavigation';
import { navigateToMembersTab, navigateToPaymentsTab } from '../navigation/navigationRef';
import { extractIsoDateFromText } from './extractIsoDateFromText';
import { tomorrowIsoDate } from './mealDates';
import { isOwnerOnlyNotificationType } from './ownerOnlyNotifications';

type NotificationLike = Pick<
  SpaceNotification,
  'notificationType' | 'entityId' | 'actionRoute' | 'message' | 'title'
>;

/**
 * Central deep-link resolver for inbox notifications and Pending Action groups.
 */
export function navigateFromNotificationType(
  spaceId: UUID,
  notification: NotificationLike,
  isOperator: boolean,
): void {
  if (!isOperator && isOwnerOnlyNotificationType(notification.notificationType)) {
    return;
  }

  const entityId = notification.entityId;
  const tomorrow = tomorrowIsoDate();

  switch (notification.notificationType) {
    case 'PAYMENT_UPDATE_REQUESTED':
    case 'PAYMENT_APPROVED':
    case 'PAYMENT_REJECTED':
    case 'PAYMENT_SUBMITTED':
      if (entityId) {
        navigateMainStack('PaymentDetail', { spaceId, paymentId: entityId });
      } else {
        navigateToPaymentsTab(spaceId);
      }
      return;
    case 'PAYMENT_NEEDS_REVIEW':
      navigateToPaymentsTab(spaceId, { initialSection: 'submitted' });
      return;
    case 'PAYMENT_NEEDS_UPDATE':
      navigateToPaymentsTab(spaceId, { initialSection: 'changesRequested' });
      return;
    case 'PAYMENT_OVERDUE':
      navigateToPaymentsTab(spaceId, { initialSection: 'members' });
      return;
    case 'MENU_NOT_PLANNED':
    case 'MEAL_RESPONSES_BELOW_THRESHOLD':
    case 'MEAL_POLL_NOT_PUBLISHED':
      navigateMainStack('MenuPlanning', { spaceId, menuDate: tomorrow });
      return;
    case 'MENU_DRAFT_PENDING_PUBLISH':
      navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrow });
      return;
    case 'MEAL_POLL_PUBLISHED':
    case 'MEAL_POLL_REMINDER': {
      const menuDate = extractIsoDateFromText(
        notification.message,
        notification.title,
        notification.actionRoute,
      );
      navigateMainStack(
        'DailyMenuToday',
        menuDate ? { spaceId, menuDate } : { spaceId },
      );
      return;
    }
    case 'SUBSCRIPTION_ACTIVATION_PENDING':
      navigateMainStack('SubscriptionActivationRequests', { spaceId });
      return;
    case 'COMPLAINT_PENDING':
    case 'COMPLAINT_OVERDUE':
    case 'COMPLAINT_CREATED':
    case 'COMPLAINT_COMMENTED':
    case 'COMPLAINT_RESOLVED':
      if (entityId) {
        navigateMainStack('ComplaintDetail', { spaceId, complaintId: entityId });
      }
      return;
    case 'MOVE_IN_SCHEDULED_TODAY':
    case 'RESERVATION_STARTING_TODAY':
    case 'RESERVATION_CREATED':
    case 'MOVE_IN_COMPLETED':
      navigateMainStack('DashboardOccupancyList', { spaceId, mode: 'moveInsThisMonth' });
      return;
    case 'MOVE_OUT_SCHEDULED_TODAY':
    case 'MOVE_OUT_COMPLETED':
    case 'VACANT_RESERVED_BED':
    case 'EXPIRED_RESERVATION':
      navigateMainStack('DashboardOccupancyList', { spaceId, mode: 'active' });
      return;
    case 'PENDING_INVITATION':
      if (isOperator) {
        navigateToMembersTab(spaceId);
      } else {
        navigateMainStack('AcceptInvitations', undefined);
      }
      return;
    case 'INVITATION_ACCEPTED':
      navigateToMembersTab(spaceId);
      return;
    case 'TENANT_PROFILE_INCOMPLETE':
    case 'TENANT_PROFILE_COMPLETED':
    case 'MISSING_KYC_DOCUMENTS':
    case 'MISSING_ADDRESS_PROOF':
      navigateMainStack('Profile', undefined);
      return;
    default:
      if (notification.actionRoute === 'PaymentDetail' && entityId) {
        navigateMainStack('PaymentDetail', { spaceId, paymentId: entityId });
      } else if (notification.actionRoute === 'ComplaintDetail' && entityId) {
        navigateMainStack('ComplaintDetail', { spaceId, complaintId: entityId });
      } else if (notification.actionRoute === 'Members') {
        navigateToMembersTab(spaceId);
      } else if (notification.actionRoute === 'AcceptInvitations') {
        navigateMainStack('AcceptInvitations', undefined);
      } else if (notification.actionRoute === 'DashboardOccupancyList') {
        navigateMainStack('DashboardOccupancyList', { spaceId, mode: 'active' });
      } else if (notification.actionRoute === 'MenuPlanning') {
        navigateMainStack('MenuPlanning', { spaceId, menuDate: tomorrow });
      } else if (notification.actionRoute === 'MenuSharePreview') {
        navigateMainStack('MenuSharePreview', { spaceId, menuDate: tomorrow });
      } else if (notification.actionRoute === 'SubscriptionActivationRequests') {
        navigateMainStack('SubscriptionActivationRequests', { spaceId });
      }
  }
}

export function navigateFromPendingActionGroup(
  spaceId: UUID,
  group: PendingActionGroup,
  isOperator: boolean,
): void {
  const sample = group.items[0];
  navigateFromNotificationType(
    spaceId,
    {
      notificationType: group.actionType,
      entityId: sample?.entityId,
      actionRoute: group.actionRoute,
      message: sample?.message,
      title: sample?.title ?? group.title,
    },
    isOperator,
  );
}
