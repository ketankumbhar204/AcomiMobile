import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FileText, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import type { PaymentTimelineEventResponse } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getPaymentStatusIcon } from '../../utils/billingVisuals';
import {
  PAYMENT_STATUS_THEME,
  resolveTimelineEventVariant,
  type PaymentStatusVariant,
} from '../../utils/paymentStatusTheme';
import {
  distinctPaymentTimelineEvents,
  paymentTimelineRemarkContent,
} from '../../utils/paymentTimelineRemark';

type PaymentHistoryTimelineProps = {
  events: PaymentTimelineEventResponse[];
};

const REMARK_FALLBACK: Record<string, string> = {
  'paymentCollection.timeline.whatsappDisabled':
    'WhatsApp reminders are not set up, so this reminder was not sent.',
  'paymentCollection.timeline.noDevice':
    'No registered device was available, so the reminder notification was not delivered.',
  'paymentCollection.timeline.fcmUnavailable':
    'Push notifications were unavailable, so this reminder was not delivered.',
  'paymentCollection.timeline.fcmRejected':
    'The reminder notification was not accepted by the push service.',
};

function eventVisual(eventType: string): { variant: PaymentStatusVariant; Icon: LucideIcon } {
  if (eventType === 'CREATED') {
    return { variant: 'pending', Icon: FileText };
  }
  if (eventType === 'REMINDER_FAILED') {
    return { variant: 'neutral', Icon: TriangleAlert };
  }
  if (eventType === 'REMINDER_SENT') {
    return { variant: 'paid', Icon: getPaymentStatusIcon('paid') };
  }
  const variant = resolveTimelineEventVariant(eventType);
  return { variant, Icon: getPaymentStatusIcon(variant) };
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
  const rows = distinctPaymentTimelineEvents(events);

  if (rows.length === 0) {
    return <Text style={styles.empty}>{t('paymentCollection.timeline.empty')}</Text>;
  }

  return (
    <View style={styles.container}>
      {rows.map((event, index) => {
        const { variant, Icon } = eventVisual(event.eventType);
        const theme = PAYMENT_STATUS_THEME[variant];
        const isLast = index === rows.length - 1;
        const remark = paymentTimelineRemarkContent(event.remarks);
        const message = remark.messageKey
          ? t(remark.messageKey, { defaultValue: REMARK_FALLBACK[remark.messageKey] })
          : remark.text;
        const diagnostic =
          remark.diagnostic && remark.diagnostic !== message ? remark.diagnostic : null;
        const key = event.eventId?.trim() || `${event.eventType}-${event.performedAt}-${index}`;

        return (
          <View key={key} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.marker,
                  { borderColor: theme.accent, backgroundColor: theme.background },
                ]}>
                <Icon size={12} color={theme.accent} strokeWidth={2.4} />
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.card}>
              <Text style={styles.eventType}>
                {t(`paymentCollection.timeline.${event.eventType}`)}
              </Text>
              <Text style={styles.time}>{formatEventTime(event.performedAt)}</Text>
              {message ? <Text style={styles.remarks}>{message}</Text> : null}
              {diagnostic ? <Text style={styles.diagnostic}>{diagnostic}</Text> : null}
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
  diagnostic: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    paddingVertical: spacing.md,
  },
});
