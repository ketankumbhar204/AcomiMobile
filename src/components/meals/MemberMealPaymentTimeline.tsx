import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealPollPaymentEvent, UUID } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type MemberMealPaymentTimelineProps = {
  spaceId: UUID;
  memberId: UUID;
  month: string;
};

export function MemberMealPaymentTimeline({
  spaceId,
  memberId,
  month,
}: MemberMealPaymentTimelineProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MealPollPaymentEvent[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await mealsApi.getMemberMealPaymentEvents(spaceId, memberId, month);
      setEvents(rows);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [memberId, month, spaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }

  if (events.length === 0) {
    return <Text style={styles.empty}>{t('meals.paymentTimeline.empty')}</Text>;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('meals.paymentTimeline.title')}</Text>
      {events.map(event => (
        <View key={event.eventId} style={styles.row}>
          <View style={styles.dot} />
          <View style={styles.content}>
            <Text style={styles.eventLabel}>
              {t(`meals.paymentTimeline.events.${event.eventType}`, {
                date: event.pollDate,
                defaultValue: event.eventType,
              })}
            </Text>
            {event.amount != null ? (
              <Text style={styles.meta}>{formatComboPrice(event.amount, 'INR')}</Text>
            ) : null}
            {event.remarks ? <Text style={styles.remarks}>{event.remarks}</Text> : null}
            <Text style={styles.time}>
              {new Date(event.createdAt).toLocaleString(undefined, {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.lg },
  title: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
  loader: { marginVertical: spacing.md },
  empty: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.sm,
    gap: 2,
    marginBottom: spacing.xs,
  },
  eventLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  remarks: { ...typography.body, color: colors.muted, lineHeight: 20 },
  time: { ...typography.caption, color: colors.muted },
});
