import type { TFunction } from 'i18next';
import type {
  SpacePaymentResponse,
  UniversalPaymentMethod,
  UniversalPaymentType,
  UUID,
} from '../api/types';
import { formatPaymentAmount } from './paymentHistory';

export type PaymentProofRequirements = {
  screenshotRequired: boolean;
  utrRequired: boolean;
};

export const DEFAULT_PAYMENT_PROOF_REQUIREMENTS: PaymentProofRequirements = {
  screenshotRequired: false,
  utrRequired: false,
};

export type PaymentProofSubmission = {
  proofImageBase64?: string;
  referenceNumber?: string;
  remarks?: string;
  paymentMethod?: UniversalPaymentMethod;
};

export type PaymentProofValidationError = 'screenshotRequired' | 'utrRequired';

type ResolveProofRequirementsContext = {
  spaceId?: UUID;
  paymentMethod?: UniversalPaymentMethod;
  paymentType?: UniversalPaymentType;
};

/**
 * Resolves proof field requirements for a payment submission.
 * Defaults to all-optional; future owner settings can override per space/method.
 */
export function resolvePaymentProofRequirements(
  _context?: ResolveProofRequirementsContext,
): PaymentProofRequirements {
  return DEFAULT_PAYMENT_PROOF_REQUIREMENTS;
}

export function validatePaymentProofSubmission(
  payload: PaymentProofSubmission,
  requirements: PaymentProofRequirements = DEFAULT_PAYMENT_PROOF_REQUIREMENTS,
): PaymentProofValidationError | null {
  if (requirements.screenshotRequired && !payload.proofImageBase64?.trim()) {
    return 'screenshotRequired';
  }
  if (requirements.utrRequired && !payload.referenceNumber?.trim()) {
    return 'utrRequired';
  }
  return null;
}

export function formatBillingPeriod(monthIso: string, locale?: string): string {
  const [yearPart, monthPart] = monthIso.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!year || !month) {
    return monthIso;
  }
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function formatPaidOnDate(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function mealTitleFromPayment(payment: SpacePaymentResponse): string {
  const title = payment.title.trim();
  const separatorIndex = title.indexOf(' — ');
  if (separatorIndex > 0) {
    return title.slice(0, separatorIndex).trim();
  }
  return title;
}

export function buildDefaultPaymentRemark(
  payment: SpacePaymentResponse,
  t: TFunction,
  locale?: string,
  paidOn: Date = new Date(),
  paymentMethod: UniversalPaymentMethod = 'UPI',
): string {
  const amount = formatPaymentAmount(payment.amount, payment.currencyCode);
  const date = formatPaidOnDate(paidOn, locale);
  const period = formatBillingPeriod(payment.month, locale);
  const typeLabel = t(`paymentCollection.type.${payment.paymentType}`);
  const method = t(`paymentCollection.method.${paymentMethod}`);

  switch (payment.paymentType) {
    case 'RENT':
      return t('paymentCollection.proof.defaultRemark.rent', { amount, period, date, method });
    case 'MEAL':
      return t('paymentCollection.proof.defaultRemark.meal', {
        title: mealTitleFromPayment(payment),
        amount,
        date,
        method,
      });
    case 'DEPOSIT':
      return t('paymentCollection.proof.defaultRemark.deposit', { amount, date, method });
    case 'MAINTENANCE':
      return t('paymentCollection.proof.defaultRemark.maintenance', {
        amount,
        period,
        date,
        type: typeLabel,
        method,
      });
    case 'OTHER':
    default:
      return t('paymentCollection.proof.defaultRemark.other', { amount, date, method });
  }
}
