import {
  AlertTriangle,
  Bell,
  BedDouble,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DoorOpen,
  Home,
  Info,
  MailPlus,
  MessageSquareWarning,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type {
  NotificationCategory,
  NotificationType,
  SpaceType,
} from '../api/types';
import { colors } from '../theme';

/** Lucide icon for each space type (bottom-nav / hero parity). */
export function getSpaceTypeIcon(type: SpaceType): LucideIcon {
  switch (type) {
    case 'PG':
      return Home;
    case 'MESS':
      return UtensilsCrossed;
    case 'HOSTEL':
      return BedDouble;
    case 'CO_LIVING':
      return Building2;
    case 'RENTAL':
      return DoorOpen;
    default:
      return Building2;
  }
}

/** Accent color per space type — keeps hero/KPIs on-brand but distinguishable. */
export function getSpaceTypeAccent(type: SpaceType): string {
  switch (type) {
    case 'MESS':
      return '#C2410C';
    case 'HOSTEL':
      return '#7C3AED';
    case 'CO_LIVING':
      return '#2563EB';
    case 'RENTAL':
      return '#0284C7';
    case 'PG':
    default:
      return colors.teal;
  }
}

/** Soft tonal color for notification category chips / icon wells. */
export function getNotificationCategoryColor(
  category: NotificationCategory,
): string {
  switch (category) {
    case 'SUCCESS':
      return '#059669';
    case 'WARNING':
      return '#D97706';
    case 'ACTION_REQUIRED':
      return '#B45309';
    case 'ERROR':
      return '#DC2626';
    case 'INFORMATION':
    default:
      return '#2563EB';
  }
}

/** Lucide icon for a notification, keyed by type with category fallback. */
export function getNotificationIcon(
  type: NotificationType,
  category: NotificationCategory,
): LucideIcon {
  if (type.startsWith('PAYMENT')) {
    return type === 'PAYMENT_APPROVED' ? Wallet : CreditCard;
  }
  if (type.startsWith('COMPLAINT')) {
    return MessageSquareWarning;
  }
  if (
    type.startsWith('MEAL') ||
    type.startsWith('MENU') ||
    type === 'SUBSCRIPTION_ACTIVATION_PENDING'
  ) {
    return UtensilsCrossed;
  }
  if (
    type.startsWith('MOVE_') ||
    type.startsWith('RESERVATION') ||
    type === 'VACANT_RESERVED_BED' ||
    type === 'EXPIRED_RESERVATION'
  ) {
    return CalendarClock;
  }
  if (type === 'PENDING_INVITATION' || type === 'INVITATION_ACCEPTED') {
    return MailPlus;
  }
  if (
    type === 'TENANT_PROFILE_INCOMPLETE' ||
    type === 'TENANT_PROFILE_COMPLETED' ||
    type === 'MISSING_KYC_DOCUMENTS' ||
    type === 'MISSING_ADDRESS_PROOF'
  ) {
    return UserRound;
  }

  switch (category) {
    case 'SUCCESS':
      return CheckCircle2;
    case 'WARNING':
    case 'ACTION_REQUIRED':
      return AlertTriangle;
    case 'ERROR':
      return AlertTriangle;
    case 'INFORMATION':
    default:
      return Info;
  }
}

/** High-level bucket for notification quick filters. */
export type NotificationFilterId =
  | 'all'
  | 'unread'
  | 'action'
  | 'billing'
  | 'meals'
  | 'general';

export function notificationMatchesFilter(
  filter: NotificationFilterId,
  type: NotificationType,
  category: NotificationCategory,
  isUnread: boolean,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'unread':
      return isUnread;
    case 'action':
      return category === 'ACTION_REQUIRED' || category === 'ERROR';
    case 'billing':
      return type.startsWith('PAYMENT') || type === 'SUBSCRIPTION_ACTIVATION_PENDING';
    case 'meals':
      return type.startsWith('MEAL') || type.startsWith('MENU');
    case 'general':
      return (
        !type.startsWith('PAYMENT') &&
        !type.startsWith('MEAL') &&
        !type.startsWith('MENU') &&
        type !== 'SUBSCRIPTION_ACTIVATION_PENDING'
      );
    default:
      return true;
  }
}

export { Bell };
