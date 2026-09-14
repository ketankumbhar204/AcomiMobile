export type PushNotificationPayload = {
  type?: string;
  notificationId?: string;
  spaceId?: string;
  entityId?: string;
  entityType?: string;
  actionRoute?: string;
  spaceName?: string;
  title?: string;
  body?: string;
};

export function parsePushData(
  data: Record<string, string> | undefined,
  notification?: { title?: string | null; body?: string | null } | null,
): PushNotificationPayload {
  return {
    type: data?.type,
    notificationId: data?.notificationId,
    spaceId: data?.spaceId,
    entityId: data?.entityId,
    entityType: data?.entityType,
    actionRoute: data?.actionRoute,
    spaceName: data?.spaceName,
    title: notification?.title ?? undefined,
    body: notification?.body ?? undefined,
  };
}
