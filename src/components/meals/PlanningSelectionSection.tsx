import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlanningChip, type PlanningChipVariant } from './PlanningChip';
import { colors, spacing, typography } from '../../theme';

export type PlanningSelectionChip = {
  id: string;
  label: string;
  variant: PlanningChipVariant;
};

type PlanningSelectionSectionProps = {
  title: string;
  countLabel?: string;
  chips: PlanningSelectionChip[];
  onRemove: (id: string) => void;
  onChipPress?: (id: string) => void;
  emptyText?: string;
};

export function PlanningSelectionSection({
  title,
  countLabel,
  chips,
  onRemove,
  onChipPress,
  emptyText,
}: PlanningSelectionSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {countLabel ? <Text style={styles.count}>{countLabel}</Text> : null}
      </View>
      {chips.length === 0 && emptyText ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <View style={styles.chipRow}>
          {chips.map(chip => (
            <PlanningChip
              key={chip.id}
              label={chip.label}
              variant={chip.variant}
              onPress={onChipPress ? () => onChipPress(chip.id) : undefined}
              onRemove={() => onRemove(chip.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  count: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  empty: { ...typography.caption, color: colors.muted, marginBottom: spacing.xs },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
