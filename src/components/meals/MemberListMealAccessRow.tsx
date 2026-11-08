import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setMemberMealAccess } from '../../api/mealsApi';
import type {
  MemberMealParticipationSummary,
  MemberOccupancyStatus,
  MemberStatus,
  SpaceType,
  UUID,
} from '../../api/types';
import { useConfirmDialog } from '../ui';
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
  memberStatus?: MemberStatus | string | null;
};

function useMemberMealAccessToggle({
  spaceId,
  memberId,
  participation,
  canManage,
  onParticipationChanged,
  spaceType,
  occupancyStatus,
  memberStatus,
}: MemberListMealAccessProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const { showConfirm } = useConfirmDialog();
  const [loading, setLoading] = useState(false);

  const receiving = isReceivingMealsForMember(participation, { spaceType, occupancyStatus });
  const canEnable = canEnableMealsForMember({ spaceType, occupancyStatus, memberStatus });

  const persistToggle = useCallback(
    async (enabled: boolean) => {
      if (!canEnable || loading) {
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
      loading,
      memberId,
      onParticipationChanged,
      participation,
      showToast,
      spaceId,
      t,
    ],
  );

  const requestToggle = useCallback(
    (enabled: boolean) => {
      if (!canEnable || loading) {
        return;
      }
      showConfirm({
        title: enabled
          ? t('meals.foodIncluded.confirmEnableTitle', {
              defaultValue: 'Enable Food Included?',
            })
          : t('meals.foodIncluded.confirmDisableTitle', {
              defaultValue: 'Disable Food Included?',
            }),
        message: enabled
          ? t('meals.foodIncluded.confirmEnableMessage', {
              defaultValue:
                "Are you sure you want to include food for this tenant? This will update the tenant's food inclusion setting.",
            })
          : t('meals.foodIncluded.confirmDisableMessage', {
              defaultValue:
                "Are you sure you want to exclude food for this tenant? This will update the tenant's food inclusion setting.",
            }),
        confirmLabel: enabled
          ? t('meals.foodIncluded.confirmEnableAction', {
              defaultValue: 'Confirm & Enable',
            })
          : t('meals.foodIncluded.confirmDisableAction', {
              defaultValue: 'Confirm & Disable',
            }),
        cancelLabel: t('common.cancel'),
        destructive: !enabled,
        onConfirm: () => persistToggle(enabled),
      });
    },
    [canEnable, loading, persistToggle, showConfirm, t],
  );

  return { canManage, canEnable, loading, requestToggle, receiving, t };
}

export function MemberListMealAccessToggle({
  labelKey = 'meals.mealAccess.label',
  ...props
}: MemberListMealAccessProps) {
  const { canManage, canEnable, loading, requestToggle, receiving, t } =
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
            disabled={!canEnable}
            onValueChange={value => requestToggle(value)}
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
  const { canManage, canEnable, loading, requestToggle, receiving, t } =
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
      disabled={!canEnable}
      onValueChange={value => requestToggle(value)}
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
