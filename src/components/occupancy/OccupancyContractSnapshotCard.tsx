import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OccupancyResponse } from '../../api/types';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';
import {
  computeOccupancyMonthlyTotal,
  formatContractAmount,
  hasContractSnapshot,
  monthlyTotalIncludesFoodFromOccupancy,
  monthlyTotalLabelKey,
} from '../../utils/occupancyContract';
import { formatOccupancyAllocatedDate } from '../../utils/occupancyRules';

type OccupancyContractSnapshotCardProps = {
  occupancy: OccupancyResponse;
};

function foodDisplay(
  occupancy: OccupancyResponse,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (occupancy.foodIncludedInRent) {
    return t('occupancy.contract.foodYes');
  }
  if (!occupancy.foodEnabled) {
    return t('occupancy.contract.foodNo');
  }
  return formatContractAmount(
    occupancy.foodChargeSnapshot,
    t('occupancy.contract.foodIncludedNoAmount'),
  );
}

export function OccupancyContractSnapshotCard({
  occupancy,
}: OccupancyContractSnapshotCardProps) {
  const { t } = useTranslation();

  if (occupancy.status !== 'ACTIVE') {
    return null;
  }

  const notRecorded = t('occupancy.contract.notRecorded');
  const monthlyTotal = computeOccupancyMonthlyTotal(occupancy);
  const monthlyTotalLabel = monthlyTotalLabelKey(
    monthlyTotalIncludesFoodFromOccupancy(occupancy),
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('occupancy.contract.snapshotTitle')}</Text>
      {occupancy.pricingLockedAt ? (
        <Text style={styles.locked}>
          {t('occupancy.contract.lockedAt', {
            date: formatOccupancyAllocatedDate(occupancy.pricingLockedAt),
          })}
        </Text>
      ) : null}

      <View style={styles.row}>
        <Text style={styles.label}>{t('occupancy.contract.rent')}</Text>
        <Text style={styles.value}>
          {formatContractAmount(occupancy.rentSnapshot, notRecorded)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t('occupancy.contract.foodIncluded')}</Text>
        <Text style={styles.value}>{foodDisplay(occupancy, t)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t('occupancy.contract.deposit')}</Text>
        <Text style={styles.value}>
          {formatContractAmount(occupancy.depositSnapshot ?? 0, notRecorded)}
        </Text>
      </View>

      {occupancy.otherCharges && occupancy.otherCharges.length > 0 ? (
        <View style={styles.chargesBlock}>
          <Text style={styles.chargesTitle}>{t('occupancy.contract.otherCharges')}</Text>
          {occupancy.otherCharges.map(charge => (
            <View key={charge.chargeSnapshotId} style={styles.chargeRow}>
              <Text style={styles.chargeLabel}>{charge.label}</Text>
              <Text style={styles.chargeAmount}>
                {formatContractAmount(charge.amount, notRecorded)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {monthlyTotal != null ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t(monthlyTotalLabel)}</Text>
          <Text style={styles.totalValue}>
            {formatContractAmount(monthlyTotal, notRecorded)}
          </Text>
        </View>
      ) : null}

      {!hasContractSnapshot(occupancy) ? (
        <Text style={styles.legacyHint}>{t('occupancy.contract.legacyNoSnapshot')}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
  },
  locked: {
    ...typography.caption,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
  },
  value: {
    ...typography.bodyStrong,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.bodyStrong,
    flex: 1,
  },
  totalValue: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'right',
  },
  chargesBlock: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  chargesTitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  chargeLabel: {
    ...typography.body,
    flex: 1,
  },
  chargeAmount: {
    ...typography.bodyStrong,
  },
  legacyHint: {
    ...typography.caption,
    color: colors.muted,
    fontStyle: 'italic',
  },
});
