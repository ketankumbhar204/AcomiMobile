import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMonthLabel } from '../../utils/memberMealActivityCalendar';

type MemberMealActivityMonthNavProps = {
  month: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  disableNext?: boolean;
};

export function MemberMealActivityMonthNav({
  month,
  onPreviousMonth,
  onNextMonth,
  disableNext = false,
}: MemberMealActivityMonthNavProps) {
  const { i18n } = useTranslation();

  return (
    <View style={styles.monthHeader}>
      <Pressable style={styles.monthNavBtn} onPress={onPreviousMonth}>
        <Text style={styles.monthNavText}>◀</Text>
      </Pressable>
      <Text style={styles.monthLabel}>{formatMonthLabel(month, i18n.language)}</Text>
      <Pressable
        style={[styles.monthNavBtn, disableNext && styles.monthNavBtnDisabled]}
        onPress={onNextMonth}
        disabled={disableNext}>
        <Text style={[styles.monthNavText, disableNext && styles.monthNavTextDisabled]}>▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  monthNavBtnDisabled: {
    opacity: 0.4,
  },
  monthNavText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 12,
  },
  monthNavTextDisabled: {
    color: colors.muted,
  },
  monthLabel: {
    ...typography.bodyStrong,
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
});
