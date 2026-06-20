import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberDetailsResponse, SpaceType } from '../../api/types';
import { setMemberMealAccess } from '../../api/mealsApi';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { isReceivingMeals } from '../../utils/mealAccess';
import { memberCountInBadgeLabel } from '../../utils/memberAppStatus';
import { getMemberStatusColor, getMemberStatusLabelKey } from '../../utils/memberStatus';

type MemberCompactHeaderProps = {
  member: MemberDetailsResponse;
  spaceId: string;
  spaceType?: SpaceType;
  showMealAccess?: boolean;
  canManageMeals?: boolean;
  onRefreshMember?: () => void;
};

export function MemberCompactHeader({
  member,
  spaceId,
  spaceType,
  showMealAccess = false,
  canManageMeals = false,
  onRefreshMember,
}: MemberCompactHeaderProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [toggling, setToggling] = useState(false);

  const receiving = isReceivingMeals(member.mealParticipation);
  const statusColor = getMemberStatusColor(member.status);
  const statusLabel = t(getMemberStatusLabelKey(member.status));
  const roleLabel = t(`spaces.roles.${member.role}`);
  const countInLabel = memberCountInBadgeLabel(member, t);

  const onToggleMeals = useCallback(
    async (enabled: boolean) => {
      setToggling(true);
      try {
        await setMemberMealAccess(spaceId, member.memberId, enabled, member.mealParticipation);
        onRefreshMember?.();
        showToast(enabled ? t('meals.success.mealAccessOn') : t('meals.success.mealAccessOff'));
      } catch {
        showToast(t('meals.errors.mealAccessFailed'));
      } finally {
        setToggling(false);
      }
    },
    [member.mealParticipation, member.memberId, onRefreshMember, showToast, spaceId, t],
  );

  const mealAccessLabel =
    spaceType === 'MESS'
      ? receiving
        ? t('meals.activity.headerMealsOn')
        : t('meals.activity.headerMealsOff')
      : receiving
        ? t('meals.accessStatus.receiving')
        : t('meals.accessStatus.notReceiving');

  const showMealsMeta = showMealAccess && (spaceType === 'MESS' || spaceType != null);

  return (
    <View style={styles.wrap}>
      <Text style={styles.name} numberOfLines={1}>
        {member.fullName}
      </Text>
      <View style={styles.metaRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.metaText} numberOfLines={2}>
          {statusLabel} • {roleLabel} • {countInLabel}
          {showMealsMeta ? (
            <>
              {' • '}
              {canManageMeals && spaceType === 'MESS' ? null : mealAccessLabel}
            </>
          ) : null}
        </Text>
        {showMealsMeta && spaceType === 'MESS' && canManageMeals ? (
          toggling ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Pressable
              style={styles.mealToggle}
              onPress={() => void onToggleMeals(!receiving)}
              hitSlop={8}>
              <Text style={[styles.mealToggleText, receiving && styles.mealToggleOn]}>
                {mealAccessLabel}
              </Text>
              <Switch
                value={receiving}
                onValueChange={value => void onToggleMeals(value)}
                trackColor={{ false: colors.border, true: colors.lightGreen }}
                thumbColor={receiving ? colors.primary : colors.muted}
                style={styles.switch}
              />
            </Pressable>
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  metaText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    flex: 1,
  },
  mealToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  mealToggleText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
  },
  mealToggleOn: {
    color: colors.primaryDark,
  },
  switch: {
    transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }],
  },
});
