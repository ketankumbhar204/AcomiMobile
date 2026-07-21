import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  MealDeliveryLocation,
  MealPollPaymentChoice,
  MealPollSlot,
  MealType,
  UUID,
} from '../../api/types';
import { formatMenuDate, isPastMenuDate } from '../../utils/mealDates';
import { buildMealSummaryFromDraftSelections } from '../../utils/mealSelectionSummary';
import { MealPollDayContent } from './MealPollDayContent';
import { MealPollPaymentProofModal } from './MealPollPaymentProofModal';
import { MealSelectionSummary } from './MealSelectionSummary';
import {
  MenuPlanningBottomSheet,
  SheetPrimaryButton,
  SheetSecondaryButton,
} from './MenuPlanningBottomSheet';
import { colors, spacing, typography } from '../../theme';

type MealPollResponseBottomSheetProps = {
  visible: boolean;
  menuDate: string;
  loading: boolean;
  saving: boolean;
  openPolls: MealPollSlot[];
  selections: Partial<Record<MealType, UUID>>;
  quantitySelections: Partial<Record<MealType, Record<UUID, number>>>;
  multiQuantity: boolean;
  requiresPayment: boolean;
  totalPlates: number;
  totalPlatesForMeal: (mealType: MealType) => number;
  deliveryLocations: MealDeliveryLocation[];
  deliverySelections: Partial<Record<MealType, UUID>>;
  lastDeliveryLocations: Partial<Record<MealType, UUID>>;
  onDeliveryLocationChange: (mealType: MealType, locationId: UUID) => void;
  onSelect: (mealType: MealType, optionId: UUID) => void;
  onQuantityChange: (mealType: MealType, optionId: UUID, quantity: number) => void;
  onSave: () => Promise<boolean>;
  onSubmitWithPayment: (
    paymentChoice: MealPollPaymentChoice,
    proofImageBase64?: string,
  ) => Promise<boolean>;
  onClose: () => void;
};

export function MealPollResponseBottomSheet({
  visible,
  menuDate,
  loading,
  saving,
  openPolls,
  selections,
  quantitySelections,
  multiQuantity,
  requiresPayment,
  totalPlates,
  totalPlatesForMeal,
  deliveryLocations,
  deliverySelections,
  lastDeliveryLocations,
  onDeliveryLocationChange,
  onSelect,
  onQuantityChange,
  onSave,
  onSubmitWithPayment,
  onClose,
}: MealPollResponseBottomSheetProps) {
  const { t, i18n } = useTranslation();
  const dateLabel = formatMenuDate(menuDate, i18n.language);
  const dateReadOnly = isPastMenuDate(menuDate);
  const [paymentStep, setPaymentStep] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);

  const paymentSummary = useMemo(
    () =>
      buildMealSummaryFromDraftSelections(
        openPolls,
        multiQuantity,
        selections,
        quantitySelections,
        deliverySelections,
        deliveryLocations,
      ),
    [
      deliveryLocations,
      deliverySelections,
      multiQuantity,
      openPolls,
      quantitySelections,
      selections,
    ],
  );

  useEffect(() => {
    if (!visible) {
      setPaymentStep(false);
      setProofModalOpen(false);
    }
  }, [visible]);

  const handleSavePress = async () => {
    const proceedToPayment = await onSave();
    if (proceedToPayment && requiresPayment) {
      setPaymentStep(true);
    }
  };

  const handleProofSubmit = async (proofImageBase64: string) => {
    const success = await onSubmitWithPayment('MARK_AS_PAID', proofImageBase64);
    if (success) {
      setProofModalOpen(false);
      setPaymentStep(false);
    }
  };

  const footer =
    !dateReadOnly && !loading && openPolls.length > 0 ? (
      paymentStep ? (
        <View style={styles.paymentFooter}>
          <Text style={styles.paymentPrompt}>{t('meals.poll.paymentPrompt')}</Text>
          <SheetPrimaryButton
            label={t('meals.poll.markAsPaid')}
            onPress={() => setProofModalOpen(true)}
            disabled={saving}
            loading={saving}
          />
          <SheetSecondaryButton
            label={t('meals.poll.payLater')}
            onPress={() => void onSubmitWithPayment('PAY_LATER')}
            disabled={saving}
          />
          <Text style={styles.backLink} onPress={() => setPaymentStep(false)}>
            {t('meals.poll.backToChoices')}
          </Text>
        </View>
      ) : (
        <SheetPrimaryButton
          label={saving ? t('meals.poll.submitting') : t('meals.poll.submit')}
          onPress={() => void handleSavePress()}
          disabled={saving}
          loading={saving}
        />
      )
    ) : null;

  return (
    <>
      <MenuPlanningBottomSheet
        visible={visible}
        title={paymentStep ? t('meals.poll.paymentTitle') : t('meals.poll.responseTitle')}
        onClose={onClose}
        scrollContentStyle={{ paddingTop: 0 }}
        footer={footer}>
        {paymentStep ? (
          <View style={styles.paymentBody}>
            <MealSelectionSummary
              model={paymentSummary}
              variant="detailed"
              showTotals
              title={t('meals.poll.paymentReviewTitle')}
            />
            <View style={styles.paymentMeta}>
              <Text style={styles.paymentDate}>{dateLabel}</Text>
              <Text style={styles.paymentType}>{t('meals.poll.paymentTypeMeal')}</Text>
            </View>
            <Text style={styles.paymentHint}>{t('meals.poll.paymentHint')}</Text>
          </View>
        ) : (
          <MealPollDayContent
            menuDate={menuDate}
            loading={loading}
            saving={saving}
            openPolls={openPolls}
            selections={selections}
            quantitySelections={quantitySelections}
            multiQuantity={multiQuantity}
            showSummary={false}
            totalPlates={totalPlates}
            totalPlatesForMeal={totalPlatesForMeal}
            deliveryLocations={deliveryLocations}
            deliverySelections={deliverySelections}
            lastDeliveryLocations={lastDeliveryLocations}
            onDeliveryLocationChange={onDeliveryLocationChange}
            onSelect={onSelect}
            onQuantityChange={onQuantityChange}
            onSave={() => void handleSavePress()}
            onUpdateChoices={() => undefined}
            variant="sheet"
            dateLabel={dateLabel}
            hideSubmitButton
            readOnly={dateReadOnly}
          />
        )}
      </MenuPlanningBottomSheet>

      <MealPollPaymentProofModal
        visible={proofModalOpen}
        submitting={saving}
        onClose={() => setProofModalOpen(false)}
        onSubmit={proof => void handleProofSubmit(proof)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  paymentFooter: {
    gap: spacing.sm,
  },
  paymentPrompt: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  paymentBody: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  paymentMeta: {
    gap: spacing.xxs,
  },
  paymentHint: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 22,
  },
  paymentDate: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  paymentType: {
    ...typography.caption,
    color: colors.muted,
  },
  backLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
