import type {
  DayMealPaymentListItem,
  DayMealPaymentMonthSummary,
} from '../utils/dayMealPayments';
import type { MemberMealActivityMonth } from '../api/types';

export type DayMealPaymentsMonthSnapshot = {
  month: string;
  activity: MemberMealActivityMonth;
  items: DayMealPaymentListItem[];
  summary: DayMealPaymentMonthSummary;
};
