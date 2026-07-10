import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealBalanceApi } from '../api/mealBalanceApi';
import type { MemberMealBalanceActivityEvent, MemberSubscriptionLifetimeSummary } from '../api/types';
import { MemberSubscriptionHistoryList } from '../components/meals/MemberSubscriptionHistoryList';
import { MemberSubscriptionHistorySummary } from '../components/meals/MemberSubscriptionHistorySummary';
import { SubscriptionHistoryFilterDrawer } from '../components/meals/SubscriptionHistoryFilterDrawer';
import { HeaderBackButton, ListSearchFilterBar, Screen, SkeletonCard } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';
import {
  countSubscriptionHistoryFilters,
  defaultSubscriptionHistoryFilters,
  filterSubscriptionHistoryEvents,
  SUBSCRIPTION_HISTORY_FILTER_OPTION_COUNT,
  type SubscriptionHistoryFilterState,
} from '../utils/subscriptionHistoryFilter';
import { shouldUseFilterDrawer } from '../utils/filterUx';

type Nav = NativeStackNavigationProp<MainStackParamList, 'MemberSubscriptionHistory'>;
type Route = NativeStackScreenProps<MainStackParamList, 'MemberSubscriptionHistory'>['route'];

export function MemberSubscriptionHistoryScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, memberId } = route.params;
  const [events, setEvents] = useState<MemberMealBalanceActivityEvent[]>([]);
  const [summary, setSummary] = useState<MemberSubscriptionLifetimeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState<SubscriptionHistoryFilterState>(() =>
    defaultSubscriptionHistoryFilters(),
  );
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await mealBalanceApi.getSubscriptionHistory(spaceId, memberId);
      setEvents(response.events ?? []);
      setSummary(response.summary ?? null);
    } catch (loadError) {
      console.warn('[MemberSubscriptionHistory] load failed', loadError);
      setEvents([]);
      setSummary(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [memberId, spaceId]);

  const filteredEvents = useMemo(
    () => filterSubscriptionHistoryEvents(events, filters),
    [events, filters],
  );

  const activeFilterCount = countSubscriptionHistoryFilters(filters);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('meals.subscription.historyTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen contentStyle={styles.content}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>
        <Text style={styles.subtitle}>{t('meals.subscription.historySubtitle')}</Text>

        {!loading && !error ? (
          <ListSearchFilterBar
            searchValue=""
            onSearchChange={() => {}}
            onFilterPress={() => setFilterDrawerOpen(true)}
            activeFilterCount={activeFilterCount}
            showFilterButton={shouldUseFilterDrawer(SUBSCRIPTION_HISTORY_FILTER_OPTION_COUNT)}
            showSearch={false}
          />
        ) : null}

        <SubscriptionHistoryFilterDrawer
          visible={filterDrawerOpen}
          applied={filters}
          onClose={() => setFilterDrawerOpen(false)}
          onApply={setFilters}
        />

        {error ? <Text style={styles.error}>{t('meals.errors.loadFailed')}</Text> : null}
        {loading && events.length === 0 && !summary ? (
          <SkeletonCard />
        ) : (
          <>
            <MemberSubscriptionHistorySummary summary={summary} />
            <MemberSubscriptionHistoryList
              events={filteredEvents}
              loading={loading}
              emptyKey={
                events.length > 0 && filteredEvents.length === 0
                  ? 'list.emptyFiltered'
                  : undefined
              }
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  error: {
    ...typography.caption,
    color: '#B91C1C',
  },
});
