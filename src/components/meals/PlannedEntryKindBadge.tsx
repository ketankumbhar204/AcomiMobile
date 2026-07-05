import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, typography } from '../../theme';
import {
  getPlannedEntryKind,
  plannedEntryKindI18nKey,
  type PlannedEntryKind,
} from '../../utils/plannedMenuSummary';

type PlannedEntryKindBadgeProps = {
  kind?: PlannedEntryKind;
  option?: Parameters<typeof getPlannedEntryKind>[0];
};

export function PlannedEntryKindBadge({ kind, option }: PlannedEntryKindBadgeProps) {
  const { t } = useTranslation();
  const resolvedKind = kind ?? (option ? getPlannedEntryKind(option) : 'item');

  return (
    <View
      style={[
        styles.badge,
        resolvedKind === 'combo' ? styles.badgeCombo : styles.badgeItem,
      ]}>
      <Text
        style={[
          styles.label,
          resolvedKind === 'combo' ? styles.labelCombo : styles.labelItem,
        ]}>
        {t(plannedEntryKindI18nKey(resolvedKind))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeCombo: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  badgeItem: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  labelCombo: {
    color: '#1D4ED8',
  },
  labelItem: {
    color: '#047857',
  },
});
