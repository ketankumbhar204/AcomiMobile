import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MemberMealActivityDayDetail } from '../../api/types';
import { MealSelectionSummary } from '../../components/meals/MealSelectionSummary';
import { PaymentReferenceLabel } from '../../components/payments/PaymentReferenceLabel';
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge';
import { Button, Screen } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { resolveDayMealPaymentDisplayStatus } from '../../utils/dayMealPayments';
import { formatMenuDate } from '../../utils/mealDates';
import { buildMealSummaryFromDayDetails } from '../../utils/mealSelectionSummary';
import { resolvePaymentReferenceDisplay } from '../../utils/paymentReference';

type Props = NativeStackScreenProps<MainStackParamList, 'DayMealPaymentDetail'>;
type Nav = NativeStackNavigationProp<MainStackParamList>;

export function DayMealPaymentDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const { spaceId, memberId, date, memberName } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<MemberMealActivityDayDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mealsApi.getMemberMealActivityDay(spaceId, memberId, date);
      setDetail(data);
    } catch {
      setDetail(null);
      showToast(t('paymentCollection.dayMeals.errors.loadDetail'));
    } finally {
      setLoading(false);
    }
  }, [date, memberId, showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const summary = useMemo(() => {
    if (!detail) {
      return null;
    }
    return buildMealSummaryFromDayDetails([detail]);
  }, [detail]);

  const paymentStatus = detail?.payment?.paymentStatus ?? null;
  const displayStatus = resolveDayMealPaymentDisplayStatus(paymentStatus, date);
  const canPay =
    displayStatus === 'PENDING' ||
    displayStatus === 'OVERDUE' ||
    displayStatus === 'REJECTED';
  const amount =
    detail?.payment?.chargedAmount != null
      ? Number(detail.payment.chargedAmount)
      : detail?.dayTotal != null
        ? Number(detail.dayTotal)
        : summary?.totalAmount ?? 0;
  const currencyCode = detail?.currencyCode ?? 'INR';
  const hasReference = Boolean(resolvePaymentReferenceDisplay(detail?.payment));

  const openSubmitPayment = useCallback(() => {
    navigation.navigate('DayMealBulkPay', {
      spaceId,
      memberId,
      dates: [date],
      totalAmount: amount,
      currencyCode,
      memberName: memberName ?? undefined,
    });
  }, [amount, currencyCode, date, memberId, memberName, navigation, spaceId]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>{t('paymentCollection.dayMeals.detailTitle')}</Text>
      <Text style={styles.date}>{formatMenuDate(date, i18n.language)}</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!loading && detail && summary ? (
        <>
          <View style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <Text style={styles.amountLabel}>{t('paymentCollection.dayMeals.totalAmount')}</Text>
              <Text style={styles.amountValue}>
                {formatComboPrice(amount, currencyCode) ?? '—'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              {hasReference ? (
                <PaymentReferenceLabel
                  source={detail.payment}
                  compact={false}
                  style={styles.reference}
                />
              ) : (
                <View style={styles.metaSpacer} />
              )}
              <PaymentStatusBadge status={displayStatus} style={styles.statusBadge} />
            </View>
          </View>

          <MealSelectionSummary model={summary} showTotals />

          {detail.payment?.rejectionReason ? (
            <Text style={styles.rejection}>
              {t('meals.poll.rejectionReason', { reason: detail.payment.rejectionReason })}
            </Text>
          ) : null}

          {canPay ? (
            <Button
              label={t('paymentCollection.payNow')}
              onPress={openSubmitPayment}
              style={styles.payBtn}
            />
          ) : null}

          {displayStatus === 'PENDING_APPROVAL' ? (
            <Text style={styles.waiting}>{t('paymentCollection.waitingApproval')}</Text>
          ) : null}
        </>
      ) : null}

      {!loading && !detail ? (
        <Pressable onPress={() => void load()}>
          <Text style={styles.retry}>{t('common.retry')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  amountCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.muted,
    flexShrink: 1,
  },
  amountValue: {
    ...typography.h2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaSpacer: {
    flex: 1,
  },
  reference: {
    flex: 1,
    minWidth: 0,
  },
  statusBadge: {
    flexShrink: 0,
  },
  rejection: {
    ...typography.body,
    color: '#DC2626',
    marginTop: spacing.sm,
  },
  payBtn: {
    marginTop: spacing.lg,
  },
  waiting: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.md,
  },
  retry: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
