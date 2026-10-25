import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOccupiedBedStay } from '../../hooks/useOccupiedBedStay';
import { colors, typography } from '../../theme';
import {
  bedCardBalanceFace,
  type BedCardBalanceFace,
  type OccupantPaymentSummary,
  type StayChargeKind,
  type StayChargeSummary,
} from '../../utils/occupantPaymentSummary';
import { formatPaymentAmount } from '../../utils/paymentHistory';

function money(amount: number): string {
  return formatPaymentAmount(amount);
}

function dueLine(
  t: (key: string, options?: { defaultValue?: string }) => string,
  charge: StayChargeSummary | null,
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
      <Text style={styles.title}>
        {t('accommodation.stayPayment.unavailable', { defaultValue: 'Payment status unavailable' })}
      </Text>
    );
  }
  if (!stay.occupancy) {
    return (
      <Text style={styles.title}>
        {t('accommodation.stayPayment.noTenant', {
          defaultValue: 'No linked tenant',
        })}
      </Text>
    );
  }

  return <BedBalanceSummary summary={stay.summary} />;
}

function chargeLabel(
  kind: StayChargeKind,
  compactDeposit: boolean,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string {
  if (kind === 'RENT') {
    return t('accommodation.fields.rent', { defaultValue: 'Rent' });
  }
  if (kind === 'DEPOSIT') {
    return compactDeposit
      ? t('accommodation.stayPayment.depositShort', { defaultValue: 'Dep' })
      : t('accommodation.fields.deposit', { defaultValue: 'Deposit' });
  }
  return t('accommodation.stayPayment.otherShort', { defaultValue: 'Other' });
}

function balanceSecondary(
  face: Extract<BedCardBalanceFace, { kind: 'balance' }>,
  t: (key: string, options?: { defaultValue?: string; amount?: string }) => string,
): string | null {
  const parts: string[] = [];
  if (face.paid != null) {
    parts.push(
      t('accommodation.stayPayment.paidAmount', {
        defaultValue: '{{amount}} paid',
        amount: money(face.paid),
      }),
    );
  }
  for (const line of face.lines) {
    parts.push(`${chargeLabel(line.kind, face.paid != null, t)} ${money(line.amount)}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function BedBalanceSummary({ summary }: { summary: OccupantPaymentSummary }) {
  const { t } = useTranslation();
  const face = bedCardBalanceFace(summary);

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
        {paidDetail ? (
          <Text style={styles.paidAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {paidDetail}
          </Text>
        ) : null}
      </View>
    );
  }

  const balanceLabel = t('accommodation.stayPayment.balanceDue', { defaultValue: 'Balance due' });
  const amount = money(face.outstanding);
  const secondary = balanceSecondary(face, t);
  return (
    <View
      style={styles.balance}
      accessibilityRole="text"
      accessibilityLabel={[balanceLabel, amount, secondary].filter(Boolean).join(', ')}>
      <Text style={styles.balanceLabel}>{balanceLabel}</Text>
      <Text
        style={styles.balanceAmount}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {amount}
      </Text>
      {secondary ? <Text style={styles.secondary}>{secondary}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { alignSelf: 'flex-start', marginVertical: 4 },
  title: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  note: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  balance: { gap: 1, minWidth: 0, width: '100%', backgroundColor: 'transparent' },
  balanceLabel: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  balanceAmount: {
    ...typography.bodyStrong,
    fontSize: 18,
    lineHeight: 22,
    color: colors.danger,
    fontVariant: ['tabular-nums'],
  },
  secondary: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    width: '100%',
    flexShrink: 1,
  },
  paidLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  paidAmount: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
