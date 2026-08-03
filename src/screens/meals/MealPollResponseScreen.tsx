import React, { useMemo, useLayoutEffect, useState, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClipboardList, Vote } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { MealPollPaymentStatus, UUID } from '../../api/types';
import { MealPollDayContent } from '../../components/meals/MealPollDayContent';
import { MealFormHero } from '../../components/meals';
import { MealPollPaymentProofModal } from '../../components/meals/MealPollPaymentProofModal';
import { MealSelectionSummary } from '../../components/meals/MealSelectionSummary';
import { Button, EmptyState } from '../../components/ui';
import { useMealPollDay } from '../../hooks/useMealPollDay';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useScreenBackButton } from '../../hooks/useScreenBackButton';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMenuDate, isPastMenuDate } from '../../utils/mealDates';
import { formatComboPrice } from '../../utils/comboPrice';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { buildMealSummaryFromDraftSelections } from '../../utils/mealSelectionSummary';

type MealPollResponseScreenProps = {
  spaceId: UUID;
  menuDate: string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

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

export function MealPollResponseScreen({ spaceId, menuDate }: MealPollResponseScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  useScreenBackButton(false);
  const permissions = useSpacePermissions(spaceId);
  const mealPricing = useMealPricingPolicy(spaceId);
  const poll = useMealPollDay(spaceId, menuDate, permissions.spaceType, {
    startInEditMode: true,
    onSaved: () => {
      navigation.goBack();
    },
  });
  const dateReadOnly = isPastMenuDate(menuDate);
  const mealEditsLocked = poll.mealEditsLocked;
  const pollsClosedOnly =
    !poll.loading && poll.openPolls.length === 0 && poll.displayPolls.length > 0;
  const viewOnly = dateReadOnly || mealEditsLocked || pollsClosedOnly;
  const [paymentStep, setPaymentStep] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const visiblePolls = poll.displayPolls;

  const paymentSummary = useMemo(
    () =>
      buildMealSummaryFromDraftSelections(
        visiblePolls,
        poll.multiQuantity,
        poll.selections,
        poll.quantitySelections,
        poll.deliverySelections,
        poll.deliveryLocations,
      ),
    [
      poll.deliveryLocations,
      poll.deliverySelections,
      poll.multiQuantity,
      poll.quantitySelections,
      poll.selections,
      visiblePolls,
    ],
  );

  const mealProgress = useMemo(() => {
    const locationById = new Map(
      poll.deliveryLocations.map(location => [location.id, location.name]),
    );
    return visiblePolls.map(slot => {
      const plates = poll.totalPlatesForMeal(slot.mealType);
      const locationId = poll.deliverySelections[slot.mealType];
      return {
        mealType: slot.mealType,
        plates,
        selected: plates > 0,
        locationName: locationId ? locationById.get(locationId) ?? null : null,
      };
    });
  }, [poll, visiblePolls]);

  const incompleteMealTypes = useMemo(
    () => mealProgress.filter(row => !row.selected).map(row => row.mealType),
    [mealProgress],
  );

  const hasAnySelection = mealProgress.some(row => row.selected);
  const hasIncompleteMeals =
    hasAnySelection && incompleteMealTypes.length > 0 && incompleteMealTypes.length < mealProgress.length;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: paymentStep ? t('meals.poll.paymentTitle') : t('meals.poll.responseTitle'),
    });
  }, [navigation, paymentStep, t]);

  const runSave = useCallback(async () => {
    const proceedToPayment = await poll.handleSave();
    if (proceedToPayment && poll.requiresPayment && poll.myPaymentStatus !== 'PAID') {
      setPaymentStep(true);
    }
  }, [poll]);

  const handleSavePress = useCallback(() => {
    if (poll.saving || poll.showSummary) {
      return;
    }
    if (hasIncompleteMeals) {
      const mealNames = incompleteMealTypes
        .map(mealType => t(mealTypeLabelKey(mealType)))
        .join(', ');
      const selectedNames = mealProgress
        .filter(row => row.selected)
        .map(row => t(mealTypeLabelKey(row.mealType)))
        .join(', ');
      Alert.alert(
        t('meals.poll.partialSaveTitle'),
        t('meals.poll.partialSaveBody', {
          missing: mealNames,
          selected: selectedNames,
        }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('meals.poll.partialSaveConfirm'),
            onPress: () => void runSave(),
          },
        ],
      );
      return;
    }
    void runSave();
  }, [
    hasIncompleteMeals,
    incompleteMealTypes,
    mealProgress,
    poll.saving,
    poll.showSummary,
    runSave,
    t,
  ]);

  const handlePayLater = async () => {
    const success = await poll.submitWithPayment('PAY_LATER');
    if (success) {
      setPaymentStep(false);
    }
  };

  const handleProofSubmit = async (proofImageBase64: string) => {
    const success = await poll.submitWithPayment('MARK_AS_PAID', proofImageBase64);
    if (success) {
      setProofModalOpen(false);
      setPaymentStep(false);
    }
  };

  const showStickySave =
    !paymentStep && !poll.loading && visiblePolls.length > 0 && !viewOnly;

  const stickySaveLabel = poll.showSummary
    ? t('meals.poll.updateChoices')
    : poll.saving
      ? t('meals.poll.submitting')
      : t('meals.poll.submit');

  const stickySummaryLine = useMemo(() => {
    if (poll.showSummary || paymentSummary.totalPlates <= 0) {
      return null;
    }
    const plates = t('meals.poll.stickyPlates', { count: paymentSummary.totalPlates });
    if (!mealPricing.showMealPrices || paymentSummary.totalAmount <= 0) {
      return plates;
    }
    const total = formatComboPrice(
      paymentSummary.totalAmount,
      paymentSummary.currencyCode,
    );
    return t('meals.poll.stickyPlatesAndTotal', {
      plates: paymentSummary.totalPlates,
      total: total ?? '',
    });
  }, [
    mealPricing.showMealPrices,
    paymentSummary.currencyCode,
    paymentSummary.totalAmount,
    paymentSummary.totalPlates,
    poll.showSummary,
    t,
  ]);

  return (
    <>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                showStickySave && !paymentStep
                  ? spacing.section + 140
                  : spacing.section + Math.max(insets.bottom, spacing.md),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <MealFormHero
            icon={Vote}
            eyebrow={t('meals.title')}
            heading={
              paymentStep ? t('meals.poll.paymentTitle') : t('meals.poll.responseTitle')
            }
            subheading={formatMenuDate(menuDate, i18n.language)}
          />
          {!poll.loading && visiblePolls.length === 0 ? (
            <EmptyState
              title={
                dateReadOnly
                  ? t('dashboard.pollCard.notPublished')
                  : t('meals.poll.noOpenPolls')
              }
              Icon={ClipboardList}
            />
          ) : paymentStep && !viewOnly ? (
            <View style={styles.paymentBlock}>
              <MealSelectionSummary
                model={paymentSummary}
                variant="detailed"
                showTotals
                title={t('meals.poll.paymentReviewTitle')}
              />
              <View style={styles.paymentMeta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{t('meals.poll.pollDateLabel')}</Text>
                  <Text style={styles.metaValue}>
                    {formatMenuDate(menuDate, i18n.language)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{t('meals.poll.paymentTypeLabel')}</Text>
                  <Text style={styles.metaValue}>{t('meals.poll.paymentTypeMeal')}</Text>
                </View>
              </View>
              <Text style={styles.paymentPrompt}>{t('meals.poll.paymentPrompt')}</Text>
              <Text style={styles.paymentHint}>{t('meals.poll.paymentHint')}</Text>
              <Button
                label={t('meals.poll.markAsPaid')}
                onPress={() => setProofModalOpen(true)}
                loading={poll.saving}
                style={styles.button}
              />
              <Button
                label={t('meals.poll.payLater')}
                variant="secondary"
                onPress={() => void handlePayLater()}
                disabled={poll.saving}
                style={styles.button}
              />
              <Text style={styles.backLink} onPress={() => setPaymentStep(false)}>
                {t('meals.poll.backToChoices')}
              </Text>
            </View>
          ) : (
            <>
              {mealEditsLocked ? (
                <View style={styles.lockBanner}>
                  <Text style={styles.lockBannerText}>
                    {t('meals.poll.paymentUnderReviewLock')}
                  </Text>
                </View>
              ) : null}
              <MealPollDayContent
                menuDate={menuDate}
                loading={poll.loading}
                saving={poll.saving}
                openPolls={visiblePolls}
                selections={poll.selections}
                quantitySelections={poll.quantitySelections}
                multiQuantity={poll.multiQuantity}
                showSummary={poll.showSummary || mealEditsLocked}
                totalPlates={poll.totalPlates}
                totalPlatesForMeal={poll.totalPlatesForMeal}
                deliveryLocations={poll.deliveryLocations}
                deliverySelections={poll.deliverySelections}
                lastDeliveryLocations={poll.lastDeliveryLocations}
                onDeliveryLocationChange={poll.handleDeliveryLocationChange}
                onSelect={poll.handleSelect}
                onQuantityChange={poll.handleQuantityChange}
                onSave={handleSavePress}
                onUpdateChoices={poll.handleUpdateChoices}
                variant="screen"
                hideSubmitButton
                readOnly={viewOnly}
                showMealPrices={mealPricing.showMealPrices}
              />
              {(dateReadOnly || mealEditsLocked) && poll.myPaymentStatus ? (
                <View style={styles.paymentStatusBlock}>
                  <Text style={styles.paymentStatusLabel}>
                    {t('meals.poll.paymentStatusLabel')}
                  </Text>
                  <Text style={styles.paymentStatusValue}>
                    {paymentStatusLabel(poll.myPaymentStatus, t)}
                  </Text>
                  {poll.myPaymentStatus === 'REJECTED' && poll.myRejectionReason ? (
                    <Text style={styles.rejectionReason}>
                      {t('meals.poll.rejectionReason', { reason: poll.myRejectionReason })}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        {showStickySave && !paymentStep ? (
          <View
            style={[
              styles.stickyBar,
              { paddingBottom: Math.max(insets.bottom, spacing.md) },
            ]}>
            {!poll.showSummary && mealProgress.length > 0 ? (
              <View style={styles.progressBlock}>
                {mealProgress.map(row => (
                  <View key={row.mealType} style={styles.progressRow}>
                    <Text
                      style={[
                        styles.progressMeal,
                        row.selected ? styles.progressOk : styles.progressWarn,
                      ]}
                      numberOfLines={1}>
                      {row.selected
                        ? t('meals.poll.progressSelected', {
                            meal: t(mealTypeLabelKey(row.mealType)),
                            count: row.plates,
                          })
                        : t('meals.poll.progressMissing', {
                            meal: t(mealTypeLabelKey(row.mealType)),
                          })}
                    </Text>
                    {row.locationName ? (
                      <Text
                        style={[
                          styles.progressLocation,
                          row.selected ? styles.progressOk : styles.progressWarn,
                        ]}
                        numberOfLines={1}>
                        {row.locationName}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
            {stickySummaryLine ? (
              <Text style={styles.stickySummary}>{stickySummaryLine}</Text>
            ) : null}
            <Button
              label={stickySaveLabel}
              onPress={
                poll.showSummary
                  ? poll.handleUpdateChoices
                  : handleSavePress
              }
              loading={!poll.showSummary && poll.saving}
              disabled={poll.saving}
              variant={poll.showSummary ? 'secondary' : 'primary'}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <MealPollPaymentProofModal
        visible={proofModalOpen}
        submitting={poll.saving}
        onClose={() => setProofModalOpen(false)}
        onSubmit={proof => void handleProofSubmit(proof)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  button: { marginTop: spacing.sm },
  stickyBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  progressBlock: {
    gap: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressMeal: {
    ...typography.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
  progressLocation: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 0,
    maxWidth: '42%',
    textAlign: 'right',
  },
  progressOk: {
    color: colors.primaryDark,
  },
  progressWarn: {
    color: '#B45309',
  },
  stickySummary: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 15,
  },
  paymentBlock: { gap: spacing.md, marginTop: spacing.sm },
  paymentMeta: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaLabel: {
    ...typography.body,
    color: colors.muted,
  },
  metaValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  paymentPrompt: { ...typography.h3 },
  paymentHint: { ...typography.body, color: colors.muted, lineHeight: 22 },
  backLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  lockBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lockBannerText: {
    ...typography.body,
    color: '#991B1B',
    lineHeight: 22,
  },
  paymentStatusBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  paymentStatusLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  paymentStatusValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  rejectionReason: {
    ...typography.body,
    color: colors.muted,
  },
});
