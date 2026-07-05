import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberDetailsResponse, SpaceType } from '../../api/types';
import { Card, EmptyState } from '../ui';
import { MealParticipationStatusBadge } from './MealBadges';
import { MemberMealBillingPanel } from '../member/MemberMealBillingPanel';
import { spacing, typography } from '../../theme';
import { mealPlanLabelKey } from '../../utils/mealLabels';
import { MemberMealActivitySection } from './MemberMealActivitySection';

type MemberMealsTabProps = {
  spaceId: string;
  spaceType?: SpaceType;
  member: MemberDetailsResponse;
  canManageBalance?: boolean;
  canEditMember?: boolean;
  onBillingChanged?: () => void;
  onSelectActivityDate: (date: string) => void;
  onBindActivityReload?: (reload: () => void) => void;
  selectedActivityDate?: string | null;
};

function hasMealParticipation(member: MemberDetailsResponse): boolean {
  const participation = member.mealParticipation;
  if (!participation) {
    return false;
  }
  return participation.mealPlanCode !== 'NONE' && participation.status !== 'STOPPED';
}

export function MemberMealsTab({
  spaceId,
  spaceType,
  member,
  canManageBalance = false,
  canEditMember = false,
  onBillingChanged,
  onSelectActivityDate,
  onBindActivityReload,
  selectedActivityDate,
}: MemberMealsTabProps) {
  const { t } = useTranslation();
  const isMess = spaceType === 'MESS';

  if (!isMess && !hasMealParticipation(member)) {
    return (
      <View style={styles.wrap}>
        <EmptyState
          icon="🍽"
          title={t('membership.meals.emptyTitle')}
          description={t('membership.meals.emptyDescription')}
        />
      </View>
    );
  }

  if (!isMess) {
    const participation = member.mealParticipation!;
    return (
      <View style={styles.wrap}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('membership.meals.summaryTitle')}</Text>
          <Text style={styles.summaryPlan}>
            {t(mealPlanLabelKey(participation.mealPlanCode))}
          </Text>
          <MealParticipationStatusBadge status={participation.status} />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <MemberMealBillingPanel
        spaceId={spaceId}
        member={member}
        spaceType={spaceType}
        canEdit={canEditMember}
        onBillingChanged={onBillingChanged}
      />
      <MemberMealActivitySection
        spaceId={spaceId}
        memberId={member.memberId}
        effectiveMealBillingType={member.effectiveMealBillingType}
        canManageBalance={canManageBalance}
        selectedDate={selectedActivityDate}
        onSelectDate={onSelectActivityDate}
        onBindReload={onBindActivityReload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    marginTop: spacing.xxs,
  },
  summaryCard: {
    marginTop: spacing.sm,
  },
  summaryTitle: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  summaryPlan: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
});
