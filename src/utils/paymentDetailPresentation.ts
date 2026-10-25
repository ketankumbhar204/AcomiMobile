import type { SpacePaymentResponse, UniversalPaymentStatus } from '../api/types';
import { displayPaymentStatus, showsPaymentOverdueCue } from './paymentStatus';
import type { PaymentStatusSource } from './paymentStatusTheme';
import { formatPaymentAmount } from './paymentAmount';
import { formatPaymentSubmittedAt } from './paymentHistory';
import { formatBillingPeriod } from './paymentProofPolicy';
import { resolvePaymentReferenceDisplay } from './paymentReference';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SUBMITTED_STATUSES = new Set<UniversalPaymentStatus>([
  'PROOF_UPLOADED',
  'UNDER_REVIEW',
  'PAID',
  'REJECTED',
  'UPDATE_REQUESTED',
]);

export type PaymentDetailMoneyTone = 'default' | 'positive' | 'danger';

export type PaymentDetailFigure = {
  key: 'base' | 'paid' | 'outstanding' | 'deposit';
  labelKey: string;
  value: string;
  tone: PaymentDetailMoneyTone;
};

export type PaymentDetailAdditionalRow = {
  key: string;
  /** Null renders the value as a plain line (unit / room). */
  labelKey: string | null;
  value: string;
};

export type PaymentDetailPresentation = {
  paymentId: string;
  tenantName: string;
  tenantInitial: string;
  tenantMobile: string | null;
  tenantPlace: string | null;
  title: string;
  status: PaymentStatusSource;
  amountLabel: string | null;
  dueDateLabel: string | null;
  billingPeriodLabel: string | null;
  overdue: { days: number; outstandingLabel: string | null } | null;
  figures: PaymentDetailFigure[];
  additional: PaymentDetailAdditionalRow[];
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type PaymentDetailPresentationOptions = {
  locale?: string;
  spaceName?: string | null;
  memberName?: string | null;
  /** Meal-title override already resolved by the screen. */
  title?: string | null;
  mealDaysCount?: number | null;
};

/** Date-only values stay on the calendar day the API sent. English matches the payment mockup. */
export function formatPaymentDetailDate(iso: string | null | undefined, locale?: string): string | null {
  const raw = iso?.trim() ?? '';
  if (!raw) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) {
    return raw;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return raw;
  }
  const language = (locale || 'en').toLowerCase();
  if (language.startsWith('en')) {
    return `${day} ${EN_MONTHS[month - 1]} ${year}`;
  }
  const date = new Date(year, month - 1, day);
  return date
    .toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/\s+/g, ' ');
}

export function splitStayLabel(label: string | null | undefined): string[] {
  const raw = label?.trim() ?? '';
  if (!raw) {
    return [];
  }
  return raw
    .split(/\s*(?:•|·|\||→|->)\s*/)
    .map(part => part.trim())
    .filter(Boolean);
}

export function paymentDetailPlaceLine(
  spaceName: string | null | undefined,
  targetLabel: string | null | undefined,
): string | null {
  const parts = [spaceName?.trim(), ...splitStayLabel(targetLabel)].filter(
    (part): part is string => Boolean(part),
  );
  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.some(existing => existing.toLowerCase() === part.toLowerCase())) {
      unique.push(part);
    }
  }
  return unique.length > 0 ? unique.join(' · ') : null;
}

export function paymentDetailInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

/**
 * Submitted proofs stay Under review. Overdue wins only for customer-action dues.
 * A settled payment keeps Paid even if the overdue flag is stale.
 */
export function paymentDetailStatus(payment: {
  isOverdue?: boolean | null;
  paymentStatus: UniversalPaymentStatus;
}): PaymentStatusSource {
  return displayPaymentStatus(payment);
}

function monthPeriodLabel(month: string | null | undefined, locale?: string): string | null {
  const value = month?.trim();
  if (!value) {
    return null;
  }
  const label = formatBillingPeriod(value, locale);
  return label.trim() || null;
}

function billingPeriodLabel(payment: SpacePaymentResponse, locale?: string): string | null {
  const start = formatPaymentDetailDate(payment.billingPeriodStart, locale);
  const end = formatPaymentDetailDate(payment.billingPeriodEnd, locale);
  if (start && end) {
    return `${start} – ${end}`;
  }
  return monthPeriodLabel(payment.month, locale);
}

