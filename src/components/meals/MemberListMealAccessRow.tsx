import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setMemberMealAccess } from '../../api/mealsApi';
import type { MemberMealParticipationSummary, UUID } from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isReceivingMeals } from '../../utils/mealAccess';

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

type MemberListMealAccessToggleProps = {
  spaceId: UUID;
  memberId: UUID;
  participation?: MemberMealParticipationSummary | null;
  canManage: boolean;
  onParticipationChanged: () => void;
  labelKey?: string;
};

export function MemberListMealAccessToggle({
  spaceId,
  memberId,
  participation,
  canManage,
  onParticipationChanged,
  labelKey = 'meals.mealAccess.label',
}: MemberListMealAccessToggleProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(false);

  const receiving = isReceivingMeals(participation);

  const onToggle = useCallback(
    async (enabled: boolean) => {
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
    [memberId, onParticipationChanged, participation, showToast, spaceId, t],
  );

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
