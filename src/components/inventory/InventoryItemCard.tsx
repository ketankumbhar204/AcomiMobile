import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { InventoryItem, InventoryStockStatus } from '../../api/inventoryTypes';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatInventoryUnit } from '../../utils/inventoryCatalog';
import {
  availableStock,
  deriveInventoryStockStatus,
} from '../../utils/inventoryVisuals';
import { InventoryStatusChip } from './InventoryStatusChip';

type InventoryItemCardProps = {
  item: InventoryItem;
  /** @deprecated Category is secondary — prefer search by name. Kept optional for callers. */
  categoryName?: string;
  statusLabel: (status: InventoryStockStatus) => string;
  onPress: () => void;
  /** Compact WhatsApp-style row: name · qty · status */
  simple?: boolean;
};

function InventoryItemCardComponent({
  item,
  statusLabel,
  onPress,
  simple = true,
}: InventoryItemCardProps) {
  const status = deriveInventoryStockStatus(item);
  const available = availableStock(item);
  const qtyLabel = `${available} ${formatInventoryUnit(item.unit)}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${qtyLabel}, ${statusLabel(status)}`}>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.qty} numberOfLines={1}>
          {qtyLabel}
        </Text>
      </View>
      <InventoryStatusChip status={status} label={statusLabel(status)} />
      {!simple ? <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

export const InventoryItemCard = memo(InventoryItemCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.9,
    backgroundColor: colors.surface,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  qty: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
