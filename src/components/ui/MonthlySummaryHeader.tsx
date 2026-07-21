import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MemberMealActivityMonthNav } from '../meals/MemberMealActivityMonthNav';
import { colors, spacing, typography } from '../../theme';
import {
  MonthlySummaryCards,
  type MonthlySummaryCardItem,
} from './MonthlySummaryCards';

type MonthlySummaryHeaderProps = {
  month: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  disableNext?: boolean;
  /** Prefer this for standard 4-KPI modules (payments, etc.). */
  cards?: MonthlySummaryCardItem[];
  /** Alternative to `cards` when metrics are built by a feature component. */
  children?: React.ReactNode;
  /** Optional caption under the KPI cards (e.g. payments hint). */
  hint?: string;
  /**
   * When false, only the KPI cards render (e.g. fixed "this month" surfaces).
   * Month navigation is shown by default.
   */
  showMonthNav?: boolean;
};

/**
 * Standard monthly summary chrome: Month navigation → summary cards → (optional hint).
 * Screens should place Filters / Tabs and Content below this header.
 */
export function MonthlySummaryHeader({
  month,
  onPreviousMonth,
  onNextMonth,
  disableNext = false,
  cards,
  children,
  hint,
  showMonthNav = true,
}: MonthlySummaryHeaderProps) {
  return (
    <View style={styles.wrap}>
      {showMonthNav ? (
        <MemberMealActivityMonthNav
          month={month}
          onPreviousMonth={onPreviousMonth}
          onNextMonth={onNextMonth}
          disableNext={disableNext}
        />
      ) : null}
      {cards != null && cards.length > 0 ? <MonthlySummaryCards cards={cards} /> : null}
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
  },
});