function paymentHeading(title: string, periodLabel: string | null): string {
  const trimmed = title.trim();
  if (!trimmed) {
    return periodLabel ?? '';
  }
  if (!periodLabel || trimmed.toLowerCase().includes(periodLabel.toLowerCase())) {
    return trimmed;
  }
  // The API title already names the period (often in English). Don't append a
  // second, localized month onto "Rent - October 2026".
  if (/\b20\d{2}\b/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} – ${periodLabel}`;
}

/**
 * One screen card for one payment id.
 * Amounts come from the payment payload. Outstanding is never recomputed here.
 */
export function buildPaymentDetailPresentation(
  payment: SpacePaymentResponse,
  t: Translate,
  options?: PaymentDetailPresentationOptions,
): PaymentDetailPresentation {
  const locale = options?.locale;
  const currency = payment.currencyCode;
  const tenantName = (options?.memberName?.trim() || payment.memberName || '').trim();
  const periodForTitle = monthPeriodLabel(payment.month, locale);
  const titleSource = options?.title?.trim() || payment.title || '';
  const showOverdue = showsPaymentOverdueCue(payment);
  const outstandingLabel = formatPaymentAmount(payment.outstandingAmount, currency);
  const paidLabel = formatPaymentAmount(payment.paidAmount, currency);

  const figures: PaymentDetailFigure[] = [];
  if (payment.paymentType === 'DEPOSIT') {
    const deposit = formatPaymentAmount(payment.amount, currency);
    if (deposit) {
      figures.push({
        key: 'deposit',
        labelKey: 'paymentCollection.type.DEPOSIT',
        value: deposit,
        tone: 'default',
      });
    }
  } else {
    const baseSource = payment.baseAmount ?? payment.configuredMonthlyAmount;
    const base = formatPaymentAmount(baseSource, currency);
    if (base) {
      figures.push({
        key: 'base',
        labelKey: 'paymentCollection.detail.fields.baseAmount',
        value: base,
        tone: 'default',
      });
    }
  }
  if (paidLabel) {
    figures.push({
      key: 'paid',
      labelKey: 'paymentCollection.memberPayments.summary.paid',
      value: paidLabel,
      tone: 'positive',
    });
  }
  if (outstandingLabel) {
    const outstanding = Number(payment.outstandingAmount);
    figures.push({
      key: 'outstanding',
      labelKey: 'paymentCollection.memberPayments.summary.outstanding',
      value: outstandingLabel,
      tone: outstanding > 0 ? 'danger' : 'positive',
    });
  }

  const additional: PaymentDetailAdditionalRow[] = [];
  const location = splitStayLabel(payment.targetLabel).join(' · ');
  if (location) {
    additional.push({ key: 'location', labelKey: null, value: location });
  }
  additional.push({
    key: 'type',
    labelKey: 'paymentCollection.detail.fields.type',
    value: t(`paymentCollection.type.${payment.paymentType}`),
  });
  if (payment.paymentCategory) {
    additional.push({
      key: 'category',
      labelKey: 'paymentCollection.addRecord.categoryDerived',
      value: t(`paymentCollection.category.${payment.paymentCategory}`),
    });
  }

  if (payment.taxEnabled && payment.taxAmount != null) {
    const tax = formatPaymentAmount(payment.taxAmount, currency);
    if (tax) {
      const rate =
        payment.taxRatePercent != null ? ` (${payment.taxRatePercent}%)` : '';
      additional.push({
        key: 'tax',
        labelKey: 'paymentCollection.detail.fields.taxAmount',
        value: `${tax}${rate}`,
      });
    }
  }

  if (options?.mealDaysCount != null && options.mealDaysCount > 0) {
    additional.push({
      key: 'mealDays',
      labelKey: 'paymentCollection.detail.fields.mealDays',
      value: t('paymentCollection.detail.mealDaysCount', { count: options.mealDaysCount }),
    });
  }

  if (payment.isProrated && payment.billableDays != null) {
    additional.push({
      key: 'prorated',
      labelKey: 'paymentCollection.detail.fields.prorated',
      value:
        payment.daysInMonth != null
          ? t('paymentCollection.detail.fields.proratedDays', {
              days: payment.billableDays,
              total: payment.daysInMonth,
            })
          : String(payment.billableDays),
    });
  }

  const paidOn = formatPaymentDetailDate(payment.paymentDate, locale);
  if (paidOn) {
    additional.push({
      key: 'paidOn',
      labelKey: 'paymentCollection.detail.fields.paymentDate',
      value: paidOn,
    });
  }

  if (SUBMITTED_STATUSES.has(payment.paymentStatus)) {
    const submitted = formatPaymentSubmittedAt(payment.updatedAt || payment.createdAt);
    if (submitted) {
      additional.push({
        key: 'submitted',
        labelKey: 'paymentCollection.detail.fields.submitted',
        value: submitted,
      });
    }
  }

  if (payment.paymentMethod) {
    additional.push({
      key: 'method',
      labelKey: 'paymentCollection.detail.fields.method',
      value: t(`paymentCollection.method.${payment.paymentMethod}`),
    });
  }

  const reference = resolvePaymentReferenceDisplay(payment);
  if (reference) {
    additional.push({
      key: 'paymentReference',
      labelKey: 'paymentCollection.detail.fields.paymentReference',
      value: reference,
    });
  }

  const utr = payment.referenceNumber?.trim();
  if (utr) {
    additional.push({
      key: 'utr',
      labelKey: 'paymentCollection.detail.fields.reference',
      value: utr,
    });
  }

  return {
    paymentId: payment.paymentId,
    tenantName,
    tenantInitial: paymentDetailInitial(tenantName),
    tenantMobile: payment.memberMobile?.trim() || null,
    tenantPlace: paymentDetailPlaceLine(options?.spaceName, payment.targetLabel),
    title: paymentHeading(titleSource, periodForTitle),
    status: paymentDetailStatus(payment),
    amountLabel: formatPaymentAmount(payment.amount, currency),
    dueDateLabel: formatPaymentDetailDate(payment.dueDate, locale),
    billingPeriodLabel: billingPeriodLabel(payment, locale),
    overdue: showOverdue
      ? { days: payment.daysOverdue ?? 0, outstandingLabel }
      : null,
    figures,
    additional,
  };
}
