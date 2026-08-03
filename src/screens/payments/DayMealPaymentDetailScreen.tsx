import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CalendarDays, IndianRupee, TriangleAlert, WalletCards } from 'lucide-react-native';
import { mealsApi } from '../../api/mealsApi';
import type { MemberMealActivityDayDetail } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { MealSelectionSummary } from '../../components/meals/MealSelectionSummary';
import { PaymentReferenceLabel } from '../../components/payments/PaymentReferenceLabel';
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge';
import { Button, EmptyState, Screen, Skeleton } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
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
    <View style={styles.flex}>
      <Screen scrollable contentStyle={styles.content}>
        <MealFormHero
          icon={WalletCards}
          eyebrow={t('paymentCollection.dayMeals.detailEyebrow', { defaultValue: 'Day meal' })}
          heading={t('paymentCollection.dayMeals.detailTitle')}
          subheading={formatMenuDate(date, i18n.language)}
          compact
        />

        {loading ? (
          <View style={styles.skeletonWrap}>
            <Skeleton width="100%" height={96} borderRadius={18} />
            <Skeleton width="100%" height={140} borderRadius={18} />
          </View>
        ) : null}

        {!loading && detail && summary ? (
          <>
            <View style={styles.amountCard}>
              <View style={styles.amountIcon}>
                <IndianRupee size={20} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.amountBody}>
                <Text style={styles.amountLabel}>
                  {t('paymentCollection.dayMeals.totalAmount')}
                </Text>
                <Text style={styles.amountValue}>
                  {formatComboPrice(amount, currencyCode) ?? '—'}
                </Text>
                <View style={styles.metaRow}>
                  {hasReference ? (
                    <PaymentReferenceLabel
                      source={detail.payment}
                      compact={false}
                      style={styles.reference}
                    />
                  ) : (
                    <View style={styles.dateMeta}>
                      <CalendarDays size={12} color={colors.muted} strokeWidth={2.2} />
                      <Text style={styles.dateMetaText}>
                        {formatMenuDate(date, i18n.language)}
                      </Text>
                    </View>
                  )}
                  <PaymentStatusBadge status={displayStatus} style={styles.statusBadge} />
                </View>
              </View>
            </View>

            <MealSelectionSummary model={summary} showTotals />

            {detail.payment?.rejectionReason ? (
              <View style={styles.rejectionBanner}>
                <TriangleAlert size={16} color="#DC2626" strokeWidth={2.2} />
                <Text style={styles.rejection}>
                  {t('meals.poll.rejectionReason', { reason: detail.payment.rejectionReason })}
                </Text>
              </View>
            ) : null}

            {displayStatus === 'PENDING_APPROVAL' ? (
              <Text style={styles.waiting}>{t('paymentCollection.waitingApproval')}</Text>
            ) : null}
          </>
        ) : null}

        {!loading && !detail ? (
          <View style={styles.retryWrap}>
            <EmptyState
              Icon={WalletCards}
              title={t('paymentCollection.dayMeals.errors.loadDetail')}
              description={t('common.retry')}
            />
            <Button label={t('common.retry')} variant="secondary" onPress={() => void load()} />
          </View>
        ) : null}
      </Screen>

      {canPay && !loading && detail ? (
        <StickyFormActions
          primary={{
            label: t('paymentCollection.payNow'),
            onPress: openSubmitPayment,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  amountIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  amountValue: {
    ...typography.h2,
    fontSize: 24,
    lineHeight: 28,
    color: colors.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  reference: {
    flex: 1,
    minWidth: 0,
  },
  dateMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateMetaText: {
    ...typography.caption,
    color: colors.muted,
  },
  statusBadge: {
    flexShrink: 0,
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
  },
  rejection: {
    ...typography.body,
    flex: 1,
    color: '#DC2626',
  },
  waiting: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
  retryWrap: {
    gap: spacing.md,
  },
});
