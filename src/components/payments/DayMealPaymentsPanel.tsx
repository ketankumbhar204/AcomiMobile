import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PaymentsSectionTabBar } from './PaymentsSectionTabBar';
import { DayMealPaymentBulkFooter } from './DayMealPaymentBulkFooter';
import { DayMealPaymentCard } from './DayMealPaymentCard';
import { Button, EmptyState, MonthlySummaryHeader, SkeletonCard } from '../ui';
import type { MonthlySummaryCardItem } from '../ui/MonthlySummaryCards';
import { useDayMealPaymentsMonth } from '../../hooks/useDayMealPayments';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import {
  countDayMealPaymentsInSection,
  filterDayMealPaymentsInSection,
  resolvePreferredDayMealPaymentsSection,
  selectableDayMealPayments,
  type DayMealPaymentsSection,
} from '../../utils/dayMealPayments';
import type { UUID } from '../../api/types';
import { invalidateDayMealPaymentsMonth } from '../../utils/paymentsMonthCache';

type DayMealPaymentsPanelProps = {
  spaceId: UUID;
  memberId: UUID;
  memberName?: string | null;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function DayMealPaymentsPanel({
  spaceId,
  memberId,
  memberName,
}: DayMealPaymentsPanelProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const {
    month,
    loading,
    refreshing,
    error,
    refreshError,
    items,
    summary,
    reload,
    goToPreviousMonth,
    goToNextMonth,
  } = useDayMealPaymentsMonth(spaceId, memberId, true);

  const [section, setSection] = useState<DayMealPaymentsSection>('actionNeeded');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  useEffect(() => {
    setSelectedDates([]);
  }, [month]);

  useEffect(() => {
    if (loading && items.length === 0) {
      return;
    }
    setSection(prev => resolvePreferredDayMealPaymentsSection(items, prev));
  }, [items, loading, month]);

  const onRefresh = useCallback(async () => {
    invalidateDayMealPaymentsMonth(spaceId, memberId, month);
    await reload();
  }, [memberId, month, reload, spaceId]);

  const visibleItems = useMemo(
    () => filterDayMealPaymentsInSection(items, section),
    [items, section],
  );

  const selectionMode = section === 'actionNeeded';
  const selectable = useMemo(() => selectableDayMealPayments(visibleItems), [visibleItems]);

  const selectedItems = useMemo(
    () => selectable.filter(item => selectedDates.includes(item.date)),
    [selectable, selectedDates],
  );
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const currencyCode = selectedItems[0]?.currencyCode ?? summary.currencyCode;

  const summaryCards = useMemo((): MonthlySummaryCardItem[] => {
    // Standard order: Total → Collected → Pending amount → Pending count
    return [
      {
        label: t('paymentCollection.dayMeals.summary.total'),
        value: formatComboPrice(summary.totalAmount, summary.currencyCode) ?? '—',
      },
      {
        label: t('paymentCollection.dayMeals.summary.collected'),
        value: formatComboPrice(summary.collectedAmount, summary.currencyCode) ?? '—',
        tone: 'success',
      },
      {
        label: t('paymentCollection.dayMeals.summary.pending'),
        value: formatComboPrice(summary.pendingAmount, summary.currencyCode) ?? '—',
        tone: 'pending',
      },
      {
        label: t('paymentCollection.dayMeals.summary.payments'),
        value: String(summary.pendingCount),
      },
    ];
  }, [summary, t]);

  const sectionTabs = useMemo(
    () => [
      {
        id: 'actionNeeded' as const,
        label: t('paymentCollection.tenantSections.actionNeeded', {
          count: countDayMealPaymentsInSection(items, 'actionNeeded'),
        }),
      },
      {
        id: 'underReview' as const,
        label: t('paymentCollection.tenantSections.underReview', {
          count: countDayMealPaymentsInSection(items, 'underReview'),
        }),
      },
      {
        id: 'history' as const,
        label: t('paymentCollection.tenantSections.history', {
          count: countDayMealPaymentsInSection(items, 'history'),
        }),
      },
    ],
    [items, t],
  );

  const toggleSelect = useCallback((date: string) => {
    setSelectedDates(prev =>
      prev.includes(date) ? prev.filter(row => row !== date) : [...prev, date],
    );
  }, []);

  const openDetail = useCallback(
    (date: string) => {
      navigation.navigate('DayMealPaymentDetail', {
        spaceId,
        memberId,
        date,
        memberName: memberName ?? undefined,
      });
    },
    [memberId, memberName, navigation, spaceId],
  );

  const openBulkPay = useCallback(() => {
    if (selectedItems.length === 0) {
      return;
    }
    navigation.navigate('DayMealBulkPay', {
      spaceId,
      memberId,
      dates: selectedItems.map(item => item.date),
      totalAmount: selectedTotal,
      currencyCode,
      memberName: memberName ?? undefined,
    });
    setSelectedDates([]);
  }, [
    currencyCode,
    memberId,
    memberName,
    navigation,
    selectedItems,
    selectedTotal,
    spaceId,
  ]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }>
        <Text style={styles.heading}>{t('paymentCollection.memberPayments.title')}</Text>
        {memberName ? <Text style={styles.subheading}>{memberName}</Text> : null}

        <View style={styles.summaryBlock}>
          <MonthlySummaryHeader
            month={month}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            disableNext={month >= currentMonthKey()}
            cards={summaryCards}
            hint={t('paymentCollection.dayMeals.summary.hint')}
          />
        </View>

        <PaymentsSectionTabBar
          sections={sectionTabs}
          activeSection={section}
          onSectionChange={id => {
            setSection(id as DayMealPaymentsSection);
            setSelectedDates([]);
          }}
        />

        {error ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{t('paymentCollection.dayMeals.errors.loadList')}</Text>
            <Button label={t('common.retry')} variant="secondary" onPress={() => void reload()} />
          </View>
        ) : null}

        {loading && items.length === 0 ? <SkeletonCard /> : null}

        {!loading && !error && visibleItems.length === 0 ? (
          <EmptyState
            title={t('paymentCollection.memberPayments.emptyTitle')}
            description={t(`paymentCollection.tenantSections.empty.${section}`)}
            icon="💳"
          />
        ) : null}

        {!error
          ? visibleItems.map(item => (
              <DayMealPaymentCard
                key={item.date}
                item={item}
                selectionMode={selectionMode}
                selected={selectedDates.includes(item.date)}
                onPress={() => openDetail(item.date)}
                onToggleSelect={
                  selectionMode && selectable.some(row => row.date === item.date)
                    ? () => toggleSelect(item.date)
                    : undefined
                }
              />
            ))
          : null}

        {selectionMode && selectable.length > 0 ? (
          <Text style={styles.hint}>{t('paymentCollection.dayMeals.bulk.hint')}</Text>
        ) : null}
      </ScrollView>

      <DayMealPaymentBulkFooter
        selectedCount={selectedItems.length}
        totalAmount={selectedTotal}
        currencyCode={currencyCode}
        onPaySelected={openBulkPay}
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
  summaryBlock: {
    marginBottom: spacing.md,
  },
  errorBlock: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
  },
});
