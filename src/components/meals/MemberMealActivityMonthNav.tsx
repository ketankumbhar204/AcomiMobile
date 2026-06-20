import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMonthLabel } from '../../utils/memberMealActivityCalendar';

type MemberMealActivityMonthNavProps = {
  month: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function MemberMealActivityMonthNav({
  month,
  onPreviousMonth,
  onNextMonth,
}: MemberMealActivityMonthNavProps) {
  const { i18n } = useTranslation();

  return (
    <View style={styles.monthHeader}>
      <Pressable style={styles.monthNavBtn} onPress={onPreviousMonth}>
        <Text style={styles.monthNavText}>◀</Text>
      </Pressable>
      <Text style={styles.monthLabel}>{formatMonthLabel(month, i18n.language)}</Text>
      <Pressable style={styles.monthNavBtn} onPress={onNextMonth}>
        <Text style={styles.monthNavText}>▶</Text>
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
  monthNavText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 12,
  },
  monthLabel: {
    ...typography.bodyStrong,
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
});
