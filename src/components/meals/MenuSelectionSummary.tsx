import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PlanningChip } from './PlanningChip';
import { colors, spacing, typography } from '../../theme';

export type MenuSelectionSummaryChip = {
  id: string;
  label: string;
  variant: 'COMBO' | 'ITEM';
};

type MenuSelectionSummaryProps = {
  comboChips: MenuSelectionSummaryChip[];
  itemChips: MenuSelectionSummaryChip[];
  extraChips?: MenuSelectionSummaryChip[];
  onRemove: (id: string) => void;
};

export function MenuSelectionSummary({
  comboChips,
  itemChips,
  extraChips = [],
  onRemove,
}: MenuSelectionSummaryProps) {
  const { t } = useTranslation();
  const total = comboChips.length + itemChips.length + extraChips.length;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>
        {t('meals.planning.selectedSummary', { count: total })}
      </Text>

      {comboChips.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('meals.planning.selectedCombosGroup')}</Text>
          <View style={styles.chipRow}>
            {comboChips.map(chip => (
              <PlanningChip
                key={chip.id}
                label={chip.label}
                variant="COMBO"
                onRemove={() => onRemove(chip.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {itemChips.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('meals.planning.selectedItemsGroup')}</Text>
          <View style={styles.chipRow}>
            {itemChips.map(chip => (
              <PlanningChip
                key={chip.id}
                label={chip.label}
                variant="ITEM"
                onRemove={() => onRemove(chip.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {extraChips.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t('meals.planning.selectedExtrasGroup')}</Text>
          <View style={styles.chipRow}>
            {extraChips.map(chip => (
              <PlanningChip
                key={chip.id}
                label={chip.label}
                variant="ITEM"
                onRemove={() => onRemove(chip.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {total === 0 ? (
        <Text style={styles.empty}>{t('meals.planning.nothingSelectedYet')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  group: {
    marginBottom: spacing.sm,
  },
  groupLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  empty: {
    ...typography.caption,
    color: colors.muted,
  },
});
