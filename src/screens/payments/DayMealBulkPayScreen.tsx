import React, { useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { SpacePaymentResponse, SubmitPaymentProofRequest } from '../../api/types';
import {
  UniversalPaymentProofModal,
  type UniversalPaymentProofPayload,
} from '../../components/payments/UniversalPaymentProofModal';
import { Screen } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
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
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {t('paymentCollection.dayMeals.bulk.selected', { count: sortedDates.length })}
        </Text>
        <Text style={styles.summaryAmount}>{amountLabel}</Text>
        <Text style={styles.summaryHint}>{t('paymentCollection.dayMeals.bulk.submitHint')}</Text>
      </View>

      <View style={styles.datesBlock}>
        {sortedDates.map(date => (
          <Text key={date} style={styles.dateRow}>
            • {formatMenuDate(date, i18n.language)}
          </Text>
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
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.bodyStrong,
  },
  summaryAmount: {
    ...typography.h2,
  },
  summaryHint: {
    ...typography.caption,
    color: colors.muted,
  },
  datesBlock: {
    gap: spacing.xxs,
  },
  dateRow: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
