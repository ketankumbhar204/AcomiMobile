import React from 'react';
import { StyleSheet } from 'react-native';
import type { UUID } from '../../api/types';
import { Card } from '../ui/Card';
import { spacing } from '../../theme';
import { tomorrowIsoDate } from '../../utils/mealDates';
import { useMealPollDay } from '../../hooks/useMealPollDay';
import { DashboardTodayMenuSection } from './DashboardTodayMenuSection';
import { MealPollDayContent } from './MealPollDayContent';

type DashboardCustomerMealsSectionProps = {
  spaceId: UUID;
};

export function DashboardCustomerMealsSection({ spaceId }: DashboardCustomerMealsSectionProps) {
  const menuDate = tomorrowIsoDate();
  const poll = useMealPollDay(spaceId, menuDate);

  if (!poll.loading && poll.openPolls.length === 0) {
    return <DashboardTodayMenuSection spaceId={spaceId} />;
  }

  return (
    <Card style={styles.card}>
      <MealPollDayContent
        menuDate={menuDate}
        loading={poll.loading}
        saving={poll.saving}
        openPolls={poll.openPolls}
        selections={poll.selections}
        showSummary={poll.showSummary}
        onSelect={poll.handleSelect}
        onSave={poll.handleSave}
        onUpdateChoices={poll.handleUpdateChoices}
        variant="dashboard"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
});
