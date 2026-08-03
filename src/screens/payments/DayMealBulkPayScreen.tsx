import React, { useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CalendarDays, IndianRupee, WalletCards } from 'lucide-react-native';
import { mealsApi } from '../../api/mealsApi';
import type { SpacePaymentResponse, SubmitPaymentProofRequest } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import {
  UniversalPaymentProofModal,
  type UniversalPaymentProofPayload,
} from '../../components/payments/UniversalPaymentProofModal';
import { Screen } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import { formatMenuDate } from '../../utils/mealDates';

type Props = NativeStackScreenProps<MainStackParamList, 'DayMealBulkPay'>;

function buildDayMealProofPayment(params: {
  spaceId: string;
  memberId: string;
  memberName?: string;
  dates: string[];
  totalAmount: number;
  currencyCode: string;
  title: string;
}): SpacePaymentResponse {
  const month = params.dates[0]?.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const dueDate = params.dates[0] ?? `${month}-01`;
  return {
    paymentId: `day-meal-${params.dates.join('_')}`,
    spaceId: params.spaceId,
    memberId: params.memberId,
    memberName: params.memberName ?? '',
    paymentType: 'MEAL',
    paymentCategory: 'DAILY',
    title: params.title,
    amount: params.totalAmount,
    currencyCode: params.currencyCode,
    dueDate,
    month,
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function DayMealBulkPayScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const { spaceId, memberId, dates, totalAmount, currencyCode, memberName } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const [submitting, setSubmitting] = useState(false);

  const sortedDates = useMemo(
    () => [...dates].sort((a, b) => b.localeCompare(a)),
    [dates],
  );

  const amountLabel = formatComboPrice(totalAmount, currencyCode) ?? '—';

  const proofTitle = useMemo(() => {
    if (sortedDates.length === 1) {
      return t('paymentCollection.dayMeals.bulk.proofTitleSingle', {
        date: formatMenuDate(sortedDates[0], i18n.language),
      });
    }
    return t('paymentCollection.dayMeals.bulk.proofTitleMulti', {
      count: sortedDates.length,
    });
  }, [i18n.language, sortedDates, t]);

  const payment = useMemo(
    () =>
      buildDayMealProofPayment({
        spaceId,
        memberId,
        memberName,
        dates: sortedDates,
        totalAmount,
        currencyCode,
        title: proofTitle,
      }),
    [currencyCode, memberId, memberName, proofTitle, sortedDates, spaceId, totalAmount],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('paymentCollection.dayMeals.bulk.submitTitle'),
    });
  }, [navigation, t]);

  const handleSubmit = async (payload: UniversalPaymentProofPayload) => {
    if (sortedDates.length === 0 || submitting) {
      return;
    }
    const body: SubmitPaymentProofRequest = {
      proofImageBase64: payload.proofImageBase64,
      referenceNumber: payload.referenceNumber,
      remarks: payload.remarks,
      paymentMethod: payload.paymentMethod,
    };
    setSubmitting(true);
    try {
      if (sortedDates.length === 1) {
        await mealsApi.submitMealPollPaymentProof(spaceId, sortedDates[0], body);
      } else {
        await mealsApi.submitBulkMealPollPaymentProof(spaceId, sortedDates, body);
      }
      invalidateDashboardQueries();
      const month = sortedDates[0]?.slice(0, 7);
      if (month) {
        invalidatePaymentsMonthCaches(spaceId, month);
      }
      showToast(t('paymentCollection.proof.submitted'));
      navigation.goBack();
    } catch {
      showToast(t('paymentCollection.errors.submitProof'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scrollable contentStyle={styles.content}>
      <MealFormHero
        icon={WalletCards}
        eyebrow={t('paymentCollection.dayMeals.bulk.eyebrow', { defaultValue: 'Pay' })}
        heading={t('paymentCollection.dayMeals.bulk.submitTitle')}
        subheading={t('paymentCollection.dayMeals.bulk.submitHint')}
        compact
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <IndianRupee size={20} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryLabel}>
            {t('paymentCollection.dayMeals.bulk.selected', { count: sortedDates.length })}
          </Text>
          <Text style={styles.summaryAmount}>{amountLabel}</Text>
        </View>
      </View>

      <View style={styles.datesCard}>
        <Text style={styles.datesTitle}>
          {t('paymentCollection.dayMeals.bulk.datesTitle', { defaultValue: 'Selected days' })}
        </Text>
        {sortedDates.map(date => (
          <View key={date} style={styles.dateRow}>
            <CalendarDays size={14} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.dateText}>{formatMenuDate(date, i18n.language)}</Text>
          </View>
        ))}
      </View>

      <UniversalPaymentProofModal
        visible
        presentation="inline"
        payment={payment}
        submitting={submitting}
        onClose={() => navigation.goBack()}
        onSubmit={payload => void handleSubmit(payload)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  summaryLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.muted,
  },
  summaryAmount: {
    ...typography.h2,
    fontSize: 24,
    lineHeight: 28,
    color: colors.primaryDark,
  },
  datesCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  datesTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
