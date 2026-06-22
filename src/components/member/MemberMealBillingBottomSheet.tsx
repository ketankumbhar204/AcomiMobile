import React from 'react';
import { useTranslation } from 'react-i18next';
import type { MealBillingType } from '../../api/types';
import { MenuPlanningBottomSheet } from '../meals/MenuPlanningBottomSheet';
import { Button } from '../ui';
import {
  MemberMealBillingTypeSection,
  type MemberMealBillingSelection,
} from './MemberMealBillingTypeSection';

type MemberMealBillingBottomSheetProps = {
  visible: boolean;
  spaceDefault: MealBillingType;
  value: MemberMealBillingSelection;
  saving?: boolean;
  onClose: () => void;
  onChange: (value: MemberMealBillingSelection) => void;
};

export function MemberMealBillingBottomSheet({
  visible,
  spaceDefault,
  value,
  saving = false,
  onClose,
  onChange,
}: MemberMealBillingBottomSheetProps) {
  const { t } = useTranslation();

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t('members.mealBilling.title')}
      subtitle={t('members.mealBilling.subtitle')}
      onClose={onClose}
      footer={
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={onClose}
          disabled={saving}
        />
      }>
      <MemberMealBillingTypeSection
        spaceDefault={spaceDefault}
        value={value}
        onChange={onChange}
        disabled={saving}
        embedded
      />
    </MenuPlanningBottomSheet>
  );
}
