import type { SpacePaymentResponse } from '../api/types';
import { formatPaymentDueDate, formatPaymentSubmittedAt } from './paymentHistory';
import { resolvePaymentReferenceDisplay } from './paymentReference';

export type PaymentDetailMetaRow = {
  key: string;
  labelKey: string;
  value: string;
};

export type PaymentDetailMetaOptions = {
  /** Prefetched billing period label (e.g. July 2026). */
  billingPeriodLabel?: string | null;
  /** Count of meal days included in this payment breakdown. */
  mealDaysCount?: number | null;
};

/** Shared field list for Payment Details (owner + customer). */
export function buildPaymentDetailMetaRows(
  payment: SpacePaymentResponse,
  t: (key: string, options?: Record<string, unknown>) => string,
  options?: PaymentDetailMetaOptions,
): PaymentDetailMetaRow[] {
  const rows: PaymentDetailMetaRow[] = [
    {
      key: 'type',
      labelKey: 'paymentCollection.detail.fields.type',
      value: t(`paymentCollection.type.${payment.paymentType}`),
    },
  ];

  if (options?.billingPeriodLabel) {
    rows.push({
      key: 'billingPeriod',
      labelKey: 'paymentCollection.detail.fields.billingPeriod',
      value: options.billingPeriodLabel,
    });
  }

  if (options?.mealDaysCount != null && options.mealDaysCount > 0) {
    rows.push({
      key: 'mealDays',
      labelKey: 'paymentCollection.detail.fields.mealDays',
      value: t('paymentCollection.detail.mealDaysCount', { count: options.mealDaysCount }),
    });
  }

  if (payment.billingPeriodStart && payment.billingPeriodEnd) {
    rows.push({
      key: 'periodDates',
      labelKey: 'paymentCollection.detail.fields.billingPeriodDates',
      value: `${payment.billingPeriodStart} → ${payment.billingPeriodEnd}`,
    });
  }

  if (payment.baseAmount != null) {
    rows.push({
      key: 'baseAmount',
      labelKey: 'paymentCollection.detail.fields.baseAmount',
      value: `₹${Number(payment.baseAmount).toLocaleString('en-IN')}`,
    });
  }

  if (payment.taxEnabled && payment.taxAmount != null) {
    rows.push({
      key: 'taxAmount',
      labelKey: 'paymentCollection.detail.fields.taxAmount',
      value: `₹${Number(payment.taxAmount).toLocaleString('en-IN')}${
        payment.taxRatePercent != null ? ` (${payment.taxRatePercent}%)` : ''
      }`,
    });
  }

  if (payment.isOverdue) {
    rows.push({
      key: 'overdue',
      labelKey: 'paymentCollection.detail.fields.overdue',
      value: t('paymentCollection.detail.fields.overdueDays', {
        days: payment.daysOverdue ?? 0,
      }),
    });
  }

  rows.push({
    key: 'due',
    labelKey: 'paymentCollection.detail.fields.dueDate',
    value: formatPaymentDueDate(payment.dueDate),
  });

  if (payment.paymentDate) {
    rows.push({
      key: 'paidOn',
      labelKey: 'paymentCollection.detail.fields.paymentDate',
      value: formatPaymentDueDate(payment.paymentDate),
    });
  }

  rows.push({
    key: 'submitted',
    labelKey: 'paymentCollection.detail.fields.submitted',
    value: formatPaymentSubmittedAt(payment.updatedAt || payment.createdAt),
  });

  rows.push({
    key: 'method',
    labelKey: 'paymentCollection.detail.fields.method',
    value: payment.paymentMethod
      ? t(`paymentCollection.method.${payment.paymentMethod}`)
      : t('paymentCollection.approval.methodUnknown'),
  });

  const paymentReference = resolvePaymentReferenceDisplay(payment);
  if (paymentReference) {
    rows.push({
      key: 'paymentReference',
      labelKey: 'paymentCollection.detail.fields.paymentReference',
      value: paymentReference,
    });
  }

  rows.push({
    key: 'utr',
    labelKey: 'paymentCollection.detail.fields.reference',
    value: payment.referenceNumber?.trim() || t('paymentCollection.approval.utrMissing'),
  });

  return rows;
}
