import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedSpaceListItemResponse } from '../../api/types';
import { AccommodationStatusBadge } from '../accommodation/AccommodationStatusBadge';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';

export type BedInventoryFlowAction = 'dashboard' | 'allocate' | 'reserve' | 'transfer';

type DashboardBedInventoryBedRowProps = {
  bed: BedSpaceListItemResponse;
  canManageOccupancy: boolean;
  onPress: () => void;
  onAllocate?: () => void;
  onReserve?: () => void;
  onFlowAction?: () => void;
  showDivider?: boolean;
  flowAction?: BedInventoryFlowAction;
};

function DashboardBedInventoryBedRowComponent({
  bed,
  canManageOccupancy,
  onPress,
  onAllocate,
  onReserve,
  onFlowAction,
  showDivider = true,
  flowAction = 'dashboard',
}: DashboardBedInventoryBedRowProps) {
  const { t } = useTranslation();
  const isAvailable = bed.status === 'AVAILABLE';
  const showDashboardActions =
    flowAction === 'dashboard' &&
    canManageOccupancy &&
    isAvailable &&
    onAllocate &&
    onReserve;
  const showSingleFlowAction = flowAction !== 'dashboard' && isAvailable && onFlowAction;

  const flowActionLabel =
    flowAction === 'allocate'
      ? t('occupancy.actions.allocate')
      : flowAction === 'reserve'
        ? t('occupancy.actions.reserve')
        : flowAction === 'transfer'
          ? t('occupancy.actions.transfer')
          : '';

  return (
    <View style={[styles.wrap, showDivider && styles.wrapDivider]}>
      <Pressable
        onPress={showSingleFlowAction ? onFlowAction : onPress}
        disabled={showSingleFlowAction ? !isAvailable : false}
        style={({ pressed }) => [
          styles.main,
          pressed && styles.mainPressed,
          showSingleFlowAction && !isAvailable && styles.mainDisabled,
        ]}
        accessibilityRole="button">
        <View style={styles.info}>
          <Text style={styles.label}>{formatBedDisplayLabel(bed.label, t)}</Text>
          <AccommodationStatusBadge status={bed.status} />
        </View>
        {!showDashboardActions && !showSingleFlowAction ? (
          <Text style={styles.chevron}>›</Text>
        ) : null}
      </Pressable>
      {showDashboardActions ? (
        <View style={styles.actions}>
          <Button
            label={t('occupancy.actions.allocate')}
            onPress={onAllocate}
            style={styles.actionBtn}
          />
          <Button
            label={t('occupancy.actions.reserve')}
            variant="secondary"
            onPress={onReserve}
            style={styles.actionBtn}
          />
        </View>
      ) : showSingleFlowAction ? (
        <Button
          label={flowActionLabel}
          onPress={onFlowAction}
          style={styles.singleActionBtn}
        />
      ) : null}
    </View>
  );
}

export const DashboardBedInventoryBedRow = memo(DashboardBedInventoryBedRowComponent);

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.sm,
  },
  wrapDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  mainPressed: {
    opacity: 0.85,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  label: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingLeft: 0,
  },
  actionBtn: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 120,
  },
  singleActionBtn: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  mainDisabled: {
    opacity: 0.55,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.muted,
  },
});
