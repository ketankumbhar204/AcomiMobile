import type { LucideIcon } from 'lucide-react-native';
import {
  BadgeCheck,
  CheckCheck,
  Circle,
  CircleAlert,
  CirclePlus,
  CircleQuestionMark,
  CircleX,
  Clock3,
  History,
  Image as ImageIcon,
  Info,
  MessageCircle,
  MessageCircleWarning,
  MessageSquareWarning,
  Receipt,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  UserCheck,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react-native';
import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintTimelineEventType,
} from '../api/types';
import {
  getComplaintPriorityColor,
  getComplaintStatusColor,
} from './complaintStatus';

export function getComplaintStatusIcon(status: ComplaintStatus): LucideIcon {
  switch (status) {
    case 'OPEN':
      return Circle;
    case 'IN_PROGRESS':
      return Clock3;
    case 'RESOLVED':
      return BadgeCheck;
    case 'CLOSED':
      return CheckCheck;
    case 'CANCELLED':
      return CircleX;
    default:
      return MessageSquareWarning;
  }
}

export function getComplaintPriorityIcon(priority: ComplaintPriority): LucideIcon {
  switch (priority) {
    case 'URGENT':
      return TriangleAlert;
    case 'HIGH':
      return TriangleAlert;
    case 'MEDIUM':
      return CircleAlert;
    case 'LOW':
      return Info;
    default:
      return Info;
  }
}

/** Raise-form priority palette (Low green → Urgent red). */
export function getComplaintPriorityPickerColor(priority: ComplaintPriority): string {
  switch (priority) {
    case 'LOW':
      return '#059669';
    case 'MEDIUM':
      return '#D97706';
    case 'HIGH':
      return '#EA580C';
    case 'URGENT':
      return '#DC2626';
    default:
      return '#64748B';
  }
}

export function getComplaintCategoryIcon(category: ComplaintCategory | string): LucideIcon {
  switch (category) {
    case 'MAINTENANCE':
      return Wrench;
    case 'HOUSEKEEPING':
      return Sparkles;
    case 'FOOD':
    case 'FOOD_QUALITY':
    case 'FOOD_SERVICE':
      return UtensilsCrossed;
    case 'BILLING':
      return Receipt;
    case 'SAFETY':
      return ShieldAlert;
    case 'SERVICE':
      return MessageSquareWarning;
    case 'OTHER':
    default:
      return CircleQuestionMark;
  }
}

export function getComplaintCategoryColor(category: ComplaintCategory | string): string {
  switch (category) {
    case 'MAINTENANCE':
      return '#0369A1';
    case 'HOUSEKEEPING':
      return '#7C3AED';
    case 'FOOD':
    case 'FOOD_QUALITY':
    case 'FOOD_SERVICE':
      return '#C2410C';
    case 'BILLING':
      return '#0F766E';
    case 'SAFETY':
      return '#DC2626';
    case 'SERVICE':
      return '#2563EB';
    case 'OTHER':
    default:
      return '#64748B';
  }
}

export function getComplaintTimelineIcon(eventType: ComplaintTimelineEventType): LucideIcon {
  switch (eventType) {
    case 'CREATED':
      return CirclePlus;
    case 'STATUS_CHANGED':
      return Clock3;
    case 'COMMENTED':
      return MessageCircle;
    case 'INTERNAL_NOTE':
      return MessageCircleWarning;
    case 'ATTACHMENT_ADDED':
      return ImageIcon;
    case 'ASSIGNED':
      return UserCheck;
    case 'PRIORITY_CHANGED':
      return TriangleAlert;
    case 'REOPENED':
      return History;
    case 'RESOLVED':
      return BadgeCheck;
    case 'CLOSED':
      return CheckCheck;
    case 'CANCELLED':
      return CircleX;
    default:
      return History;
  }
}

export function getComplaintTimelineAccent(eventType: ComplaintTimelineEventType): string {
  switch (eventType) {
    case 'RESOLVED':
    case 'CLOSED':
      return getComplaintStatusColor('RESOLVED');
    case 'CANCELLED':
      return getComplaintStatusColor('CANCELLED');
    case 'ASSIGNED':
      return getComplaintStatusColor('IN_PROGRESS');
    case 'PRIORITY_CHANGED':
      return getComplaintPriorityColor('HIGH');
    case 'REOPENED':
      return getComplaintStatusColor('OPEN');
    case 'INTERNAL_NOTE':
      return '#7C3AED';
    case 'ATTACHMENT_ADDED':
      return '#0EA5E9';
    default:
      return getComplaintStatusColor('IN_PROGRESS');
  }
}
