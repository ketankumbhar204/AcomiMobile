import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealPollPaymentStatus, MealPollSlot } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { ChevronLeftIcon } from '../ui/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';
import { formatComboNameWithPrice } from '../../utils/comboPrice';
import {
  formatMenuDate,
  pollCardSelectPromptKey,
  pollCardTitleKey,
  pollCardTitleUsesDateParam,
} from '../../utils/mealDates';
import { hasPrepaidOverflow } from '../../utils/mealPollPayment';
import { MEAL_TYPES, mealTypeLabelKey } from '../../utils/mealLabels';

export type DashboardPollCardState = 'empty' | 'active' | 'partial' | 'complete';

type DashboardCustomerPollCardProps = {
  menuDate: string;
  loading: boolean;
  openPolls: MealPollSlot[];
  multiQuantity: boolean;
  cardState: DashboardPollCardState;
  paymentStatus?: MealPollPaymentStatus | null;
  rejectionReason?: string | null;
  prepaidOverflowAmount?: number | null;
  prepaidDebitedAmount?: number | null;
  prepaidOverflowPayment?: boolean | null;
  justSaved?: boolean;
  onPreviousDate?: () => void;
  onNextDate?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  onAction?: () => void;
  onUploadProof?: () => void;
  onDismissSuccess?: () => void;
  actionDisabled?: boolean;
  actionDisabledReason?: string;
  showMealPrices?: boolean;
};

function paymentStatusLabel(status: MealPollPaymentStatus, t: (key: string) => string): string {
  switch (status) {
    case 'PAID':
      return t('meals.poll.paymentStatusPaid');
    case 'PENDING_APPROVAL':
      return t('meals.poll.paymentStatusPendingApproval');
    case 'REJECTED':
      return t('meals.poll.paymentStatusRejected');
    default:
      return t('meals.poll.paymentStatusPending');
  }
}

function paymentStatusStyle(status: MealPollPaymentStatus) {
  switch (status) {
    case 'PAID':
      return styles.paymentPaid;
    case 'PENDING_APPROVAL':
      return styles.paymentAwaiting;
    case 'REJECTED':
      return styles.paymentRejected;
    default:
      return styles.paymentPending;
  }
}

function sortPolls(polls: MealPollSlot[]): MealPollSlot[] {
  return [...polls].sort(
    (a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType),
  );
}

function pollHasSelection(poll: MealPollSlot, multiQuantity: boolean): boolean {
  if (multiQuantity) {
    return poll.mySelections?.some(selection => selection.quantity > 0) ?? false;
  }
  return poll.mySelectedOptionId != null;
}

function selectionLabel(
  poll: MealPollSlot,
  multiQuantity: boolean,
  notSelectedLabel: string,
  showMealPrices: boolean,
): string {
  if (multiQuantity) {
    const activeSelections = poll.mySelections?.filter(selection => selection.quantity > 0) ?? [];
    if (activeSelections.length === 0) {
      return notSelectedLabel;
    }
    return activeSelections
      .map(selection => {
        const option = poll.options.find(row => row.id === selection.optionId);
        const name = option
          ? formatComboNameWithPrice(
              option.label,
              option.price,
              option.currencyCode,
              showMealPrices,
            )
          : notSelectedLabel;
        return `${name} × ${selection.quantity}`;
      })
      .join(', ');
  }

  const selected = poll.options.find(option => option.id === poll.mySelectedOptionId);
  return selected
    ? formatComboNameWithPrice(
        selected.label,
        selected.price,
        selected.currencyCode,
        showMealPrices,
      )
    : notSelectedLabel;
}

function publishedMealsLine(polls: MealPollSlot[], t: (key: string) => string): string {
  const labels = sortPolls(polls).map(poll => t(mealTypeLabelKey(poll.mealType)));
  return labels.join(' • ');
}

function cardTitle(
  menuDate: string,
  cardState: DashboardPollCardState,
  locale: string,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const key = pollCardTitleKey(menuDate, cardState);
  if (pollCardTitleUsesDateParam(menuDate, cardState)) {
    return t(key, { date: formatMenuDate(menuDate, locale) });
  }
  return t(key);
}

function cardStatusLabel(
  cardState: DashboardPollCardState,
  t: (key: string) => string,
): string | null {
  switch (cardState) {
    case 'complete':
      return t('dashboard.pollCard.statusSelected');
    case 'partial':
      return t('dashboard.pollCard.statusPartial');
    case 'active':
      return t('dashboard.pollCard.statusReady');
    default:
      return null;
  }
}

function actionLabel(cardState: DashboardPollCardState, t: (key: string) => string): string {
  switch (cardState) {
    case 'complete':
      return t('dashboard.pollCard.updateChoices');
    case 'partial':
      return t('dashboard.pollCard.continueSelection');
    default:
      return t('dashboard.pollCard.chooseMyMeals');
  }
}

type MealSlotRowProps = {
  poll: MealPollSlot;
  multiQuantity: boolean;
  notSelectedLabel: string;
  showMealPrices: boolean;
  t: (key: string) => string;
};

