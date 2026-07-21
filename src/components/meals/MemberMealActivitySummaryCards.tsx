import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MemberMealActivityMonth, PrepaidBalanceUnit } from '../../api/types';
import { formatComboPrice } from '../../utils/comboPrice';
import {
  MonthlySummaryCards,
  type MonthlySummaryCardItem,
} from '../ui/MonthlySummaryCards';
import type { MemberMealActivityView } from './MemberMealActivityTabBar';

type MemberMealActivitySummaryCardsProps = {
  view: MemberMealActivityView;
  activity: MemberMealActivityMonth | null;
  /** customer = meal counts only (no payment amounts). */
  audience?: 'owner' | 'customer';
};

function formatBalanceValue(
  amount: number | null | undefined,
  unit: PrepaidBalanceUnit | null | undefined,
  currencyCode: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (amount == null) {
    return '—';
  }
  if (unit === 'MEALS') {
    return t('dashboard.financial.mealsCount', { count: Math.round(amount) });
  }
  return formatComboPrice(amount, currencyCode) ?? '—';
}

/**
 * Builds the standard KPI order: Total → Collected → Pending amount → Count.
 */
function buildPayPerMealCards(
  activity: MemberMealActivityMonth,
  t: (key: string, options?: Record<string, unknown>) => string,
): MonthlySummaryCardItem[] {
  const summary = activity.summary;
  const currencyCode = summary.currencyCode ?? 'INR';
  return [
    {
      label: t('meals.activity.history.amountGenerated'),
      value: formatComboPrice(summary.amountGenerated, currencyCode) ?? '—',
    },
    {
      label: t('meals.activity.history.paid'),
      value: formatComboPrice(summary.paidAmount, currencyCode) ?? '—',
      tone: 'success',
    },
    {
      label: t('meals.activity.history.pending'),
      value: formatComboPrice(summary.pendingAmount, currencyCode) ?? '—',
      tone: 'pending',
    },
    {
      label: t('meals.activity.history.mealsAccepted'),
      value: String(summary.acceptedMeals),
    },
  ];
}

function buildPrepaidCards(
  activity: MemberMealActivityMonth,
  t: (key: string, options?: Record<string, unknown>) => string,
): MonthlySummaryCardItem[] {
  const summary = activity.summary;
  const currencyCode = summary.currencyCode ?? 'INR';
  return [
    {
      label: t('meals.activity.history.mealsPurchased'),
      value: formatBalanceValue(summary.balancePurchased, summary.balanceUnit, currencyCode, t),
    },
    {
      label: t('meals.activity.history.mealsConsumed'),
      value: formatBalanceValue(summary.balanceConsumed, summary.balanceUnit, currencyCode, t),
    },
    {
      label: t('meals.activity.history.mealsRemaining'),
      value: formatBalanceValue(summary.balanceRemaining, summary.balanceUnit, currencyCode, t),
      tone: 'remaining',
    },
    {
      label: t('meals.activity.history.amountPaid'),
      value: formatComboPrice(summary.amountPaidThisMonth, currencyCode) ?? '—',
      tone: 'success',
    },
  ];
}

function buildCalendarCountCards(
  activity: MemberMealActivityMonth,
  t: (key: string, options?: Record<string, unknown>) => string,
): MonthlySummaryCardItem[] {
  const summary = activity.summary;
  return [
    {
      label: t('meals.activity.acceptedMeals'),
      value: String(summary.acceptedMeals),
    },
    {
      label: t('meals.activity.pendingResponses'),
      value: String(summary.pendingResponses),
    },
    {
      label: t('meals.activity.skippedMeals'),
      value: String(summary.skippedMeals),
    },
  ];
}

export function MemberMealActivitySummaryCards({
  view,
  activity,
  audience = 'owner',
}: MemberMealActivitySummaryCardsProps) {
  const { t } = useTranslation();

  const cards = useMemo((): MonthlySummaryCardItem[] => {
    if (!activity?.summary) {
      return [];
    }
    const isPrepaid = activity.summary.balanceUnit != null;

    if (audience === 'customer') {
      return buildPayPerMealCards(activity, t);
    }

    if (view === 'history') {
      if (isPrepaid) {
        return buildPrepaidCards(activity, t);
      }
      return buildPayPerMealCards(activity, t);
    }

    return buildCalendarCountCards(activity, t);
  }, [activity, audience, t, view]);

  if (cards.length === 0) {
    return null;
  }

  return <MonthlySummaryCards cards={cards} />;
}
