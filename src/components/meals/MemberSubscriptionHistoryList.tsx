import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberMealBalanceActivityEvent, PrepaidBalanceUnit } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type MemberSubscriptionHistoryListProps = {
  events: MemberMealBalanceActivityEvent[];
  unit?: PrepaidBalanceUnit;
  currencyCode?: string;
  loading?: boolean;
  emptyKey?: string;
};

type MonthGroup = {
  monthKey: string;
  events: MemberMealBalanceActivityEvent[];
  closingBalance: number | null;
};

function monthKeyFromDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function currentMonthKey(reference = new Date()): string {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthYear(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

function groupEventsByMonth(events: MemberMealBalanceActivityEvent[]): MonthGroup[] {
  const buckets = new Map<string, MemberMealBalanceActivityEvent[]>();

  for (const event of events) {
    const key = monthKeyFromDate(event.createdAt);
    const bucket = buckets.get(key) ?? [];
    bucket.push(event);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([monthKey, monthEvents]) => {
      const chronological = [...monthEvents].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const lastEvent = chronological[chronological.length - 1];
      return {
        monthKey,
        events: monthEvents,
        closingBalance:
          lastEvent?.balanceAfter != null ? Math.round(lastEvent.balanceAfter) : null,
      };
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

function isMealsAdded(event: MemberMealBalanceActivityEvent): boolean {
  return (
    event.subscriptionAction === 'MEALS_ADDED' ||
    event.subscriptionAction === 'UPDATED' ||
    event.subscriptionAction === 'RENEWED'
  );
}

function eventTitle(
  event: MemberMealBalanceActivityEvent,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (event.eventType === 'ENDED' || event.subscriptionAction === 'ENDED') {
    return t('meals.subscription.activityEnded');
  }
  if (event.subscriptionAction === 'CREATED') {
    return t('meals.subscription.activityCreated');
  }
  if (event.subscriptionAction === 'RENEWED') {
    return t('meals.subscription.activityRenewed');
  }
  if (isMealsAdded(event)) {
    return t('meals.subscription.activityMealsAdded');
  }
  return t('meals.subscription.activityMealsAdded');
}

function SubscriptionHistoryEventCard({
  event,
  currencyCode,
  locale,
  t,
}: {
  event: MemberMealBalanceActivityEvent;
  currencyCode: string;
  locale: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const dateLabel = new Date(event.createdAt).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const isEnded = event.eventType === 'ENDED' || event.subscriptionAction === 'ENDED';
  const isPurchase = !isEnded && event.eventType === 'PURCHASE';

  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventDate}>{dateLabel}</Text>
      <Text style={styles.eventTitle}>{eventTitle(event, t)}</Text>
      {isPurchase && event.meals != null ? (
        <Text style={styles.meta}>
          {event.subscriptionAction === 'CREATED' || event.subscriptionAction === 'RENEWED'
            ? t('dashboard.financial.mealsCount', { count: Math.round(event.meals) })
            : t('meals.subscription.historyMealsAddedLine', {
                count: Math.round(event.meals),
              })}
        </Text>
      ) : null}
      {isPurchase && event.paidAmount != null ? (
        <Text style={styles.meta}>
          {t('meals.subscription.historyAmountReceivedLine', {
            amount: formatComboPrice(event.paidAmount, currencyCode) ?? '—',
          })}
        </Text>
      ) : null}
      {isPurchase && event.balanceAfter != null ? (
        <Text style={styles.balanceAfter}>
          {t('meals.subscription.balanceAfterEvent', {
            count: Math.round(event.balanceAfter),
          })}
        </Text>
      ) : null}
    </View>
  );
}

function SubscriptionHistoryMonthAccordion({
  group,
  currencyCode,
  locale,
  defaultExpanded,
}: {
  group: MonthGroup;
  currencyCode: string;
  locale: string;
  defaultExpanded: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isCurrentMonth = group.monthKey === currentMonthKey();
  const monthLabel = formatMonthYear(group.monthKey, locale);
  const eventCount = group.events.length;

  const sortedEvents = useMemo(
    () =>
      [...group.events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [group.events],
  );

  const headerMetaKey = isCurrentMonth
    ? 'meals.subscription.historyMonthSummaryCurrent'
    : 'meals.subscription.historyMonthSummaryClosing';

  return (
    <View style={styles.monthSection}>
      <Pressable
        style={styles.monthHeader}
        onPress={() => setExpanded(prev => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <View style={styles.monthHeaderMain}>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
          <Text style={styles.monthMeta}>
            {t(headerMetaKey, {
              count: eventCount,
              balance: group.closingBalance ?? '—',
            })}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.monthBody}>
          {sortedEvents.map((event, index) => (
            <React.Fragment key={event.eventId}>
              {index > 0 ? <View style={styles.eventDivider} /> : null}
              <SubscriptionHistoryEventCard
                event={event}
                currencyCode={currencyCode}
                locale={locale}
                t={t}
              />
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function MemberSubscriptionHistoryList({
  events,
  currencyCode = 'INR',
  loading = false,
  emptyKey = 'meals.subscription.historyEmpty',
}: MemberSubscriptionHistoryListProps) {
  const { t, i18n } = useTranslation();

  const monthGroups = useMemo(() => groupEventsByMonth(events), [events]);
  const activeMonthKey = currentMonthKey();

  if (loading) {
    return <Text style={styles.empty}>{t('common.loading')}</Text>;
  }

  if (monthGroups.length === 0) {
    return <Text style={styles.empty}>{t(emptyKey)}</Text>;
  }

  return (
    <View style={styles.wrap}>
      {monthGroups.map(group => (
        <SubscriptionHistoryMonthAccordion
          key={group.monthKey}
          group={group}
          currencyCode={currencyCode}
          locale={i18n.language}
          defaultExpanded={group.monthKey === activeMonthKey}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  empty: {
    ...typography.caption,
    color: colors.muted,
    paddingVertical: spacing.md,
  },
  monthSection: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  monthHeaderMain: {
    flex: 1,
    gap: 2,
  },
  monthTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  monthMeta: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 12,
  },
  chevron: {
    ...typography.bodyStrong,
    color: colors.muted,
    fontSize: 16,
    minWidth: 16,
    textAlign: 'right',
  },
  monthBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  eventDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  eventCard: {
    gap: 2,
  },
  eventDate: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 11,
  },
  eventTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  meta: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 13,
  },
  balanceAfter: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 12,
    marginTop: 2,
  },
});
