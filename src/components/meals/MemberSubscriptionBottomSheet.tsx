import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealBalanceApi } from '../../api/mealBalanceApi';
import type { MemberMealBalance, PrepaidBalanceUnit, UUID } from '../../api/types';
import { MemberSubscriptionSetupFields } from '../member/MemberSubscriptionSetupFields';
import { Button } from '../ui';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { buildSubscriptionPurchasePayload } from '../../utils/memberMealBilling';
import {
  defaultSubscriptionValidTillIso,
  parseValidTillInput,
  resolveSubscriptionValidTill,
  type SubscriptionFlowAction,
} from '../../utils/subscriptionLifecycle';
import { MemberSubscriptionDrawerSummary } from './MemberSubscriptionDrawerSummary';
import { MenuPlanningBottomSheet } from './MenuPlanningBottomSheet';

type MemberSubscriptionBottomSheetProps = {
  visible: boolean;
  spaceId: UUID;
  memberId: UUID;
  action: SubscriptionFlowAction;
  subscription: MemberMealBalance | null;
  unit: PrepaidBalanceUnit;
  onClose: () => void;
  onSaved: () => void;
};

type FieldErrors = {
  subscriptionMealQty?: string;
  subscriptionPrice?: string;
  validTill?: string;
};

export function MemberSubscriptionBottomSheet({
  visible,
  spaceId,
  memberId,
  action,
  subscription,
  unit,
  onClose,
  onSaved,
}: MemberSubscriptionBottomSheetProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [mealQty, setMealQty] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [validTill, setValidTill] = useState(defaultSubscriptionValidTillIso());
  const [remarks, setRemarks] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCreate = action === 'create';
  const titleKey = isCreate
    ? 'meals.subscription.createTitle'
    : 'meals.subscription.addMealsTitle';
  const saveLabelKey = isCreate
    ? 'meals.subscription.createAction'
    : 'meals.subscription.addMealsAction';

  const resetForm = useCallback(() => {
    if (!visible) {
      return;
    }
    if (isCreate) {
      setMealQty('');
      setSubscriptionPrice('');
      setValidTill(defaultSubscriptionValidTillIso());
      setRemarks('');
      return;
    }
    setMealQty('');
    setSubscriptionPrice('');
    const existingValidTill = resolveSubscriptionValidTill(subscription);
    setValidTill(existingValidTill ?? defaultSubscriptionValidTillIso());
    setRemarks('');
  }, [isCreate, subscription, visible]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  function validate(): boolean {
    const nextErrors: FieldErrors = {};
    if (unit === 'MEALS') {
      const qty = Number(mealQty.trim());
      if (!Number.isFinite(qty) || qty <= 0) {
        nextErrors.subscriptionMealQty = t('meals.subscription.mealsToAddRequired');
      }
    }
    const price = Number(subscriptionPrice.trim());
    if (!Number.isFinite(price) || price <= 0) {
      nextErrors.subscriptionPrice = t('meals.subscription.amountReceivedRequired');
    }
    if (!parseValidTillInput(validTill)) {
      nextErrors.validTill = t('meals.subscription.validTillRequired');
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      return;
    }
    const purchase = buildSubscriptionPurchasePayload(mealQty, subscriptionPrice, unit);
    const parsedValidTill = parseValidTillInput(validTill);
    if (!purchase || !parsedValidTill) {
      return;
    }
    setIsSubmitting(true);
    try {
      await mealBalanceApi.recordPurchase(spaceId, memberId, {
        ...purchase,
        validTill: parsedValidTill,
        remarks: remarks.trim() || undefined,
      });
      showToast(
        t(isCreate ? 'meals.subscription.createSuccess' : 'meals.subscription.addMealsSuccess'),
      );
      onSaved();
      onClose();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t(titleKey)}
      onClose={onClose}
      footer={
        <Button
          label={t(saveLabelKey)}
          onPress={() => void handleSave()}
          loading={isSubmitting}
        />
      }>
      <View style={styles.form}>
        {!isCreate ? <MemberSubscriptionDrawerSummary subscription={subscription} unit={unit} /> : null}

        {isCreate ? (
          <Text style={styles.createSubtitle}>{t('meals.subscription.createSubtitle')}</Text>
        ) : (
          <Text style={styles.addSubtitle}>{t('meals.subscription.addMealsSubtitle')}</Text>
        )}

        <MemberSubscriptionSetupFields
          unit={unit}
          mealQty={mealQty}
          subscriptionPrice={subscriptionPrice}
          validTill={validTill}
          remarks={remarks}
          onMealQtyChange={setMealQty}
          onSubscriptionPriceChange={setSubscriptionPrice}
          onValidTillChange={setValidTill}
          onRemarksChange={setRemarks}
          mealQtyError={fieldErrors.subscriptionMealQty}
          subscriptionPriceError={fieldErrors.subscriptionPrice}
          validTillError={fieldErrors.validTill}
          hideHeader
          showRemarks
          mealQtyLabelOverride={
            isCreate ? undefined : t('meals.subscription.mealsToAddLabel')
          }
          subscriptionPriceLabelOverride={
            isCreate ? undefined : t('meals.subscription.amountReceivedLabel')
          }
          mealQtyPlaceholderOverride={
            isCreate ? undefined : t('meals.subscription.mealsToAddPlaceholder')
          }
          subscriptionPricePlaceholderOverride={
            isCreate ? undefined : t('meals.subscription.amountReceivedPlaceholder')
          }
        />
      </View>
    </MenuPlanningBottomSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingBottom: spacing.sm,
  },
  createSubtitle: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  addSubtitle: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
});
