import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Phone, UtensilsCrossed } from 'lucide-react-native';
import type { MemberDetailsResponse, MembershipRole, SpaceType } from '../../api/types';
import { setMemberMealAccess } from '../../api/mealsApi';
import {
  DashboardRoleChip,
  type DashboardPersonRoleTone,
} from '../dashboard/shared/DashboardPersonCard';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isReceivingMeals } from '../../utils/mealAccess';
import { memberAcomiBadgeLabel } from '../../utils/memberAppStatus';
import { getMemberStatusColor, getMemberStatusLabelKey } from '../../utils/memberStatus';

type MemberCompactHeaderProps = {
  member: MemberDetailsResponse;
  spaceId: string;
  spaceType?: SpaceType;
  showMealAccess?: boolean;
  canManageMeals?: boolean;
  onRefreshMember?: () => void;
};

function roleTone(role: MembershipRole): DashboardPersonRoleTone {
  switch (role) {
    case 'OWNER':
      return 'owner';
    case 'MANAGER':
    case 'CUSTOMER':
      return 'customer';
    case 'TENANT':
      return 'resident';
    default:
      return 'staff';
  }
}

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
  const acomiLabel = memberAcomiBadgeLabel(member, t);
  const initial = member.fullName?.trim()?.charAt(0)?.toUpperCase();

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
      <View style={styles.decorBlob} pointerEvents="none" />

      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial ?? '?'}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={2}>
            {member.fullName}
          </Text>
          <View style={styles.chipRow}>
            <DashboardRoleChip label={roleLabel} tone={roleTone(member.role)} />
            <View style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.factRow}>
        <View style={styles.fact}>
          <Phone size={13} color={colors.muted} strokeWidth={2.2} />
          <Text style={styles.factText} numberOfLines={1}>
            {member.mobileNumber}
          </Text>
        </View>
        <View style={styles.factDivider} />
        <Text style={styles.factText} numberOfLines={1}>
          {acomiLabel}
        </Text>
      </View>

      {showMealsMeta ? (
        <View style={styles.mealRow}>
          <View style={styles.mealIconWrap}>
            <UtensilsCrossed size={16} color={colors.primaryDark} strokeWidth={2.2} />
          </View>
          {canManageMeals && spaceType === 'MESS' ? (
            toggling ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Pressable
                style={styles.mealToggle}
                onPress={() => onToggleMeals(!receiving).catch(() => undefined)}
                hitSlop={8}
                accessibilityRole="switch"
                accessibilityState={{ checked: receiving }}>
                <Text style={[styles.mealToggleText, receiving && styles.mealToggleOn]}>
                  {mealAccessLabel}
                </Text>
                <Switch
                  value={receiving}
                  onValueChange={value => onToggleMeals(value).catch(() => undefined)}
                  trackColor={{ false: colors.border, true: colors.lightGreen }}
                  thumbColor={receiving ? colors.primary : colors.muted}
                  style={styles.switch}
                />
              </Pressable>
            )
          ) : (
            <Text style={styles.mealToggleText}>{mealAccessLabel}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  decorBlob: {
    position: 'absolute',
    top: -48,
    right: -36,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.lightGreen,
    opacity: 0.55,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  name: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    minWidth: 0,
  },
  factDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  factText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  mealIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 48,
  },
  mealToggleText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
    flex: 1,
  },
  mealToggleOn: {
    color: colors.primaryDark,
  },
  switch: {
    transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }],
  },
});
