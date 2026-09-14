import { parsePushData } from '../pushPayload';
import { setPendingPushPayload, consumePendingPushPayload } from '../pendingPush';

describe('parsePushData', () => {
  it('reads FCM data keys without requiring a notification tray payload', () => {
    const parsed = parsePushData(
      {
        type: 'MENU_PUBLISHED',
        spaceId: 'space-1',
        entityId: 'menu-1',
      },
      null,
    );
    expect(parsed.type).toBe('MENU_PUBLISHED');
    expect(parsed.spaceId).toBe('space-1');
    expect(parsed.entityId).toBe('menu-1');
  });
});

describe('pendingPush', () => {
  it('stores and consumes a single pending payload', () => {
    setPendingPushPayload({ type: 'PAYMENT_APPROVED', spaceId: 's1' });
    expect(consumePendingPushPayload()?.type).toBe('PAYMENT_APPROVED');
    expect(consumePendingPushPayload()).toBeNull();
  });
});
