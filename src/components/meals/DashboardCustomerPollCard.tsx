import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealPollPaymentStatus, MealPollSlot } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboNameWithPrice } from '../../utils/comboPrice';
import { formatMenuDate } from '../../utils/mealDates';
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
  justSaved?: boolean;
  onAction?: () => void;
  onUploadProof?: () => void;
  onDismissSuccess?: () => void;
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
          ? formatComboNameWithPrice(option.label, option.price, option.currencyCode)
          : notSelectedLabel;
        return `${name} × ${selection.quantity}`;
      })
      .join(', ');
  }

  const selected = poll.options.find(option => option.id === poll.mySelectedOptionId);
  return selected
    ? formatComboNameWithPrice(selected.label, selected.price, selected.currencyCode)
    : notSelectedLabel;
}

function publishedMealsLine(polls: MealPollSlot[], t: (key: string) => string): string {
  const labels = sortPolls(polls).map(poll => t(mealTypeLabelKey(poll.mealType)));
  return labels.join(' • ');
}

function cardTitle(cardState: DashboardPollCardState, t: (key: string) => string): string {
  switch (cardState) {
    case 'complete':
      return t('dashboard.pollCard.selectedTitle');
    case 'partial':
      return t('dashboard.pollCard.pendingTitle');
    case 'empty':
      return t('dashboard.pollCard.title');
    default:
      return t('dashboard.pollCard.titleReady');
  }
}

function cardIcon(cardState: DashboardPollCardState): string {
  switch (cardState) {
    case 'complete':
      return '✅';
    case 'partial':
      return '⚠️';
    default:
      return '🍽';
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
  showCheckmark: boolean;
  notSelectedLabel: string;
  t: (key: string) => string;
};

function MealSlotRow({ poll, multiQuantity, showCheckmark, notSelectedLabel, t }: MealSlotRowProps) {
  const hasSelection = pollHasSelection(poll, multiQuantity);
  const label = selectionLabel(poll, multiQuantity, notSelectedLabel);

  return (
    <View style={styles.mealRow}>
      <Text style={styles.mealType}>{t(mealTypeLabelKey(poll.mealType))}</Text>
      <Text
        style={[
          styles.mealChoice,
          !hasSelection && styles.mealChoiceMissing,
        ]}>
        {label}
        {showCheckmark && hasSelection ? ' ✓' : ''}
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
  justSaved = false,
  onAction,
  onUploadProof,
  onDismissSuccess,
}: DashboardCustomerPollCardProps) {
  const { t, i18n } = useTranslation();
  const dateLabel = formatMenuDate(menuDate, i18n.language);
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

  const isPressable = showAction && !loading && onAction != null;
  const ctaVariant = cardState === 'complete' ? 'secondary' : 'primary';
  const canUploadProof =
    cardState === 'complete' &&
    paymentStatus != null &&
    (paymentStatus === 'PENDING' || paymentStatus === 'REJECTED') &&
    onUploadProof != null;

  const cardBody = (
    <>
      {justSaved && cardState === 'complete' ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{t('dashboard.pollCard.mealsUpdated')}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.headerIcon}>{cardIcon(cardState)}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>{cardTitle(cardState, t)}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
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
            {sortedPolls.length >= 3
              ? t('dashboard.pollCard.selectPromptTomorrow')
              : t('dashboard.pollCard.selectPrompt')}
          </Text>
          <Text style={styles.chooseNow}>{t('dashboard.pollCard.chooseNow')}</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {sortedPolls.map(poll => (
            <MealSlotRow
              key={poll.id}
              poll={poll}
              multiQuantity={multiQuantity}
              showCheckmark={cardState === 'partial'}
              notSelectedLabel={notSelectedLabel}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerIcon: {
    fontSize: 28,
    lineHeight: 32,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  date: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textSecondary,
  },
  body: {
    gap: spacing.sm,
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
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  mealType: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
  },
  mealChoice: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
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
});
