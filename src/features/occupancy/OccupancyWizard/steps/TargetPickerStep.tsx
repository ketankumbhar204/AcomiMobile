import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BedSpaceListItemResponse, SpaceType, UUID } from '../../../../api/types';
import type { BedInventoryFlowAction } from '../../../../components/dashboard/DashboardBedInventoryBedRow';
import { BedInventoryBrowser } from '../../../../components/dashboard/BedInventoryBrowser';
import { colors, spacing, typography } from '../../../../theme';
import type { OccupancyWizardMode } from '../types';

type TargetPickerStepProps = {
  spaceId: UUID;
  spaceType: SpaceType;
  mode: OccupancyWizardMode;
  spaceContextLine?: string | null;
  onBedAction: (bed: BedSpaceListItemResponse) => void;
};

function flowActionForMode(mode: OccupancyWizardMode): BedInventoryFlowAction {
  switch (mode) {
    case 'RESERVE':
      return 'reserve';
    case 'TRANSFER':
      return 'transfer';
    case 'ALLOCATE':
    default:
      return 'allocate';
  }
}

export function TargetPickerStep({
  spaceId,
  spaceType,
  mode,
  spaceContextLine,
  onBedAction,
}: TargetPickerStepProps) {
  const headerAccessory = spaceContextLine ? (
    <Text style={styles.spaceContextLine}>{spaceContextLine}</Text>
  ) : null;

  return (
    <View style={styles.wrap}>
      <BedInventoryBrowser
        spaceId={spaceId}
        spaceType={spaceType}
        status="AVAILABLE"
        flowAction={flowActionForMode(mode)}
        onFlowAction={onBedAction}
        showSubtitle={false}
        showSummary={false}
        unifiedScroll
        compactPadding
        headerAccessory={headerAccessory}
        contentStyle={styles.browser}
        listContentStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
  },
  browser: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  spaceContextLine: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
