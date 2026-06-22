import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { DashboardFinancialSnapshot } from '../../components/dashboard';
import { MemberMealActivityMonthNav } from '../../components/meals/MemberMealActivityMonthNav';
import { MemberPaymentRow } from '../../components/payments/MemberPaymentRow';
import { PaymentsFilterDrawer } from '../../components/payments/PaymentsFilterDrawer';
import { EmptyState, ListSearchFilterBar, SkeletonCard } from '../../components/ui';
import { usePaymentsLedger } from '../../hooks/usePaymentsLedger';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing, typography } from '../../theme';
import { canManagePayments, currentMonthKey } from '../../utils/dashboardFinancial';
import {
  countPaymentListFilters,
  isPrepaidOnlyLedger,
  type PaymentLedgerFilter,
} from '../../utils/paymentLedger';
import { findMySpaceEntry } from '../../utils/spacePermissions';

type PaymentsRoute = RouteProp<SpaceTabParamList, 'Payments'>;
type PaymentsNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Payments'>,
  NativeStackNavigationProp<MainStackParamList>
>;

function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return currentMonthKey(date);
}

export function PaymentsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<PaymentsNav>();
  const route = useRoute<PaymentsRoute>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceEntry = findMySpaceEntry(mySpaces, spaceId);
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType ?? spaceEntry?.spaceType;
  const canManage = canManagePayments(permissions.membershipRole);

  const ledger = usePaymentsLedger(spaceId, spaceType, canManage);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    const initialFilter = route.params.initialFilter;
    if (initialFilter) {
      ledger.setFilter(initialFilter);
    }
  }, [ledger.setFilter, route.params.initialFilter]);

  const activeFilterCount = useMemo(
    () => countPaymentListFilters(ledger.filters),
    [ledger.filters],
  );

  const prepaidOnly = isPrepaidOnlyLedger(ledger.summary);

  const paymentEmptyState = useMemo(() => {
    if (ledger.filters.preset === 'pending') {
      return {
        title: t('payments.emptyPending.title'),
        description: t('payments.emptyPending.description'),
      };
    }
    if (ledger.filters.preset === 'collected') {
      return {
        title: t('payments.emptyCollected.title'),
        description: prepaidOnly
          ? t('payments.emptyCollected.prepaidDescription')
          : t('payments.emptyCollected.description'),
      };
    }

    return {
      title:
        ledger.search.trim() || activeFilterCount > 0
          ? t('list.emptyFiltered')
          : t('payments.empty.title'),
      description:
        ledger.search.trim() || activeFilterCount > 0
          ? undefined
          : t('payments.empty.description'),
    };
  }, [activeFilterCount, ledger.filters.preset, ledger.filters.statuses, ledger.search, prepaidOnly, t]);

  const handleFilterNavigate = useCallback(
    (nextFilter: PaymentLedgerFilter) => {
      ledger.setFilter(nextFilter);
    },
    [ledger.setFilter],
  );

  const handleMemberPress = useCallback(
    (memberId: string) => {
      navigation.navigate('MemberDetails', { spaceId, memberId });
    },
    [navigation, spaceId],
  );

  const handlePrevMonth = useCallback(() => {
    ledger.setMonth(shiftMonth(ledger.month, -1));
  }, [ledger]);

  const handleNextMonth = useCallback(() => {
    ledger.setMonth(shiftMonth(ledger.month, 1));
  }, [ledger]);

  if (!canManage) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <EmptyState
            title={t('payments.accessDenied.title')}
            description={t('payments.accessDenied.description')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={ledger.loading} onRefresh={() => void ledger.reload()} />
        }>
      <Text style={styles.heading}>{t('payments.title')}</Text>
      <Text style={styles.subheading}>{t('payments.subtitle')}</Text>

      <MemberMealActivityMonthNav
        month={ledger.month}
        onPreviousMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      <DashboardFinancialSnapshot
        loading={ledger.loading}
        financial={ledger.summary}
        onExpectedPress={() => handleFilterNavigate('all')}
        onCollectedPress={() => handleFilterNavigate('collected')}
        onPendingPress={() => handleFilterNavigate('pending')}
      />

      <ListSearchFilterBar
        searchValue={ledger.search}
        onSearchChange={ledger.setSearch}
        searchPlaceholder={t('list.search.membersPayments')}
        onFilterPress={() => setFilterDrawerOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {ledger.loading && ledger.members.length === 0 ? (
        <SkeletonCard />
      ) : ledger.filteredMembers.length === 0 ? (
        <EmptyState
          title={paymentEmptyState.title}
          description={paymentEmptyState.description}
        />
      ) : (
        ledger.filteredMembers.map(row => (
          <MemberPaymentRow
            key={row.memberId}
            row={row}
            onPress={() => handleMemberPress(row.memberId)}
          />
        ))
      )}

      {ledger.summary?.source === 'OCCUPANCY' ? (
        <Text style={styles.hint}>{t('payments.occupancyHint')}</Text>
      ) : null}
      </ScrollView>

      <PaymentsFilterDrawer
        visible={filterDrawerOpen}
        applied={ledger.filters}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={ledger.setFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.section,
  },
  heading: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
