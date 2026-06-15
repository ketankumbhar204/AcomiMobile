import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setMemberMealAccess } from '../../api/mealsApi';
import type { MemberDetailsResponse, SpaceType } from '../../api/types';
import { Card } from '../ui';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { isReceivingMeals } from '../../utils/mealAccess';

type MemberMealsTabProps = {
  spaceId: string;
  spaceType?: SpaceType;
  member: MemberDetailsResponse;
  canManage: boolean;
  onRefreshMember: () => void;
};

export function MemberMealsTab({
  spaceId,
  spaceType,
  member,
  canManage,
  onRefreshMember,
}: MemberMealsTabProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(false);

  const isMess = spaceType === 'MESS';
  const receiving = isReceivingMeals(member.mealParticipation);
  const hasActiveStay =
    member.occupancyStatus === 'ALLOCATED' ||
    member.currentOccupancy?.occupancyStatus === 'ACTIVE';

  const toggleLabel = isMess
    ? t('meals.mealAccess.label')
    : t('meals.foodIncluded.label');

  const onToggle = useCallback(
    async (enabled: boolean) => {
      setLoading(true);
      try {
        await setMemberMealAccess(
          spaceId,
          member.memberId,
          enabled,
          member.mealParticipation,
        );
        onRefreshMember();
        showToast(
          enabled ? t('meals.success.mealAccessOn') : t('meals.success.mealAccessOff'),
        );
      } catch {
        showToast(t('meals.errors.mealAccessFailed'));
      } finally {
        setLoading(false);
      }
    },
    [member.mealParticipation, member.memberId, onRefreshMember, showToast, spaceId, t],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('meals.sectionTitle')}</Text>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{toggleLabel}</Text>
          {canManage ? (
            loading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Switch value={receiving} onValueChange={value => void onToggle(value)} />
            )
          ) : (
            <Text style={styles.readOnlyValue}>
              {receiving ? t('common.yes') : t('common.no')}
            </Text>
          )}
        </View>

        <Text style={styles.statusLabel}>{t('meals.accessStatus.label')}</Text>
        <Text style={[styles.statusValue, receiving ? styles.statusOn : styles.statusOff]}>
          {receiving
            ? t('meals.accessStatus.receiving')
            : t('meals.accessStatus.notReceiving')}
        </Text>

        {!isMess && !hasActiveStay ? (
          <Text style={styles.hint}>{t('meals.foodIncluded.noActiveStay')}</Text>
        ) : null}

        {!isMess && hasActiveStay ? (
          <Text style={styles.hint}>{t('meals.foodIncluded.activeStayHint')}</Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  sectionTitle: { ...typography.h3 },
  card: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: { ...typography.bodyStrong, flex: 1 },
  readOnlyValue: { ...typography.body, color: colors.muted },
  statusLabel: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  statusValue: { ...typography.bodyStrong },
  statusOn: { color: colors.primaryDark },
  statusOff: { color: colors.muted },
  hint: { ...typography.caption, color: colors.muted },
});
