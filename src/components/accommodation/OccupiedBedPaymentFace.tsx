import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OccupancyResponse } from '../../api/types';
import { useOccupiedBedStay } from '../../hooks/useOccupiedBedStay';
import { colors, typography } from '../../theme';
import {
  bedCardBalanceFace,
  type OccupantPaymentSummary,
} from '../../utils/occupantPaymentSummary';
import { isOpenEndedDailyRate } from '../../utils/occupancyContract';
import { formatPaymentAmount } from '../../utils/paymentHistory';
import { formatOccupancyRentRate } from '../../utils/stayFinancialDisplay';

function money(amount: number): string {
  return formatPaymentAmount(amount);
}

function dueLine(
  t: (key: string, options?: { defaultValue?: string }) => string,
  charge: OccupantPaymentSummary['rent'],
  labelKey: string,
  fallback: string,
): string | null {
  if (!charge || charge.outstanding == null || charge.outstanding <= 0.009) {
    return null;
  }
  return `${t(labelKey, { defaultValue: fallback })} ${money(charge.outstanding)}`;
}

export function occupiedPaymentCopy(
  summary: OccupantPaymentSummary,
  t: (key: string, options?: { defaultValue?: string; amount?: string }) => string,
): { title: string; detail: string | null } {
  if (summary.status === 'NO_RECORD') {
    return {
      title: t('accommodation.stayPayment.noRecord', { defaultValue: 'No payment record' }),
      detail: null,
    };
  }
  if (summary.status === 'UNAVAILABLE') {
    return {
      title: t('accommodation.stayPayment.unavailable', {
        defaultValue: 'Payment status unavailable',
      }),
      detail: null,
    };
  }
  if (summary.status === 'UNDER_REVIEW') {
    return {
      title: t('accommodation.stayPayment.underReview', { defaultValue: 'Under review' }),
      detail: null,
    };
  }
  if (summary.status === 'PAID') {
    return {
      title: t('accommodation.stayPayment.paid', { defaultValue: 'Payment status: Paid' }),
      detail:
        summary.amountPaid != null
          ? t('accommodation.stayPayment.paidAmount', {
              defaultValue: '{{amount}} paid',
              amount: money(summary.amountPaid),
            })
          : null,
    };
  }
  if (summary.status === 'PARTIALLY_PAID') {
    const parts = [
      summary.amountPaid != null
        ? t('accommodation.stayPayment.paidAmount', {
            defaultValue: '{{amount}} paid',
            amount: money(summary.amountPaid),
          })
        : null,
      summary.outstanding != null
        ? t('accommodation.stayPayment.remaining', {
            defaultValue: '{{amount}} remaining',
            amount: money(summary.outstanding),
          })
        : null,
    ].filter(Boolean);
    return {
      title: t('accommodation.stayPayment.partial', { defaultValue: 'Partially paid' }),
      detail: parts.length > 0 ? parts.join(' · ') : null,
    };
  }
  const breakdown = [
    dueLine(t, summary.rent, 'accommodation.stayPayment.rentDue', 'Rent due'),
    dueLine(t, summary.deposit, 'accommodation.stayPayment.depositDue', 'Deposit due'),
    dueLine(t, summary.other, 'accommodation.stayPayment.otherDue', 'Other due'),
  ].filter((line): line is string => Boolean(line));
  return {
    title: t('accommodation.stayPayment.pending', { defaultValue: 'Pending payment' }),
    detail:
      summary.outstanding != null
        ? t('accommodation.stayPayment.pendingAmount', {
            defaultValue: '{{amount}} pending',
            amount: money(summary.outstanding),
          })
        : breakdown[0] ?? null,
  };
}

type OccupiedBedPaymentFaceProps = {
  spaceId?: string;
  bedId: string;
};

export function OccupiedBedPaymentFace({ spaceId, bedId }: OccupiedBedPaymentFaceProps) {
  const { t } = useTranslation();
  const stay = useOccupiedBedStay(spaceId, bedId, true);

  if (stay.loading) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }
  if (stay.error || !stay.summary) {
    return (
      <Text style={styles.note}>
        {t('accommodation.stayPayment.unavailable', { defaultValue: 'Payment status unavailable' })}
      </Text>
    );
  }
  if (!stay.occupancy) {
    return (
      <Text style={styles.note}>
        {t('accommodation.stayPayment.noTenant', {
          defaultValue: 'No linked tenant',
        })}
      </Text>
    );
  }

  return (
    <BedBalanceSummary
      summary={stay.summary}
      occupancy={stay.occupancy}
      notYetBilled={isOpenEndedDailyRate(stay.occupancy)}
    />
  );
}

function BalanceDueLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.balanceLine} numberOfLines={1}>
      <Text style={styles.balanceLabel}>{label}: </Text>
      <Text style={styles.balanceAmount}>{value}</Text>
    </Text>
  );
}

function MetaLine({ text }: { text: string }) {
  return (
    <Text style={styles.metaLine} numberOfLines={1}>
      {text}
    </Text>
  );
}

function occupancyRentLine(
  occupancy: OccupancyResponse,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string | null {
  const notRecorded = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });
  const rate = formatOccupancyRentRate(occupancy, notRecorded);
  if (!rate.value || rate.value === notRecorded) {
    return null;
  }
  const label = t(rate.labelKey, { defaultValue: rate.labelDefault });
  return `${label}: ${rate.value}`;
}

function occupancyDepositLine(
  occupancy: OccupancyResponse,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string | null {
  if (occupancy.depositSnapshot == null) {
    return null;
  }
  return `${t('accommodation.fields.deposit', { defaultValue: 'Deposit' })}: ${money(
    occupancy.depositSnapshot,
  )}`;
}

function BedBalanceSummary({
  summary,
  occupancy,
  notYetBilled = false,
}: {
  summary: OccupantPaymentSummary;
  occupancy: OccupancyResponse;
  /** OPEN_ENDED daily-rate: rent is billed after the period closes, so no row yet is not "settled". */
  notYetBilled?: boolean;
}) {
  const { t } = useTranslation();
  const face = bedCardBalanceFace(summary);
  const rentUnbilled = notYetBilled && summary.rent == null;
  const rentLine = occupancyRentLine(occupancy, t);
  const depositLine = occupancyDepositLine(occupancy, t);

  if (rentUnbilled) {
    const title = t('accommodation.stayPayment.notYetBilled', { defaultValue: 'Not Yet Billed' });
    return (
      <View style={styles.balance} accessibilityRole="text" accessibilityLabel={`Balance Due: ${title}`}>
        <BalanceDueLine
          label={t('accommodation.stayPayment.balanceDue', { defaultValue: 'Balance Due' })}
          value={title}
        />
      </View>
    );
  }

  if (face.kind === 'note') {
    const title =
      face.status === 'NO_RECORD'
        ? t('accommodation.stayPayment.noRecord', { defaultValue: 'No payment record' })
        : face.status === 'UNDER_REVIEW'
          ? t('accommodation.stayPayment.underReview', { defaultValue: 'Under review' })
          : t('accommodation.stayPayment.unavailable', {
              defaultValue: 'Payment status unavailable',
            });
    return <Text style={styles.note}>{title}</Text>;
  }

  if (face.kind === 'paid') {
    const paidLabel = t('accommodation.stayPayment.paidShort', { defaultValue: 'Paid' });
    const paidDetail =
      face.paid != null
        ? t('accommodation.stayPayment.paidAmount', {
            defaultValue: '{{amount}} paid',
            amount: money(face.paid),
          })
        : null;
    return (
      <View
        style={styles.balance}
        accessibilityRole="text"
        accessibilityLabel={[paidLabel, paidDetail].filter(Boolean).join(', ')}>
        <Text style={styles.paidLabel}>{paidLabel}</Text>
        {paidDetail ? <MetaLine text={paidDetail} /> : null}
      </View>
    );
  }

  const balanceLabel = t('accommodation.stayPayment.balanceDue', { defaultValue: 'Balance Due' });
  const amount = money(face.outstanding);
  return (
    <View
      style={styles.balance}
      accessibilityRole="text"
      accessibilityLabel={[balanceLabel, amount, rentLine, depositLine].filter(Boolean).join(', ')}>
      <BalanceDueLine label={balanceLabel} value={amount} />
      {rentLine ? <MetaLine text={rentLine} /> : null}
      {depositLine ? <MetaLine text={depositLine} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 4 },
  note: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  balance: {
    gap: 2,
    width: '100%',
    minWidth: 0,
  },
  balanceLine: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  balanceAmount: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  paidLabel: { ...typography.caption, fontWeight: '700', color: colors.success },
  metaLine: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
  },
});
