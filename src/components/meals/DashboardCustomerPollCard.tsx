import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import type { MealPollPaymentStatus, MealPollSlot, MealType } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { ChevronLeftIcon } from '../ui/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';
import { formatComboPrice } from '../../utils/comboPrice';
import {
  formatMenuDate,
  pollCardTitleKey,
  pollCardTitleUsesDateParam,
} from '../../utils/mealDates';
import { hasPrepaidOverflow } from '../../utils/mealPollPayment';
import { MEAL_TYPES, mealTypeLabelKey } from '../../utils/mealLabels';
import {
  buildMealSummaryFromPolls,
  type MealSummaryLineItem,
} from '../../utils/mealSelectionSummary';
import { countMenuItemsByMeal } from '../../utils/customerDashboardStats';
import { MealSelectionSummary } from './MealSelectionSummary';
import { MealTypeVisual } from './MealTypeVisual';
import { PaymentStatusBadge } from '../payments/PaymentStatusBadge';

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

function sortPolls(polls: MealPollSlot[]): MealPollSlot[] {
  return [...polls].sort(
    (a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType),
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
    return t('dashboard.pollCard.viewFullMenu');
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

type MealMiniCardProps = {
  mealType: MealType;
  itemCount: number;
  selectedItems?: MealSummaryLineItem[];
  showMealPrices?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

function MealMiniCard({
  mealType,
  itemCount,
  selectedItems = [],
  showMealPrices = true,
  onPress,
  disabled,
}: MealMiniCardProps) {
  const { t } = useTranslation();
  const label = t(mealTypeLabelKey(mealType));
  const selected = selectedItems.length > 0;
  const previewItems = selectedItems.slice(0, 2);
  const moreCount = Math.max(0, selectedItems.length - previewItems.length);

  const accessibilityDetail = selected
    ? `${t('dashboard.pollCard.youHaveSelected')}, ${previewItems
        .map(item => item.label)
        .join(', ')}`
    : t('dashboard.customer.mealItems', { count: itemCount });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.mealCard,
        selected && styles.mealCardSelected,
        pressed && onPress && !disabled && styles.mealCardPressed,
      ]}
      accessibilityRole={onPress && !disabled ? 'button' : undefined}
      accessibilityLabel={`${label}, ${accessibilityDetail}`}>
      {/* TODO: swap MealTypeVisual imageSource with real food photos when available */}
      <MealTypeVisual mealType={mealType} size={20} />
      <View style={styles.mealCardBody}>
        <Text style={styles.mealCardTitle} numberOfLines={1}>
          {label}
        </Text>
        {selected ? (
          <>
            <Text style={styles.mealCardSelectedHint} numberOfLines={1}>
              {t('dashboard.pollCard.youHaveSelected')}
            </Text>
            {previewItems.map(item => {
              const qty = item.quantity > 1 ? ` ×${item.quantity}` : '';
              const price =
                showMealPrices && item.lineAmount != null
                  ? ` (${formatComboPrice(item.lineAmount, item.currencyCode ?? 'INR') ?? ''})`
                  : '';
              return (
                <Text
                  key={`${item.label}-${item.quantity}`}
                  style={styles.mealCardSelectionLine}
                  numberOfLines={1}>
                  {item.label}
                  {qty}
                  {price}
                </Text>
              );
            })}
            {moreCount > 0 ? (
              <Text style={styles.mealCardMore} numberOfLines={1}>
                {t('dashboard.pollCard.previewMore', { count: moreCount })}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.mealCardMeta} numberOfLines={1}>
            {t('dashboard.customer.mealItems', { count: itemCount })}
          </Text>
        )}
      </View>
    </Pressable>
  );
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
  const itemCounts = useMemo(() => countMenuItemsByMeal(sortedPolls), [sortedPolls]);
  const selectionSummary = useMemo(
    () => buildMealSummaryFromPolls(sortedPolls, multiQuantity),
    [multiQuantity, sortedPolls],
  );
  const showAction = cardState !== 'empty' && onAction != null;
  const isPressable = showAction && !loading && onAction != null && !actionDisabled;
  const hasOrders = selectionSummary.totalPlates > 0;
  const showOrdersBody =
    cardState === 'partial' || cardState === 'complete' || hasOrders;
  const showPaymentStatus = paymentStatus != null && showOrdersBody;
  const ctaSecondary = cardState === 'complete' || cardState === 'partial';
  const canUploadProof =
    showPaymentStatus &&
    (paymentStatus === 'PENDING' ||
      paymentStatus === 'REJECTED' ||
      (paymentStatus as string) === 'UPDATE_REQUESTED') &&
    onUploadProof != null;
  const showPrepaidOverflow = hasPrepaidOverflow(prepaidOverflowPayment, prepaidOverflowAmount);

  useEffect(() => {
    if (!justSaved || !onDismissSuccess) {
      return;
    }
    const timer = setTimeout(onDismissSuccess, 4000);
    return () => clearTimeout(timer);
  }, [justSaved, onDismissSuccess]);

  const mealCards = MEAL_TYPES.filter(mealType => itemCounts[mealType] != null).map(mealType => {
    const selectedItems =
      selectionSummary.sections.find(section => section.mealType === mealType)?.items ?? [];
    return (
      <MealMiniCard
        key={mealType}
        mealType={mealType}
        itemCount={itemCounts[mealType] ?? 0}
        selectedItems={selectedItems}
        showMealPrices={showMealPrices}
        onPress={isPressable ? onAction : undefined}
        disabled={actionDisabled}
      />
    );
  });

  return (
    <View
      style={[
        styles.card,
        !isPastDate && cardState === 'complete' && styles.cardComplete,
        !isPastDate && cardState === 'partial' && styles.cardPartial,
        !isPastDate && cardState === 'active' && styles.cardActive,
        isPastDate && styles.cardPast,
      ]}>
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
      ) : (
        <View style={styles.body}>
          <View style={styles.mealGrid}>{mealCards}</View>

          {showOrdersBody && hasOrders ? (
            <MealSelectionSummary
              model={selectionSummary}
              variant="compact"
              showTotals={selectionSummary.totalPlates > 0 && showMealPrices}
            />
          ) : null}

          {cardState === 'partial' && !isPastDate ? (
            <Text style={styles.bodySubtext}>{t('dashboard.pollCard.completeRemaining')}</Text>
          ) : null}

          {showPaymentStatus ? (
            <View style={styles.paymentStatusRow}>
              <Text style={styles.paymentStatusLabel}>{t('meals.poll.paymentStatusLabel')}</Text>
              <PaymentStatusBadge status={paymentStatus} />
            </View>
          ) : null}

          {showPaymentStatus && paymentStatus === 'REJECTED' && rejectionReason ? (
            <Text style={styles.rejectionReason}>
              {t('meals.poll.rejectionReason', { reason: rejectionReason })}
            </Text>
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
          <Text style={[styles.ctaLabel, styles.ctaLabelProof]}>
            {t('meals.poll.uploadPaymentProof')}
          </Text>
        </TouchableOpacity>
      ) : null}

      {isPressable ? (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={[styles.cta, ctaSecondary ? styles.ctaSecondary : styles.ctaPrimary]}>
          <Text
            style={[
              styles.ctaLabel,
              ctaSecondary ? styles.ctaLabelSecondary : styles.ctaLabelPrimary,
            ]}>
            {ctaLabel}
          </Text>
          <ArrowRight
            size={18}
            color={ctaSecondary ? colors.primaryDark : colors.white}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
      ) : showAction && actionDisabled ? (
        <View style={[styles.cta, styles.ctaDisabled]}>
          <Text style={[styles.ctaLabel, styles.ctaLabelDisabled]}>{ctaLabel}</Text>
          {actionDisabledReason ? (
            <Text style={styles.ctaDisabledHint}>{actionDisabledReason}</Text>
          ) : null}
        </View>
      ) : null}
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
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: `${colors.primary}55`,
    backgroundColor: '#FAFFFE',
  },
  cardPartial: {
    borderColor: '#F59E0B66',
    backgroundColor: colors.warningTint,
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
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  dateLink: {
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  body: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  mealGrid: {
    gap: spacing.sm,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  mealCardSelected: {
    borderColor: `${colors.primary}55`,
    backgroundColor: colors.lightGreen,
  },
  mealCardPressed: {
    opacity: 0.9,
    backgroundColor: colors.surface,
  },
  mealCardBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  mealCardTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  mealCardMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  mealCardSelectedHint: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  mealCardSelectionLine: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  mealCardMore: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
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
    minHeight: 48,
    marginTop: spacing.xs,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
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
    flexDirection: 'column',
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
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  paymentStatusLabel: {
    ...typography.body,
    color: colors.muted,
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
    backgroundColor: colors.warningTint,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#F59E0B55',
    padding: spacing.md,
    gap: spacing.xxs,
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
