import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsApi } from '../api/notificationsApi';
import type { SpaceNotification, UUID } from '../api/types';
import { useSpacePermissions } from './useSpacePermissions';
import { filterTenantVisibleNotifications } from '../utils/ownerOnlyNotifications';

export function useSpaceNotifications(spaceId: UUID, enabled: boolean) {
  const permissions = useSpacePermissions(spaceId);
  const canManageMeals = permissions.canManageMeals === true;
  const [notifications, setNotifications] = useState<SpaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await notificationsApi.listNotifications(spaceId, false);
      const visible = canManageMeals
        ? data.notifications
        : filterTenantVisibleNotifications(data.notifications);
      setNotifications(visible);
      setUnreadCount(
        canManageMeals
          ? data.unreadCount
          : visible.filter(n => n.status === 'UNREAD').length,
      );
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [canManageMeals, enabled, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const markRead = useCallback(
    async (notificationId: UUID) => {
      const updated = await notificationsApi.markRead(spaceId, notificationId);
      setNotifications(prev =>
        prev.map(item => (item.notificationId === notificationId ? updated : item)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return updated;
    },
    [spaceId],
  );

  return { notifications, unreadCount, loading, reload, markRead };
}
