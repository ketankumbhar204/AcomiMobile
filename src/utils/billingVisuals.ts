import {
  CircleCheckBig,
  CircleX,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Package,
  RefreshCcw,
  Undo2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { PaymentStatusVariant } from './paymentStatusTheme';

/** Lucide icon for payment status chips / timeline markers. */
export function getPaymentStatusIcon(variant: PaymentStatusVariant): LucideIcon {
  switch (variant) {
    case 'paid':
      return CircleCheckBig;
    case 'pending':
      return Clock3;
    case 'underReview':
      return ClipboardCheck;
    case 'needsUpdate':
      return RefreshCcw;
    case 'partial':
      return Undo2;
    case 'rejected':
    case 'overdue':
      return CircleX;
    case 'neutral':
    default:
      return CreditCard;
  }
}

/** Lucide icon for subscription / plan surfaces. */
export function getSubscriptionPlanIcon(): LucideIcon {
  return Package;
}
