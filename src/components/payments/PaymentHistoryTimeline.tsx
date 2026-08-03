import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentTimelineEventResponse } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getPaymentStatusIcon } from '../../utils/billingVisuals';
import {
  PAYMENT_STATUS_THEME,
  resolveTimelineEventVariant,
} from '../../utils/paymentStatusTheme';

type PaymentHistoryTimelineProps = {
  events: PaymentTimelineEventResponse[];
};

function formatEventTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return (
    date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

export function PaymentHistoryTimeline({ events }: PaymentHistoryTimelineProps) {
  const { t } = useTranslation();

  if (events.length === 0) {
    return <Text style={styles.empty}>{t('paymentCollection.timeline.empty')}</Text>;
  }

  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const variant = resolveTimelineEventVariant(event.eventType);
        const accent = PAYMENT_STATUS_THEME[variant].accent;
        const Icon = getPaymentStatusIcon(variant);
        const isLast = index === events.length - 1;

        return (
          <View key={event.eventId} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.marker, { borderColor: accent }]}>
                <Icon size={12} color={accent} strokeWidth={2.4} />
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.card}>
              <Text style={styles.eventType}>
                {t(`paymentCollection.timeline.${event.eventType}`)}
              </Text>
              <Text style={styles.time}>{formatEventTime(event.performedAt)}</Text>
              {event.remarks ? <Text style={styles.remarks}>{event.remarks}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    width: 24,
    alignItems: 'center',
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    minHeight: 16,
    marginVertical: 4,
    backgroundColor: colors.border,
  },
  card: {
    flex: 1,
    minWidth: 0,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xxs,
    ...shadows.sm,
  },
  eventType: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
  },
  time: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
  },
  remarks: {
    ...typography.body,
    fontSize: 14,
    marginTop: spacing.xxs,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    paddingVertical: spacing.md,
  },
});
