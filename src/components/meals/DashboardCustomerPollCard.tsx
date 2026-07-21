import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealPollPaymentStatus, MealPollSlot } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { ChevronLeftIcon } from '../ui/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';
import {
  formatMenuDate,
  pollCardTitleKey,
  pollCardTitleUsesDateParam,
} from '../../utils/mealDates';
import { hasPrepaidOverflow } from '../../utils/mealPollPayment';
import { MEAL_TYPES, mealTypeLabelKey } from '../../utils/mealLabels';
import { buildMealSummaryFromPolls } from '../../utils/mealSelectionSummary';
import { buildMenuPreviewFromPolls } from '../../utils/mealMenuPreview';
import { MealSelectionSummary } from './MealSelectionSummary';

export type DashboardPollCardState = 'empty' | 'active' | 'partial' | 'complete';

type DashboardCustomerPollCardProps = {
  menuDate: string;
  loading: boolean;
  openPolls: MealPollSlot[];
  multiQuantity: boolean;
  cardState: DashboardPollCardState;
  /** When true, CTA becomes View Menus and copy is review-oriented. */
  isPastDate?: boolean;
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
  /** Opens calendar picker (same pattern as owner dashboard). */
  onOpenCalendar?: () => void;
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

function publishedMealsLine(polls: MealPollSlot[], t: (key: string) => string): string {
  const labels = sortPolls(polls).map(poll => t(mealTypeLabelKey(poll.mealType)));
  return labels.join(' • ');
}

function MenuPreviewBody({
  polls,
  t,
}: {
  polls: MealPollSlot[];
  t: (key: string, options?: Record<string, string | number>) => string;
}) {
  const sections = useMemo(() => buildMenuPreviewFromPolls(polls), [polls]);
  if (sections.length === 0) {
    return (
      <Text style={styles.publishedLine}>
        {t('dashboard.pollCard.menusReady', {
          meals: publishedMealsLine(polls, t),
        })}
      </Text>
    );
  }
  return (
    <View style={styles.previewWrap}>
      {sections.map(section => (
        <View key={section.mealType} style={styles.previewSection}>
          <Text style={styles.previewMealTitle}>{t(mealTypeLabelKey(section.mealType))}</Text>
          {section.labels.map(label => (
            <Text key={label} style={styles.previewItem} numberOfLines={1}>
              • {label}
            </Text>
          ))}
          {section.remainingCount > 0 ? (
            <Text style={styles.previewMore}>
              {t('dashboard.pollCard.previewMore', { count: section.remainingCount })}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
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
  isPastDate: boolean,
): string | null {
  if (isPastDate) {
    switch (cardState) {
      case 'complete':
        return t('dashboard.pollCard.statusSelected');
      case 'partial':
        return t('dashboard.pollCard.statusPastPartial');
      case 'active':
        return t('dashboard.pollCard.statusPastMenus');
      default:
        return null;
    }
  }
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

function actionLabel(
  cardState: DashboardPollCardState,
  t: (key: string) => string,
  isPastDate: boolean,
): string {
  if (isPastDate) {
    return t('dashboard.pollCard.viewMenus');
  }
  switch (cardState) {
    case 'complete':
      return t('dashboard.pollCard.updateChoices');
    case 'partial':
      return t('dashboard.pollCard.continueSelection');
    default:
      return t('dashboard.pollCard.chooseMyMeals');
  }
}

export function DashboardCustomerPollCard({
  menuDate,
  loading,
  openPolls,
  multiQuantity,
  cardState,
  isPastDate = false,
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
  onOpenCalendar,
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
  const statusLabel = cardStatusLabel(cardState, t, isPastDate);
  const ctaLabel = actionLabel(cardState, t, isPastDate);
  const sortedPolls = useMemo(() => sortPolls(openPolls), [openPolls]);
  const selectionSummary = useMemo(
    () => buildMealSummaryFromPolls(sortedPolls, multiQuantity),
    [multiQuantity, sortedPolls],
  );
  const showAction = cardState !== 'empty' && onAction != null;

  useEffect(() => {
    if (!justSaved || !onDismissSuccess) {
      return;
    }
    const timer = setTimeout(onDismissSuccess, 4000);
    return () => clearTimeout(timer);
  }, [justSaved, onDismissSuccess]);

  const isPressable = showAction && !loading && onAction != null && !actionDisabled;
  const ctaVariant = cardState === 'complete' || cardState === 'partial' ? 'secondary' : 'primary';
  const hasOrders = selectionSummary.totalPlates > 0;
  const showOrdersBody =
    cardState === 'partial' || cardState === 'complete' || hasOrders;
  const showPaymentStatus =
    paymentStatus != null && (showOrdersBody || cardState === 'complete' || cardState === 'partial');
  const canUploadProof =
    showPaymentStatus &&
    (paymentStatus === 'PENDING' ||
      paymentStatus === 'REJECTED' ||
      (paymentStatus as string) === 'UPDATE_REQUESTED') &&
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
          <Pressable
            style={({ pressed }) => [
              styles.dateCenter,
              pressed && onOpenCalendar && styles.dateCenterPressed,
            ]}
            onPress={onOpenCalendar}
            disabled={!onOpenCalendar}
            accessibilityRole={onOpenCalendar ? 'button' : undefined}
            accessibilityLabel={dateLabel}
            accessibilityHint={onOpenCalendar ? t('meals.planning.openCalendar') : undefined}>
            <Text
              style={[styles.date, onOpenCalendar && styles.dateLink]}
              numberOfLines={1}>
              {dateLabel}
            </Text>
          </Pressable>
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
        {statusLabel && !(cardState === 'active' && !isPastDate) ? (
          <Text style={styles.statusBadge}>{statusLabel}</Text>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : cardState === 'empty' ? (
        <View style={styles.body}>
          <Text style={styles.bodyText}>{t('dashboard.pollCard.notPublished')}</Text>
          {!isPastDate ? (
            <Text style={styles.bodySubtext}>{t('dashboard.pollCard.checkLater')}</Text>
          ) : null}
        </View>
      ) : !showOrdersBody && cardState === 'active' ? (
        <View style={styles.body}>
          <MenuPreviewBody polls={sortedPolls} t={t} />
          {isPastDate ? (
            <Text style={styles.bodySubtext}>{t('dashboard.pollCard.viewPastPrompt')}</Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.body, styles.mealsBody]}>
          {hasOrders ? (
            <MealSelectionSummary
              model={selectionSummary}
              variant="compact"
              showTotals={selectionSummary.totalPlates > 0}
            />
          ) : showPaymentStatus ? (
            <Text style={styles.bodySubtext}>{t('dashboard.pollCard.ordersOnFile')}</Text>
          ) : null}
          {cardState === 'partial' && !isPastDate ? (
            <Text style={styles.bodySubtext}>{t('dashboard.pollCard.completeRemaining')}</Text>
          ) : null}
          {showPaymentStatus ? (
            <View style={styles.paymentStatusRow}>
              <Text style={styles.paymentStatusLabel}>{t('meals.poll.paymentStatusLabel')}</Text>
              <Text style={[styles.paymentStatusValue, paymentStatusStyle(paymentStatus!)]}>
                {paymentStatusLabel(paymentStatus!, t)}
              </Text>
            </View>
          ) : null}
          {showPaymentStatus && paymentStatus === 'REJECTED' && rejectionReason ? (
            <Text style={styles.rejectionReason}>
              {t('meals.poll.rejectionReason', { reason: rejectionReason })}
            </Text>
          ) : null}
          {showPaymentStatus && paymentStatus === 'PENDING_APPROVAL' ? (
            <Text style={styles.bodySubtext}>{t('meals.poll.awaitingApprovalHint')}</Text>
          ) : null}
          {showPaymentStatus && showPrepaidOverflow ? (
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
            {ctaLabel}
          </Text>
        </View>
      ) : showAction && actionDisabled ? (
        <View style={[styles.cta, styles.ctaDisabled]}>
          <Text style={[styles.ctaLabel, styles.ctaLabelDisabled]}>
            {ctaLabel}
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
        accessibilityLabel={ctaLabel}
        style={[
          styles.card,
          !isPastDate && cardState === 'complete' && styles.cardComplete,
          !isPastDate && cardState === 'partial' && styles.cardPartial,
          !isPastDate && cardState === 'active' && styles.cardActive,
          isPastDate && styles.cardPast,
          isPastDate && (cardState === 'complete' || cardState === 'partial') && styles.cardPastOrdered,
        ]}>
        {cardBody}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.card,
        !isPastDate && cardState === 'complete' && styles.cardComplete,
        !isPastDate && cardState === 'partial' && styles.cardPartial,
        !isPastDate && cardState === 'active' && styles.cardActive,
        isPastDate && styles.cardPast,
        isPastDate && (cardState === 'complete' || cardState === 'partial') && styles.cardPastOrdered,
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
  cardPast: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  cardPastOrdered: {
    borderColor: '#9CA3AF',
    backgroundColor: '#EEF2F7',
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
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.button,
    minHeight: 40,
  },
  dateCenterPressed: {
    backgroundColor: colors.surface,
  },
  date: {
    ...typography.bodyStrong,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  dateLink: {
    color: colors.primaryDark,
    textDecorationLine: 'underline',
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
  previewWrap: {
    gap: spacing.md,
  },
  previewSection: {
    gap: 2,
  },
  previewMealTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    marginBottom: 2,
  },
  previewItem: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  previewMore: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
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
