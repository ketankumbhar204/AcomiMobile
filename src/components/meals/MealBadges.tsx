import React from 'react';
import type { MealParticipationStatus, MealPlanCode } from '../../api/types';
import { Badge } from '../ui/Badge';
import { mealParticipationStatusLabelKey, mealPlanLabelKey } from '../../utils/mealLabels';
import { useTranslation } from 'react-i18next';

type MealPlanBadgeProps = {
  code: MealPlanCode;
};

export function MealPlanBadge({ code }: MealPlanBadgeProps) {
  const { t } = useTranslation();
  return <Badge label={t(mealPlanLabelKey(code))} />;
}

type MealParticipationStatusBadgeProps = {
  status: MealParticipationStatus;
};

export function MealParticipationStatusBadge({ status }: MealParticipationStatusBadgeProps) {
  const { t } = useTranslation();
  return <Badge label={t(mealParticipationStatusLabelKey(status))} />;
}
