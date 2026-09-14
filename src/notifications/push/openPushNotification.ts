import i18n from 'i18next';
import type { NotificationType } from '../../api/types';
import { notificationsApi } from '../../api/notificationsApi';
import { isPlatformAdmin, useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { navigateFromNotificationType } from '../../utils/notificationDeepLinks';
import { findMySpaceEntry, resolveSpacePermissions } from '../../utils/spacePermissions';
import { canManageNotifications } from '../../utils/spaceOperator';
import { setPendingPushPayload } from './pendingPush';
import type { PushNotificationPayload } from './pushPayload';

const MEAL_PUSH_TYPES = new Set<string>([
  'MENU_PUBLISHED',
  'MEAL_POLL_PUBLISHED',
  'MEAL_POLL_REMINDER',
  'MENU_NOT_PLANNED',
  'MENU_DRAFT_PENDING_PUBLISH',
  'MEAL_POLL_NOT_PUBLISHED',
  'MEAL_RESPONSES_BELOW_THRESHOLD',
  'SUBSCRIPTION_ACTIVATION_PENDING',
  'SUBSCRIPTION_ACTIVATION_APPROVED',
  'SUBSCRIPTION_ACTIVATION_REJECTED',
  'MEAL_BALANCE_UPDATED',
  'MEAL_PARTICIPATION_CHANGED',
]);

function shouldSkipSpaceSwitch(payload: PushNotificationPayload): boolean {
  const route = payload.actionRoute?.trim();
  if (route === 'MySpaces' || route === 'AcceptInvitations') {
    return true;
  }
  return (
    payload.type === 'SPACE_DEACTIVATED' ||
    payload.type === 'MEMBERSHIP_REMOVED' ||
    payload.type === 'INVITATION_EXPIRED' ||
    payload.type === 'MEMBERSHIP_REJECTED'
  );
}

function markReadBestEffort(payload: PushNotificationPayload): void {
  const { spaceId, notificationId } = payload;
  if (!spaceId || !notificationId) {
    return;
  }
  void notificationsApi.markRead(spaceId, notificationId).catch(() => {
    // Opening a push is best-effort; lost membership or stale ids must not block navigation.
  });
}

export async function openPushNotification(
  payload: PushNotificationPayload,
): Promise<void> {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) {
    setPendingPushPayload(payload);
    return;
  }

  if (payload.type === 'CONTACT_ENQUIRY' && isPlatformAdmin(auth.user?.systemRole)) {
    setPendingPushPayload(payload);
    useAdminStore.getState().setAdminMode(true);
    markReadBestEffort(payload);
    return;
  }

  if (
    payload.type === 'CONTACT_ENQUIRY_SUBMITTED' ||
    payload.type === 'CONTACT_ENQUIRY_SHARED' ||
    payload.type === 'CONTACT_ENQUIRY_REJECTED' ||
    payload.type === 'CONTACT_ENQUIRY_EXPIRED'
  ) {
    markReadBestEffort(payload);
    navigateMainStack('MyEnquiries', payload.entityId ? { enquiryId: payload.entityId } : undefined);
    return;
  }

  const spaceId = payload.spaceId;
  if (!spaceId) {
    useToastStore.getState().showToast(i18n.t('notifications.unavailable'));
    return;
  }

  if (shouldSkipSpaceSwitch(payload)) {
    markReadBestEffort(payload);
    navigateFromNotificationType(
      spaceId,
      {
        notificationType: (payload.type ?? '') as NotificationType,
        entityId: payload.entityId,
        actionRoute: payload.actionRoute,
        message: payload.body,
        title: payload.title ?? '',
      },
      false,
    );
    return;
  }

  const spaceStore = useSpaceStore.getState();
  if (spaceStore.currentSpace?.spaceId !== spaceId) {
    const switched = await spaceStore.switchSpace(spaceId);
    if (!switched) {
      useToastStore.getState().showToast(i18n.t('notifications.unavailable'));
      return;
    }
  }

  const latest = useSpaceStore.getState();
  if (MEAL_PUSH_TYPES.has(payload.type ?? '') && latest.currentSpace?.spaceType === 'RENTAL') {
    useToastStore.getState().showToast(i18n.t('notifications.rentalMealHidden'));
    return;
  }

  const entry = findMySpaceEntry(latest.mySpaces, spaceId);
  const permissions = resolveSpacePermissions(entry);
  const isOperator = canManageNotifications(permissions);

  markReadBestEffort(payload);
  navigateFromNotificationType(
    spaceId,
    {
      notificationType: (payload.type ?? '') as NotificationType,
      entityId: payload.entityId,
      actionRoute: payload.actionRoute,
      message: payload.body,
      title: payload.title ?? '',
    },
    isOperator,
  );
}
