import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';

export type OccupancyHierarchyContext = {
  spaceName?: string;
  spaceTypeLabel?: string;
  buildingName?: string;
  floorName?: string;
  unitName?: string;
  roomName?: string;
  bedName?: string;
};

type HierarchyBreadcrumbCardProps = {
  context: OccupancyHierarchyContext;
  compact?: boolean;
};

export function HierarchyBreadcrumbCard({
  context,
  compact = false,
}: HierarchyBreadcrumbCardProps) {
  const { t } = useTranslation();

  const rows: Array<{ label: string; value: string }> = [];
  if (context.spaceName) {
    rows.push({ label: t('occupancy.section.space'), value: context.spaceName });
  }
  if (context.spaceTypeLabel) {
    rows.push({ label: t('occupancy.section.type'), value: context.spaceTypeLabel });
  }
  if (context.buildingName) {
    rows.push({ label: t('occupancy.section.building'), value: context.buildingName });
  }
  if (context.floorName) {
    rows.push({ label: t('occupancy.section.floor'), value: context.floorName });
  }
  if (context.unitName) {
    rows.push({ label: t('occupancy.section.unit'), value: context.unitName });
  }
  if (context.roomName) {
    rows.push({ label: t('occupancy.section.room'), value: context.roomName });
  }
  if (context.bedName) {
    rows.push({ label: t('occupancy.section.bed'), value: context.bedName });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]} pointerEvents="none">
      <Text style={styles.heading}>{t('occupancyWizard.breadcrumb.selectedAccommodation')}</Text>
      {rows.map(row => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value} numberOfLines={2}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: `${colors.muted}14`,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${colors.muted}33`,
    borderStyle: 'dashed',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: 4,
  },
  cardCompact: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 18,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    flex: 1,
  },
  value: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1.4,
    textAlign: 'right',
  },
});
