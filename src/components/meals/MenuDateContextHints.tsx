import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import {
  relativeMenuDateKind,
  relativeMenuDateLabelKey,
  todayIsoDate,
  tomorrowIsoDate,
} from '../../utils/mealDates';

type MenuDateContextHintsProps = {
  menuDate: string;
  onJumpToToday?: () => void;
  onJumpToTomorrow?: () => void;
  /** Show navigation links when the date is not today / tomorrow. Default true. */
  showJumpLinks?: boolean;
};

export function MenuDateContextHints({
  menuDate,
  onJumpToToday,
  onJumpToTomorrow,
  showJumpLinks = true,
}: MenuDateContextHintsProps) {
  const { t } = useTranslation();
  const kind = relativeMenuDateKind(menuDate);
  const today = todayIsoDate();
  const tomorrow = tomorrowIsoDate();

  const showGoToToday =
    showJumpLinks && kind == null && menuDate !== today && onJumpToToday != null;
  const showGoToTomorrow =
    showJumpLinks && kind == null && menuDate !== tomorrow && onJumpToTomorrow != null;

  if (kind == null && !showGoToToday && !showGoToTomorrow) {
    return null;
  }

  return (
    <View style={styles.row}>
      {kind != null ? (
        <Text style={styles.relativeLabel}>{t(relativeMenuDateLabelKey(kind))}</Text>
      ) : null}
      {showGoToToday ? (
        <Pressable onPress={onJumpToToday} hitSlop={4} accessibilityRole="button">
          <Text style={styles.jumpLink}>{t('meals.dates.goToToday')}</Text>
        </Pressable>
      ) : null}
      {showGoToTomorrow ? (
        <Pressable onPress={onJumpToTomorrow} hitSlop={4} accessibilityRole="button">
          <Text style={styles.jumpLink}>{t('meals.dates.goToTomorrow')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  relativeLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  jumpLink: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
