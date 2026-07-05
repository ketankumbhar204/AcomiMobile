import {
  markAccommodationEntityActive,
  markAccommodationEntityInactive,
} from './accommodationEntityActive';
import type { AccommodationInactiveEntityType } from './accommodationInactiveRegistry';
import {
  registerInactiveEntity,
  unregisterInactiveEntity,
} from './accommodationInactiveRegistry';

export function applyAccommodationInactiveLifecycle<T extends { active?: boolean }>(
  action: 'deactivate' | 'restore' | 'delete',
  entityType: AccommodationInactiveEntityType,
  scopeKey: string,
  entityId: string,
  snapshot: T,
  handlers: {
    patch?: (patch: Partial<T>) => void;
    remove?: () => void;
  },
): void {
  if (action === 'deactivate') {
    registerInactiveEntity(
      scopeKey,
      entityType,
      entityId,
      snapshot as unknown as Record<string, unknown>,
    );
    handlers.patch?.(markAccommodationEntityInactive(snapshot));
    return;
  }

  if (action === 'restore') {
    unregisterInactiveEntity(scopeKey, entityId);
    handlers.patch?.(markAccommodationEntityActive(snapshot));
    return;
  }

  if (action === 'delete') {
    unregisterInactiveEntity(scopeKey, entityId);
    handlers.remove?.();
  }
}
