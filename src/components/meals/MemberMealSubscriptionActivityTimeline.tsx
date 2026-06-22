import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealBalanceApi } from '../../api/mealBalanceApi';
import type { MemberMealBalanceActivityEvent, PrepaidBalanceUnit, UUID } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type MemberMealSubscriptionActivityTimelineProps = {
  spaceId: UUID;
  memberId: UUID;
  month: string;
  unit?: PrepaidBalanceUnit | null;
  currencyCode?: string;
  reloadToken?: number;
};

function formatMeals(
  amount: number | null | undefined,
  unit: PrepaidBalanceUnit,
  currencyCode: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (amount == null) {
    return '—';
  }
  if (unit === 'MEALS') {
    return t('dashboard.financial.mealsCount', { count: Math.round(amount) });
  }
  return formatComboPrice(amount, currencyCode) ?? '—';
}

export function MemberMealSubscriptionActivityTimeline({
  spaceId,
  memberId,
  month,
  unit = 'MEALS',
  currencyCode = 'INR',
  reloadToken = 0,
}: MemberMealSubscriptionActivityTimelineProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MemberMealBalanceActivityEvent[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await mealBalanceApi.getActivity(spaceId, memberId, month);
      setEvents(rows);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [memberId, month, spaceId]);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }

  if (events.length === 0) {
    return <Text style={styles.empty}>{t('meals.subscription.activityEmpty')}</Text>;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('meals.subscription.activityTitle')}</Text>
      {events.map(event => {
        const dateLabel = new Date(event.createdAt).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const isPurchase = event.eventType === 'PURCHASE';

        return (
          <View key={event.eventId} style={styles.row}>
            <View style={styles.dot} />
            <View style={styles.content}>
              <Text style={styles.date}>{dateLabel}</Text>
              {isPurchase ? (
                <>
                  <Text style={styles.eventTitle}>
                    {event.subscriptionAction === 'CREATED'
                      ? t('meals.subscription.activityCreated')
                      : event.subscriptionAction === 'RENEWED'
                        ? t('meals.subscription.activityRenewed')
                        : event.subscriptionAction === 'UPDATED'
                          ? t('meals.subscription.activityUpdated')
                          : t('meals.subscription.activityPurchased', {
                            meals: formatMeals(event.meals, unit, currencyCode, t),
                          })}
                  </Text>
                  <Text style={styles.meta}>
                    {formatMeals(event.meals, unit, currencyCode, t)}
                  </Text>
                  {event.paidAmount != null ? (
                    <Text style={styles.meta}>
                      {formatComboPrice(event.paidAmount, currencyCode)}
                    </Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.eventTitle}>
                    {event.mealType
                      ? t(mealTypeLabelKey(event.mealType))
                      : t('meals.subscription.activityConsumedTitle')}
                  </Text>
                  <Text style={styles.meta}>
                    {t('meals.subscription.activityConsumed', {
                      meals: formatMeals(event.meals, unit, currencyCode, t),
                    })}
                  </Text>
                  {event.balanceAfter != null ? (
                    <Text style={styles.balanceAfter}>
                      {t('meals.subscription.activityBalanceAfter', {
                        balance: formatMeals(event.balanceAfter, unit, currencyCode, t),
                      })}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </View>
        );
      })}
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
  date: { ...typography.caption, color: colors.muted },
  eventTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.body, color: colors.primaryDark, fontWeight: '600' },
  balanceAfter: { ...typography.caption, color: colors.muted, marginTop: 2 },
});
