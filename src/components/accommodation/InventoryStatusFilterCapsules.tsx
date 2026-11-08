import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bed, CalendarCheck2, Layers, Users } from 'lucide-react-native';
import { colors, pastels, radius, spacing, typography } from '../../theme';
import type { InventoryStatusCounts, InventoryStatusFilter } from '../../utils/inventoryStatusFilter';

type CapsuleTone = {
  fg: string;
  bg: string;
  border: string;
};

type CapsuleDef = {
  key: InventoryStatusFilter;
  labelKey: string;
  defaultLabel: string;
  count: number;
  tone: CapsuleTone;
  Icon: typeof Layers;
};

type InventoryStatusFilterCapsulesProps = {
  value: InventoryStatusFilter;
  counts: InventoryStatusCounts;
  onChange: (next: InventoryStatusFilter) => void;
};

/** Colors/icons aligned with Dashboard Property Operations cards. */
const TONES: Record<InventoryStatusFilter, CapsuleTone> = {
  ALL: pastels.blue,
  AVAILABLE: pastels.purple,
  OCCUPIED: pastels.mint,
  RESERVED: pastels.orange,
};

export const InventoryStatusFilterCapsules = memo(function InventoryStatusFilterCapsules({
  value,
  counts,
  onChange,
}: InventoryStatusFilterCapsulesProps) {
  const { t } = useTranslation();

  const capsules: CapsuleDef[] = [
    {
      key: 'ALL',
      labelKey: 'accommodation.builder.statusFilter.all',
      defaultLabel: 'All',
      count: counts.all,
      tone: TONES.ALL,
      Icon: Layers,
    },
    {
      key: 'AVAILABLE',
      labelKey: 'accommodation.builder.statusFilter.available',
      defaultLabel: 'Available',
      count: counts.available,
      tone: TONES.AVAILABLE,
      Icon: Bed,
    },
    {
      key: 'OCCUPIED',
      labelKey: 'accommodation.builder.statusFilter.occupied',
      defaultLabel: 'Occupied',
      count: counts.occupied,
      tone: TONES.OCCUPIED,
      Icon: Users,
    },
    {
      key: 'RESERVED',
      labelKey: 'accommodation.builder.statusFilter.reserved',
      defaultLabel: 'Reserved',
      count: counts.reserved,
      tone: TONES.RESERVED,
      Icon: CalendarCheck2,
    },
  ];

  return (
    <View style={styles.grid}>
      {capsules.map(capsule => {
        const selected = value === capsule.key;
        const label = t(capsule.labelKey, { defaultValue: capsule.defaultLabel });
        const { tone, Icon } = capsule;
        return (
          <Pressable
            key={capsule.key}
            onPress={() => onChange(capsule.key)}
            style={({ pressed }) => [
              styles.capsule,
              {
                borderColor: selected ? tone.fg : tone.border,
                backgroundColor: selected ? tone.bg : colors.white,
              },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${label}: ${capsule.count}`}>
            <Icon size={14} color={tone.fg} strokeWidth={2.3} />
            <Text
              style={[styles.label, { color: selected ? tone.fg : colors.textPrimary }]}
              numberOfLines={1}>
              {label}
            </Text>
            <Text
              style={[styles.count, { color: selected ? tone.fg : colors.muted }]}
              numberOfLines={1}>
              ({capsule.count})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.xs,
    marginBottom: spacing.sm,
  },
  capsule: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: radius.full,
    borderWidth: 1.5,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  count: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.muted,
    flexShrink: 0,
  },
});
