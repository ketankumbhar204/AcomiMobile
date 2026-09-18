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
    case 'MEAL_POLL_REMINDER':
    case 'MENU_PUBLISHED': {
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
    case 'SUBSCRIPTION_ACTIVATION_APPROVED':
    case 'SUBSCRIPTION_ACTIVATION_REJECTED':
    case 'MEAL_BALANCE_UPDATED':
    case 'MEAL_PARTICIPATION_CHANGED':
      if (isOperator) {
        navigateMainStack('SubscriptionActivationRequests', { spaceId });
      } else {
        navigateMainStack('SpaceTabs', { spaceId, screen: 'Meals', params: { spaceId } });
      }
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
    case 'CONTACT_ENQUIRY_SUBMITTED':
    case 'CONTACT_ENQUIRY_SHARED':
    case 'CONTACT_ENQUIRY_REJECTED':
    case 'CONTACT_ENQUIRY_EXPIRED':
      navigateMainStack('MemberTabs', {
        screen: 'Enquiries',
        params: entityId ? { enquiryId: entityId } : undefined,
      });
      return;
    case 'INQUIRY_CREDIT_PAYMENT_APPROVED':
    case 'INQUIRY_CREDIT_PAYMENT_REJECTED':
      // Navigate to the user's inquiry credits screen so they can see the updated balance.
      navigateMainStack('InquiryCredits', undefined);
      return;
    case 'INQUIRY_CREDIT_PAYMENT_PENDING':
      // Admins reviewing a pending payment may use this; non-admins go to credits screen.
      if (isOperator) {
        // No dedicated admin screen yet — fall through to credits for now.
        navigateMainStack('InquiryCredits', undefined);
      } else {
        navigateMainStack('InquiryCredits', undefined);
      }
      return;
    case 'PAYMENT_REMINDER_SENT':
      if (entityId) {
        navigateMainStack('PaymentDetail', { spaceId, paymentId: entityId });
      } else {
        navigateToPaymentsTab(spaceId);
      }
      return;
    case 'MOVE_IN_SCHEDULED_TODAY':
    case 'RESERVATION_STARTING_TODAY':
    case 'RESERVATION_CREATED':
    case 'RESERVATION_CANCELLED':
    case 'MOVE_IN_COMPLETED':
    case 'ALLOCATION_CREATED':
      if (isOperator) {
        navigateMainStack('DashboardOccupancyList', { spaceId, mode: 'moveInsThisMonth' });
      } else {
        navigateMainStack('SpaceTabs', { spaceId, screen: 'Dashboard', params: { spaceId } });
      }
      return;
    case 'MOVE_OUT_SCHEDULED_TODAY':
    case 'MOVE_OUT_COMPLETED':
      if (isOperator) {
        navigateMainStack('DashboardOccupancyList', { spaceId, mode: 'active' });
      } else {
        navigateMainStack('SpaceTabs', { spaceId, screen: 'Dashboard', params: { spaceId } });
      }
      return;
    case 'VACANT_RESERVED_BED':
    case 'EXPIRED_RESERVATION':
      navigateMainStack('DashboardOccupancyList', { spaceId, mode: 'active' });
      return;
    case 'PENDING_INVITATION':
      if (isOperator && notification.actionRoute !== 'AcceptInvitations') {
        navigateToMembersTab(spaceId);
      } else {
        navigateMainStack('AcceptInvitations', undefined);
      }
      return;
    case 'INVITATION_ACCEPTED':
      navigateToMembersTab(spaceId);
      return;
    case 'INVITATION_EXPIRED':
    case 'MEMBERSHIP_REJECTED':
      navigateMainStack('AcceptInvitations', undefined);
      return;
    case 'MEMBERSHIP_APPROVED':
    case 'MEMBERSHIP_ROLE_CHANGED':
      navigateMainStack('SpaceTabs', { spaceId, screen: 'Dashboard', params: { spaceId } });
      return;
    case 'MEMBERSHIP_REMOVED':
    case 'SPACE_DEACTIVATED':
      navigateMainStack('MySpaces', undefined);
      return;
    case 'OWNERSHIP_TRANSFERRED':
      if (notification.actionRoute === 'MySpaces' || !isOperator) {
        navigateMainStack('MySpaces', undefined);
      } else {
        navigateMainStack('SpaceTabs', { spaceId, screen: 'Dashboard', params: { spaceId } });
      }
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
      } else if (notification.actionRoute === 'MySpaces') {
        navigateMainStack('MySpaces', undefined);
      } else if (notification.actionRoute === 'Meals') {
        navigateMainStack('SpaceTabs', { spaceId, screen: 'Meals', params: { spaceId } });
      } else if (notification.actionRoute === 'DashboardOccupancyList') {
        if (isOperator) {
          navigateMainStack('DashboardOccupancyList', { spaceId, mode: 'active' });
        } else {
          navigateMainStack('SpaceTabs', { spaceId, screen: 'Dashboard', params: { spaceId } });
        }
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
