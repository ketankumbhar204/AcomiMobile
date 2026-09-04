import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MainStackParamList } from '../../navigation/types';
import type { UUID } from '../../api/types';
import { useSpaceNotifications } from '../../hooks/useSpaceNotifications';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { colors, typography } from '../../theme';
import { currentMonthKey } from '../../utils/dashboardFinancial';
import { canManageNotifications } from '../../utils/spaceOperator';
import {
  peekDashboardSummary,
  subscribeDashboardCacheUpdate,
  subscribeDashboardInvalidation,
} from '../../utils/dashboardQueryCache';
import { peekPendingActions } from '../../utils/pendingActionsQueryCache';

type NotificationBellButtonProps = {
  spaceId: UUID;
};

function readOperatorBadgeCount(spaceId: UUID): number {
  const month = currentMonthKey();
  return (
    peekPendingActions(spaceId, month)?.totalCount ??
    peekDashboardSummary(spaceId, month)?.pendingActions?.totalCount ??
    0
  );
}

/**
 * Operators: badge from dashboard-summary pendingActions (no extra pending-actions HTTP).
 * Tenants: unread inbox count via notifications list (lightweight; no sync).
 */
export function NotificationBellButton({ spaceId }: NotificationBellButtonProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const permissions = useSpacePermissions(spaceId);
  const isOperator = canManageNotifications(permissions);

  const [operatorCount, setOperatorCount] = useState(() =>
    isOperator ? readOperatorBadgeCount(spaceId) : 0,
  );
  const { unreadCount } = useSpaceNotifications(spaceId, !isOperator);

  useFocusEffect(
    useCallback(() => {
      if (!isOperator) {
        return undefined;
      }
      const sync = () => setOperatorCount(readOperatorBadgeCount(spaceId));
      sync();
      // Cache writes update the badge; invalidation alone must not force dashboard refetch.
      const unsubCache = subscribeDashboardCacheUpdate(sync);
      const unsubInvalidation = subscribeDashboardInvalidation(sync);
      return () => {
        unsubCache();
        unsubInvalidation();
      };
    }, [isOperator, spaceId]),
  );

  const badgeCount = isOperator ? operatorCount : unreadCount;

  return (
    <Pressable
      onPress={() => navigation.navigate('SpaceNotifications', { spaceId })}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('notifications.title')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.icon}>🔔</Text>
      {badgeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : String(badgeCount)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