function MealSlotRow({
  poll,
  multiQuantity,
  notSelectedLabel,
  showMealPrices,
  t,
}: MealSlotRowProps) {
  const hasSelection = pollHasSelection(poll, multiQuantity);
  const label = selectionLabel(poll, multiQuantity, notSelectedLabel, showMealPrices);

  return (
    <View style={styles.mealRow}>
      <Text style={styles.mealType}>{t(mealTypeLabelKey(poll.mealType))}</Text>
      <Text
        style={[
          styles.mealChoice,
          !hasSelection && styles.mealChoiceMissing,
        ]}
        numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function DashboardCustomerPollCard({
  menuDate,
  loading,
  openPolls,
  multiQuantity,
  cardState,
  paymentStatus = null,
  rejectionReason = null,
  prepaidOverflowAmount = null,
  prepaidDebitedAmount = null,
  prepaidOverflowPayment = null,
  justSaved = false,
  onPreviousDate,
  onNextDate,
  canGoPrevious = false,
  canGoNext = false,
  onAction,
  onUploadProof,
  onDismissSuccess,
  actionDisabled = false,
  actionDisabledReason,
  showMealPrices = true,
}: DashboardCustomerPollCardProps) {
  const { t, i18n } = useTranslation();
  const dateLabel = formatMenuDate(menuDate, i18n.language);
  const title = cardTitle(menuDate, cardState, i18n.language, t);
  const statusLabel = cardStatusLabel(cardState, t);
  const sortedPolls = useMemo(() => sortPolls(openPolls), [openPolls]);
  const notSelectedLabel = t('dashboard.pollCard.notSelected');
  const showAction = cardState !== 'empty' && onAction != null;

  useEffect(() => {
    if (!justSaved || !onDismissSuccess) {
      return;
    }
    const timer = setTimeout(onDismissSuccess, 4000);
    return () => clearTimeout(timer);
  }, [justSaved, onDismissSuccess]);

  const isPressable = showAction && !loading && onAction != null && !actionDisabled;
  const ctaVariant = cardState === 'complete' ? 'secondary' : 'primary';
  const canUploadProof =
    cardState === 'complete' &&
    paymentStatus != null &&
    (paymentStatus === 'PENDING' || paymentStatus === 'REJECTED' || paymentStatus === 'UPDATE_REQUESTED') &&
    onUploadProof != null;
  const showPrepaidOverflow = hasPrepaidOverflow(prepaidOverflowPayment, prepaidOverflowAmount);

  const cardBody = (
    <>
      {justSaved && cardState === 'complete' ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{t('dashboard.pollCard.mealsUpdated')}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateNavBtn, !canGoPrevious && styles.dateNavBtnDisabled]}
            onPress={onPreviousDate}
            disabled={!canGoPrevious}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronLeftIcon
              size={18}
              color={canGoPrevious ? colors.primaryDark : colors.muted}
            />
          </TouchableOpacity>
          <Text style={styles.date}>{dateLabel}</Text>
          <TouchableOpacity
            style={[styles.dateNavBtn, !canGoNext && styles.dateNavBtnDisabled]}
            onPress={onNextDate}
            disabled={!canGoNext}
            accessibilityRole="button"
            accessibilityLabel={t('common.next')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronRightIcon
              size={18}
              color={canGoNext ? colors.primaryDark : colors.muted}
            />
          </TouchableOpacity>
        </View>
        {statusLabel ? <Text style={styles.statusBadge}>{statusLabel}</Text> : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : cardState === 'empty' ? (
        <View style={styles.body}>
          <Text style={styles.bodyText}>{t('dashboard.pollCard.notPublished')}</Text>
          <Text style={styles.bodySubtext}>{t('dashboard.pollCard.checkLater')}</Text>
        </View>
      ) : cardState === 'active' ? (
        <View style={styles.body}>
          <Text style={styles.publishedLine}>
            {t('dashboard.pollCard.menusReady', {
              meals: publishedMealsLine(sortedPolls, t),
            })}
          </Text>
          <Text style={styles.bodySubtext}>
            {t(pollCardSelectPromptKey(menuDate, sortedPolls.length))}
          </Text>
          <Text style={styles.chooseNow}>{t('dashboard.pollCard.chooseNow')}</Text>
        </View>
      ) : (
        <View style={[styles.body, styles.mealsBody]}>
          {sortedPolls.map(poll => (
            <MealSlotRow
              key={poll.id}
              poll={poll}
              multiQuantity={multiQuantity}
              notSelectedLabel={notSelectedLabel}
              showMealPrices={showMealPrices}
              t={t}
            />
          ))}
          {cardState === 'partial' ? (
            <Text style={styles.bodySubtext}>{t('dashboard.pollCard.completeRemaining')}</Text>
          ) : null}
          {cardState === 'complete' && paymentStatus ? (
            <View style={styles.paymentStatusRow}>
              <Text style={styles.paymentStatusLabel}>{t('meals.poll.paymentStatusLabel')}</Text>
              <Text style={[styles.paymentStatusValue, paymentStatusStyle(paymentStatus)]}>
                {paymentStatusLabel(paymentStatus, t)}
              </Text>
            </View>
          ) : null}
          {cardState === 'complete' && paymentStatus === 'REJECTED' && rejectionReason ? (
            <Text style={styles.rejectionReason}>
              {t('meals.poll.rejectionReason', { reason: rejectionReason })}
            </Text>
          ) : null}
          {cardState === 'complete' && paymentStatus === 'PENDING_APPROVAL' ? (
            <Text style={styles.bodySubtext}>{t('meals.poll.awaitingApprovalHint')}</Text>
          ) : null}
          {cardState === 'complete' && showPrepaidOverflow ? (
            <View style={styles.overflowBanner}>
              <Text style={styles.overflowTitle}>{t('meals.poll.prepaidOverflowTitle')}</Text>
              <Text style={styles.overflowText}>
                {t('meals.poll.prepaidOverflowMessage', {
                  debited: prepaidDebitedAmount ?? 0,
                  overflow: prepaidOverflowAmount ?? 0,
                })}
              </Text>
              {paymentStatus === 'PENDING' ? (
                <Text style={styles.overflowHint}>{t('meals.poll.prepaidOverflowPayLater')}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      {canUploadProof ? (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onUploadProof}
          accessibilityRole="button"
          accessibilityLabel={t('meals.poll.uploadPaymentProof')}
          style={[styles.cta, styles.ctaProof]}>
          <Text style={[styles.ctaLabel, styles.ctaLabelProof]}>{t('meals.poll.uploadPaymentProof')}</Text>
        </TouchableOpacity>
      ) : null}

      {isPressable ? (
        <View
          style={[
            styles.cta,
            ctaVariant === 'secondary' ? styles.ctaSecondary : styles.ctaPrimary,
          ]}>
          <Text
            style={[
              styles.ctaLabel,
              ctaVariant === 'secondary' ? styles.ctaLabelSecondary : styles.ctaLabelPrimary,
            ]}>
            {actionLabel(cardState, t)}
          </Text>
        </View>
      ) : showAction && actionDisabled ? (
        <View style={[styles.cta, styles.ctaDisabled]}>
          <Text style={[styles.ctaLabel, styles.ctaLabelDisabled]}>
            {actionLabel(cardState, t)}
          </Text>
          {actionDisabledReason ? (
            <Text style={styles.ctaDisabledHint}>{actionDisabledReason}</Text>
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (isPressable) {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel(cardState, t)}
        style={[
          styles.card,
          cardState === 'complete' && styles.cardComplete,
          cardState === 'partial' && styles.cardPartial,
          cardState === 'active' && styles.cardActive,
        ]}>
        {cardBody}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.card,
        cardState === 'complete' && styles.cardComplete,
        cardState === 'partial' && styles.cardPartial,
        cardState === 'active' && styles.cardActive,
      ]}>
      {cardBody}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardActive: {
    borderColor: `${colors.primary}55`,
    backgroundColor: '#FAFFFE',
  },
  cardPressed: {
    opacity: 0.94,
  },
  cardPartial: {
    borderColor: '#F59E0B66',
    backgroundColor: '#FFFBEB',
  },
  cardComplete: {
    borderColor: `${colors.primary}44`,
    backgroundColor: '#F8FFFB',
  },
  successBanner: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statusBadge: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: spacing.xxs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dateNavBtnDisabled: {
    opacity: 0.4,
  },
  date: {
    ...typography.bodyStrong,
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    color: colors.textSecondary,
  },
  body: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  mealsBody: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  publishedLine: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  chooseNow: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  bodyText: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  bodySubtext: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 22,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  mealType: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.muted,
    minWidth: 84,
  },
  mealChoice: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    lineHeight: 22,
  },
  mealChoiceMissing: {
    color: colors.muted,
    fontStyle: 'italic',
  },
  loader: {
    marginVertical: spacing.lg,
  },
  cta: {
    width: '100%',
    minHeight: 52,
    marginTop: spacing.xs,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  ctaPrimary: {
    backgroundColor: colors.primary,
  },
  ctaSecondary: {
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  ctaDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.85,
  },
  ctaLabelDisabled: {
    color: colors.muted,
  },
  ctaDisabledHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaLabel: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  ctaLabelPrimary: {
    color: colors.white,
  },
  ctaLabelSecondary: {
    color: colors.primaryDark,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  paymentStatusLabel: {
    ...typography.body,
    color: colors.muted,
  },
  paymentStatusValue: {
    ...typography.bodyStrong,
  },
  paymentPaid: {
    color: colors.success,
  },
  paymentPending: {
    color: '#D97706',
  },
  paymentAwaiting: {
    color: '#2563EB',
  },
  paymentRejected: {
    color: '#DC2626',
  },
  rejectionReason: {
    ...typography.body,
    color: '#DC2626',
    lineHeight: 22,
  },
  ctaProof: {
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  ctaLabelProof: {
    color: colors.white,
  },
  overflowBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#F59E0B55',
    padding: spacing.md,
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  overflowTitle: {
    ...typography.bodyStrong,
    color: '#B45309',
  },
  overflowText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  overflowHint: {
    ...typography.caption,
    color: '#D97706',
    marginTop: spacing.xxs,
  },
});
