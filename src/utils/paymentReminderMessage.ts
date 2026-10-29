import type { SpacePaymentResponse } from '../api/types';
import { withAcomiAppLink } from './acomiWhatsAppAppLink';
import { formatPaymentAmount } from './paymentAmount';
import { formatPaymentDueDate } from './paymentHistory';

const TYPE_LABELS: Record<string, string> = {
  RENT: 'Rent',
  MEAL: 'Meal',
  DEPOSIT: 'Deposit',
  MAINTENANCE: 'Maintenance',
  ELECTRICITY: 'Electricity',
  SECURITY: 'Security deposit',
};

function clean(value: string | null | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function periodLabel(month: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})$/.exec(clean(month));
  if (!match) {
    return '';
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function buildPaymentReminderMessage(
  payment: Pick<
    SpacePaymentResponse,
    | 'memberName'
    | 'amount'
    | 'outstandingAmount'
    | 'currencyCode'
    | 'title'
    | 'description'
    | 'paymentType'
    | 'dueDate'
    | 'month'
  >,
): string {
  const name = clean(payment.memberName) || 'there';
  const outstanding = payment.outstandingAmount;
  const amountValue =
    outstanding != null && outstanding > 0 ? outstanding : payment.amount;
  const amount = formatPaymentAmount(amountValue, payment.currencyCode ?? 'INR') ?? 'the outstanding amount';
  const period = periodLabel(payment.month);
  let description =
    clean(payment.title) ||
    clean(payment.description) ||
    TYPE_LABELS[clean(payment.paymentType).toUpperCase()] ||
    'your payment';
  if (period && !description.toLowerCase().includes(period.toLowerCase())) {
    description = `${description} (${period})`;
  }
  const due = clean(payment.dueDate) ? formatPaymentDueDate(payment.dueDate as string) : '';
  const dueClause = due ? `, due on ${due}` : '';
  return withAcomiAppLink(
    `Hi ${name}, this is a friendly reminder regarding your payment of ${amount} for ${description}${dueClause}. Please review and complete the payment when convenient. Thank you.`,
  );
}
