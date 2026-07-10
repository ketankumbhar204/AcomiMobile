import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setMemberMealAccess } from '../../api/mealsApi';
import type {
  MemberMealParticipationSummary,
  MemberOccupancyStatus,
  SpaceType,
  UUID,
} from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  canEnableMealsForMember,
  isReceivingMealsForMember,
} from '../../utils/mealAccess';

type MemberMealAccessBadgeProps = {
  receiving: boolean;
};

export function MemberMealAccessBadge({ receiving }: MemberMealAccessBadgeProps) {
  const { t } = useTranslation();
  const label = receiving
    ? t('meals.accessStatus.receivingShort')
    : t('meals.accessStatus.notReceivingShort');

  return (
    <View style={[styles.badge, receiving ? styles.badgeOn : styles.badgeOff]}>
      <Text style={[styles.badgeText, receiving ? styles.badgeTextOn : styles.badgeTextOff]}>
        {label}
      </Text>
    </View>
  );
}

type MemberListMealAccessProps = {
  spaceId: UUID;
  memberId: UUID;
  participation?: MemberMealParticipationSummary | null;
  canManage: boolean;
  onParticipationChanged: () => void;
  labelKey?: string;
  spaceType?: SpaceType;
  occupancyStatus?: MemberOccupancyStatus | null;
};

function useMemberMealAccessToggle({
  spaceId,
  memberId,
  participation,
  canManage,
  onParticipationChanged,
  spaceType,
  occupancyStatus,
}: MemberListMealAccessProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(false);

  const receiving = isReceivingMealsForMember(participation, { spaceType, occupancyStatus });
  const canEnable = canEnableMealsForMember({ spaceType, occupancyStatus });

  const onToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled && !canEnable) {
        showToast(t('meals.errors.foodRequiresMoveIn'));
        return;
      }
      setLoading(true);
      try {
        await setMemberMealAccess(spaceId, memberId, enabled, participation);
        onParticipationChanged();
        showToast(
          enabled ? t('meals.success.mealAccessOn') : t('meals.success.mealAccessOff'),
        );
      } catch {
        showToast(t('meals.errors.mealAccessFailed'));
      } finally {
        setLoading(false);
      }
    },
    [
      canEnable,
      memberId,
      onParticipationChanged,
      participation,
      showToast,
      spaceId,
      t,
    ],
  );

  return { canManage, canEnable, loading, onToggle, receiving, t };
}

export function MemberListMealAccessToggle({
  labelKey = 'meals.mealAccess.label',
  ...props
}: MemberListMealAccessProps) {
  const { canManage, canEnable, loading, onToggle, receiving, t } =
    useMemberMealAccessToggle(props);

  return (
    <View style={styles.toggleCol}>
      <Text style={styles.toggleLabel} numberOfLines={1}>
        {t(labelKey)}
      </Text>
      {canManage ? (
        loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Switch
            value={receiving}
            disabled={!canEnable && !receiving}
            onValueChange={value => void onToggle(value)}
            accessibilityLabel={t(labelKey)}
          />
        )
      ) : (
        <MemberMealAccessBadge receiving={receiving} />
      )}
    </View>
  );
}

export function MemberListMealAccessSwitch({
  labelKey = 'meals.foodIncluded.label',
  ...props
}: MemberListMealAccessProps) {
  const { canManage, canEnable, loading, onToggle, receiving, t } =
    useMemberMealAccessToggle({ labelKey, ...props });

  if (!canManage) {
    return null;
  }

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="small" />;
  }

  return (
    <Switch
      value={receiving}
      disabled={!canEnable && !receiving}
      onValueChange={value => void onToggle(value)}
      accessibilityLabel={t(labelKey)}
      style={styles.inlineSwitch}
    />
  );
}

const styles = StyleSheet.create({
  toggleCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    minWidth: 72,
  },
  toggleLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },
  inlineSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  badge: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeOn: {
    backgroundColor: colors.lightGreen,
  },
  badgeOff: {
    backgroundColor: colors.surface,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  badgeTextOn: {
    color: colors.primaryDark,
  },
  badgeTextOff: {
    color: colors.muted,
  },
});
