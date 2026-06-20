import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealHeadcountSlot, MealType, UUID } from '../../api/types';
import { spacing } from '../../theme';
import { formatMenuDate, formatMenuDateCompact, headcountTitleKey, headcountTitleUsesDateParam } from '../../utils/mealDates';
import {
  MealHeadcountActionButtons,
  MealHeadcountPanel,
} from './MealHeadcountPanel';
import { MenuPlanningBottomSheet } from './MenuPlanningBottomSheet';

type MealHeadcountBottomSheetProps = {
  visible: boolean;
  spaceId: UUID;
  menuDate: string;
  openSlots: MealHeadcountSlot[];
  initialMealType: MealType;
  onClose: () => void;
  onReload?: () => void;
  readOnly?: boolean;
};

export function MealHeadcountBottomSheet({
  visible,
  spaceId,
  menuDate,
  openSlots,
  initialMealType,
  onClose,
  onReload,
  readOnly = false,
}: MealHeadcountBottomSheetProps) {
  const { t, i18n } = useTranslation();
  const [activeMealType, setActiveMealType] = useState(initialMealType);
  const [pollClosed, setPollClosed] = useState(false);

  useEffect(() => {
    if (visible) {
      setActiveMealType(initialMealType);
    }
  }, [initialMealType, visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const sheetTitle = headcountTitleUsesDateParam(menuDate)
    ? t(headcountTitleKey(menuDate), {
        date: formatMenuDateCompact(menuDate, i18n.language),
      })
    : t(headcountTitleKey(menuDate));

  const totalMeals = useMemo(
    () => openSlots.reduce((sum, slot) => sum + slot.mealsToPrepare, 0),
    [openSlots],
  );

  const sheetSubtitle = headcountTitleUsesDateParam(menuDate)
    ? t('dashboard.headcount.summaryTotalOnly', { count: totalMeals })
    : t('dashboard.headcount.summarySubtitle', {
        date: formatMenuDate(menuDate, i18n.language),
        count: totalMeals,
      });

  const footer =
    visible && !pollClosed && !readOnly ? (
      <MealHeadcountActionButtons
        spaceId={spaceId}
        menuDate={menuDate}
        activeMealType={activeMealType}
      />
    ) : null;

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={sheetTitle}
      subtitle={sheetSubtitle}
      onClose={handleClose}
      scrollContentStyle={styles.scrollContent}
      footer={footer}>
      <MealHeadcountPanel
        spaceId={spaceId}
        menuDate={menuDate}
        slots={openSlots}
        initialMealType={initialMealType}
        enabled={visible}
        showTotalSummary={false}
        onReload={onReload}
        onActiveMealTypeChange={setActiveMealType}
        onPollStatusChange={setPollClosed}
        readOnly={readOnly}
      />
    </MenuPlanningBottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.sm,
  },
});
