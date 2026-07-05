import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentTimelineEventResponse } from '../../api/types';
import { colors, spacing, typography } from '../../theme';

type PaymentHistoryTimelineProps = {
  events: PaymentTimelineEventResponse[];
};

function eventIcon(eventType: PaymentTimelineEventResponse['eventType']): string {
  switch (eventType) {
    case 'CREATED':
      return '📋';
    case 'PROOF_UPLOADED':
      return '📤';
    case 'UNDER_REVIEW':
      return '🔍';
    case 'APPROVED':
      return '✓';
    case 'PAID':
      return '✅';
    case 'REJECTED':
      return '❌';
    case 'RESUBMITTED':
      return '🔄';
    case 'REFUNDED':
      return '↩️';
    default:
      return '•';
  }
}

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
      {events.map((event, index) => (
        <View key={event.eventId} style={styles.row}>
          <View style={styles.rail}>
            <Text style={styles.icon}>{eventIcon(event.eventType)}</Text>
            {index < events.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.content}>
            <Text style={styles.eventType}>
              {t(`paymentCollection.timeline.${event.eventType}`)}
            </Text>
            <Text style={styles.time}>{formatEventTime(event.performedAt)}</Text>
            {event.remarks ? <Text style={styles.remarks}>{event.remarks}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  rail: {
    width: 36,
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    minHeight: 24,
  },
  content: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  eventType: {
    ...typography.bodyStrong,
  },
  time: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  remarks: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textPrimary,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
  },
});
