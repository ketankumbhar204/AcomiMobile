import React from 'react';
import { DailyMenuTodayScreen } from './DailyMenuTodayScreen';
import { MenuPlanningScreen } from './MenuPlanningScreen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { UUID } from '../../api/types';

type MealsHomeScreenProps = {
  spaceId: UUID;
};

export function MealsHomeScreen({ spaceId }: MealsHomeScreenProps) {
  const permissions = useSpacePermissions(spaceId);

  if (permissions.canManageMeals) {
    return <MenuPlanningScreen spaceId={spaceId} />;
  }

  return <DailyMenuTodayScreen spaceId={spaceId} />;
}
