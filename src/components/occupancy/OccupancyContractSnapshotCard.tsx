import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OccupancyResponse } from '../../api/types';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';
import {
  formatContractAmount,
  hasContractSnapshot,
} from '../../utils/occupancyContract';
import { buildStayFinancialPresentation } from '../../utils/stayFinancialDisplay';
import { formatOccupancyAllocatedDate } from '../../utils/occupancyRules';

type OccupancyContractSnapshotCardProps = {
  occupancy: OccupancyResponse;
  /** Render rows without an extra card (for nesting inside Current Stay). */
  embedded?: boolean;
};

export function OccupancyContractSnapshotCard({
  occupancy,
  embedded = false,
}: OccupancyContractSnapshotCardProps) {
  const { t } = useTranslation();

  if (occupancy.status !== 'ACTIVE' && occupancy.status !== 'RESERVED') {
    return null;
  }

  const notRecorded = t('occupancy.contract.notRecorded');
  const presentation = buildStayFinancialPresentation(occupancy, { notRecorded });

  const body = (
    <>
      <Text style={styles.title}>{t('occupancy.contract.snapshotTitle')}</Text>
      {occupancy.pricingLockedAt ? (
        <Text style={styles.locked}>
          {t('occupancy.contract.lockedAt', {
            date: formatOccupancyAllocatedDate(occupancy.pricingLockedAt),
          })}
        </Text>
      ) : null}

      <View style={styles.row}>
        <Text style={styles.label}>
          {t('occupancyWizard.steps.stayType', { defaultValue: 'Stay type' })}
        </Text>
        <Text style={styles.value}>
          {t(presentation.stayTypeLabelKey, {
            defaultValue: presentation.stayTypeLabelDefault,
          })}
        </Text>
      </View>

      {presentation.rows.map(row => {
        const value =
          row.key === 'food'
            ? row.value === 'yes'
              ? t('common.yes', { defaultValue: 'Yes' })
              : t('common.no', { defaultValue: 'No' })
            : row.value;
        return (
          <View key={row.key} style={row.emphasize ? styles.totalRow : styles.row}>
            <Text style={row.emphasize ? styles.totalLabel : styles.label}>
              {t(row.labelKey, { defaultValue: row.labelDefault })}
            </Text>
            <Text style={row.emphasize ? styles.totalValue : styles.value}>{value}</Text>
          </View>
        );
      })}

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

      {!hasContractSnapshot(occupancy) && occupancy.status === 'ACTIVE' ? (
        <Text style={styles.legacyHint}>{t('occupancy.contract.legacyNoSnapshot')}</Text>
      ) : null}
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{body}</View>;
  }

  return <Card style={styles.card}>{body}</Card>;
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderRadius: 18,
  },
  embedded: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    fontWeight: '600',
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
