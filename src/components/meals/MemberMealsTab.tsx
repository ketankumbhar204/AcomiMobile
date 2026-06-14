import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MemberDetailsResponse } from '../../api/types';
import { Button, Card } from '../ui';
import {
  MealParticipationStatusBadge,
  MealPlanBadge,
} from './MealBadges';
import { colors, spacing, typography } from '../../theme';

type MemberMealsTabProps = {
  spaceId: string;
  member: MemberDetailsResponse;
  canManage: boolean;
  onEnrollPress: () => void;
  onRefreshMember: () => void;
};

export function MemberMealsTab({
  spaceId,
  member,
  canManage,
  onEnrollPress,
  onRefreshMember,
}: MemberMealsTabProps) {
  const { t } = useTranslation();
  const [actionLoading, setActionLoading] = useState(false);
  const participation = member.mealParticipation;

  useFocusEffect(
    useCallback(() => {
      onRefreshMember();
    }, [onRefreshMember]),
  );

  const runAction = async (action: () => Promise<unknown>, successKey: string) => {
    if (!participation) {
      return;
    }
    setActionLoading(true);
    try {
      await action();
      onRefreshMember();
      Alert.alert(t('meals.actions.pause'), t(successKey));
    } catch {
      Alert.alert(t('common.errors.generic'), t('meals.errors.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  if (!participation) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.emptyTitle}>{t('meals.noParticipation')}</Text>
        <Text style={styles.emptyBody}>{t('meals.noParticipationHint')}</Text>
        {canManage ? (
          <Button label={t('meals.enroll')} onPress={onEnrollPress} style={styles.btn} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Card style={styles.card}>
        <View style={styles.badgeRow}>
          <MealPlanBadge code={participation.mealPlanCode} />
          <MealParticipationStatusBadge status={participation.status} />
        </View>
        <Text style={styles.line}>
          {t('meals.fields.effectiveFrom')}: {participation.effectiveFrom}
        </Text>
        {participation.effectiveTo ? (
          <Text style={styles.line}>
            {t('meals.fields.effectiveTo')}: {participation.effectiveTo}
          </Text>
        ) : null}
      </Card>

      {canManage ? (
        <View style={styles.actions}>
          {participation.status === 'ACTIVE' ? (
            <Button
              label={t('meals.actions.pause')}
              variant="secondary"
              loading={actionLoading}
              onPress={() =>
                void runAction(
                  () => mealsApi.pauseMealParticipation(spaceId, participation.participationId),
                  'meals.success.paused',
                )
              }
            />
          ) : null}
          {participation.status === 'PAUSED' ? (
            <Button
              label={t('meals.actions.resume')}
              loading={actionLoading}
              onPress={() =>
                void runAction(
                  () => mealsApi.resumeMealParticipation(spaceId, participation.participationId),
                  'meals.success.resumed',
                )
              }
            />
          ) : null}
          {participation.status !== 'STOPPED' ? (
            <Button
              label={t('meals.actions.changePlan')}
              variant="secondary"
              onPress={onEnrollPress}
            />
          ) : null}
          {participation.status !== 'STOPPED' ? (
            <Button
              label={t('meals.actions.stop')}
              variant="ghost"
              loading={actionLoading}
              onPress={() => {
                Alert.alert(t('meals.actions.stop'), t('meals.confirmStop'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('meals.actions.stop'),
                    style: 'destructive',
                    onPress: () =>
                      void runAction(
                        () =>
                          mealsApi.stopMealParticipation(spaceId, participation.participationId),
                        'meals.success.stopped',
                      ),
                  },
                ]);
              }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  card: { gap: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  line: { ...typography.body, color: colors.textSecondary },
  actions: { gap: spacing.sm },
  btn: { marginTop: spacing.md },
  emptyTitle: { ...typography.h3 },
  emptyBody: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
});
