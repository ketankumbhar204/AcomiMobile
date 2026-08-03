import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, History } from 'lucide-react-native';
import { mealBalanceApi } from '../api/mealBalanceApi';
import type { MemberMealBalanceActivityEvent, MemberSubscriptionLifetimeSummary } from '../api/types';
import { DashboardSectionTitle } from '../components/dashboard/DashboardSectionTitle';
import { MemberSubscriptionHistoryList } from '../components/meals/MemberSubscriptionHistoryList';
import { MemberSubscriptionHistorySummary } from '../components/meals/MemberSubscriptionHistorySummary';
import { SubscriptionHistoryFilterDrawer } from '../components/meals/SubscriptionHistoryFilterDrawer';
import { EmptyState, HeaderBackButton, ListSearchFilterBar, Screen, SkeletonCard } from '../components/ui';
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
  const isFilteredEmpty = events.length > 0 && filteredEvents.length === 0;
  const isTrulyEmpty = !loading && !error && events.length === 0;

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
        <DashboardSectionTitle
          title={t('meals.subscription.historyTitle')}
          subtitle={t('meals.subscription.historySubtitle')}
        />

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

        {error ? (
          <View style={styles.errorBanner}>
            <AlertTriangle size={16} color="#DC2626" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{t('meals.errors.loadFailed')}</Text>
            <Pressable
              onPress={() => {
                load().catch(() => undefined);
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.retry')}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <>
            <SkeletonCard />
            <View style={styles.gap} />
            <SkeletonCard />
            <View style={styles.gap} />
            <SkeletonCard />
          </>
        ) : isTrulyEmpty ? (
          <EmptyState
            title={t('meals.subscription.historyEmpty')}
            Icon={History}
          />
        ) : isFilteredEmpty ? (
          <EmptyState title={t('list.emptyFiltered')} Icon={History} />
        ) : (
          <>
            <MemberSubscriptionHistorySummary summary={summary} />
            <MemberSubscriptionHistoryList
              events={filteredEvents}
              loading={false}
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
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  gap: {
    height: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  retryButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: colors.white,
  },
  retryPressed: {
    backgroundColor: '#FEE2E2',
  },
  retryText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});
