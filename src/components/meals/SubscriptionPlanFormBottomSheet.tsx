import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  CreateSubscriptionPlanRequest,
  SubscriptionPlanResponse,
  UpdateSubscriptionPlanRequest,
} from '../../api/types';
import { Button, FormInput } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { MenuPlanningBottomSheet } from './MenuPlanningBottomSheet';

type SubscriptionPlanFormBottomSheetProps = {
  visible: boolean;
  mode: 'create' | 'edit';
  plan?: SubscriptionPlanResponse | null;
  onClose: () => void;
  onSave: (payload: CreateSubscriptionPlanRequest | UpdateSubscriptionPlanRequest) => Promise<void>;
};

type FieldErrors = {
  name?: string;
  mealsIncluded?: string;
  price?: string;
  validityDays?: string;
};

export function SubscriptionPlanFormBottomSheet({
  visible,
  mode,
  plan,
  onClose,
  onSave,
}: SubscriptionPlanFormBottomSheetProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [mealsIncluded, setMealsIncluded] = useState('');
  const [price, setPrice] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [carryForwardUnused, setCarryForwardUnused] = useState(false);
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (mode === 'edit' && plan) {
      setName(plan.name);
      setMealsIncluded(String(plan.mealsIncluded));
      setPrice(String(plan.price));
      setValidityDays(String(plan.validityDays));
      setCarryForwardUnused(plan.carryForwardUnused);
      setDescription(plan.description ?? '');
    } else {
      setName('');
      setMealsIncluded('');
      setPrice('');
      setValidityDays('30');
      setCarryForwardUnused(false);
      setDescription('');
    }
    setFieldErrors({});
  }, [mode, plan, visible]);

  const validate = useCallback((): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) {
      next.name = t('meals.subscriptionPlans.nameRequired');
    }
    const meals = Number(mealsIncluded.trim());
    if (!mealsIncluded.trim() || !Number.isFinite(meals) || meals <= 0) {
      next.mealsIncluded = t('meals.subscriptionPlans.mealsRequired');
    }
    const amount = Number(price.trim());
    if (!price.trim() || !Number.isFinite(amount) || amount <= 0) {
      next.price = t('meals.subscriptionPlans.priceRequired');
    }
    const days = Number(validityDays.trim());
    if (!validityDays.trim() || !Number.isFinite(days) || days <= 0) {
      next.validityDays = t('meals.subscriptionPlans.validityRequired');
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }, [mealsIncluded, name, price, t, validityDays]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateSubscriptionPlanRequest = {
        name: name.trim(),
        mealsIncluded: Number(mealsIncluded.trim()),
        price: Number(price.trim()),
        validityDays: Number(validityDays.trim()),
        carryForwardUnused,
        description: description.trim() || undefined,
      };
      if (mode === 'edit') {
        await onSave({ ...payload, active: plan?.isActive ?? true });
      } else {
        await onSave(payload);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [
    carryForwardUnused,
    description,
    mealsIncluded,
    mode,
    name,
    onClose,
    onSave,
    plan?.isActive,
    price,
    validate,
    validityDays,
  ]);

  const titleKey =
    mode === 'create'
      ? 'meals.subscriptionPlans.createTitle'
      : 'meals.subscriptionPlans.editTitle';

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t(titleKey)}
      subtitle={t('meals.subscriptionPlans.formSubtitle')}
      onClose={onClose}
      footer={
        <Button
          label={t('common.save')}
          onPress={() => void handleSave()}
          loading={submitting}
        />
      }>
      <FormInput
        label={t('meals.subscriptionPlans.nameLabel')}
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        placeholder={t('meals.subscriptionPlans.namePlaceholder')}
      />
      <FormInput
        label={t('meals.subscriptionPlans.mealsLabel')}
        value={mealsIncluded}
        onChangeText={setMealsIncluded}
        error={fieldErrors.mealsIncluded}
        keyboardType="number-pad"
        placeholder="30"
      />
      <FormInput
        label={t('meals.subscriptionPlans.priceLabel')}
        value={price}
        onChangeText={setPrice}
        error={fieldErrors.price}
        keyboardType="decimal-pad"
        placeholder="3000"
      />
      <FormInput
        label={t('meals.subscriptionPlans.validityLabel')}
        value={validityDays}
        onChangeText={setValidityDays}
        error={fieldErrors.validityDays}
        keyboardType="number-pad"
        placeholder="30"
      />

      <Text style={styles.sectionLabel}>{t('meals.subscriptionPlans.unusedMealsLabel')}</Text>
      <View style={styles.optionRow}>
        <Button
          label={t('meals.subscriptionPlans.expireUnused')}
          variant={!carryForwardUnused ? 'primary' : 'secondary'}
          onPress={() => setCarryForwardUnused(false)}
          style={styles.optionButton}
        />
        <Button
          label={t('meals.subscriptionPlans.carryForward')}
          variant={carryForwardUnused ? 'primary' : 'secondary'}
          onPress={() => setCarryForwardUnused(true)}
          style={styles.optionButton}
        />
      </View>

      <FormInput
        label={t('meals.subscriptionPlans.descriptionLabel')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('meals.subscriptionPlans.descriptionPlaceholder')}
        multiline
      />
    </MenuPlanningBottomSheet>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionButton: {
    flex: 1,
  },
});
