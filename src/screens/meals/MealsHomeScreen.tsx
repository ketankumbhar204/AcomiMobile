import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DashboardCustomerMealsSection } from '../../components/meals/DashboardCustomerMealsSection';
import { Screen } from '../../components/ui/Screen';
import { DailyMenuTodayScreen } from './DailyMenuTodayScreen';
import { MenuPlanningScreen } from './MenuPlanningScreen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { todayIsoDate } from '../../utils/mealDates';
import type { UUID } from '../../api/types';
import { colors, spacing, typography } from '../../theme';

type MealsHomeScreenProps = {
  spaceId: UUID;
};

export function MealsHomeScreen({ spaceId }: MealsHomeScreenProps) {
  const { t } = useTranslation();
  const permissions = useSpacePermissions(spaceId);
  const role = permissions.membershipRole;
  const isCustomerOrTenant = role === 'TENANT' || role === 'CUSTOMER';

  if (permissions.canManageMeals) {
    return <MenuPlanningScreen spaceId={spaceId} initialDate={todayIsoDate()} />;
  }

  if (isCustomerOrTenant) {
    return (
      <Screen scrollable contentStyle={styles.content}>
        <Text style={styles.title}>{t('meals.todayMealsTitle')}</Text>
        <View style={styles.section}>
          <DashboardCustomerMealsSection spaceId={spaceId} />
        </View>
      </Screen>
    );
  }

  return <DailyMenuTodayScreen spaceId={spaceId} />;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
});
