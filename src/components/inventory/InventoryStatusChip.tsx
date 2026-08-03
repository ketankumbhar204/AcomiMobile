import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { InventoryStockStatus } from '../../api/inventoryTypes';
import { radius, spacing, typography } from '../../theme';
import { getInventoryStatusTone } from '../../utils/inventoryVisuals';

type InventoryStatusChipProps = {
  status: InventoryStockStatus;
  label: string;
};

export function InventoryStatusChip({ status, label }: InventoryStatusChipProps) {
  const tone = getInventoryStatusTone(status);
  const Icon = tone.icon;
  return (
    <View
      style={[styles.chip, { backgroundColor: tone.soft, borderColor: tone.border }]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      <Icon size={12} color={tone.color} strokeWidth={2.4} />
      <Text style={[styles.text, { color: tone.color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
});
