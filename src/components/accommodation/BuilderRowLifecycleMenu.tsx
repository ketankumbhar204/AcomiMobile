import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import { accommodationLifecycleApi } from '../../api/accommodationLifecycleApi';
import type {
  AccommodationActionMetadata,
  MembershipRole,
  UUID,
} from '../../api/types';
import { colors } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import {
  canCreateOrUpdateAccommodation,
  canDeactivateAccommodation,
} from '../../utils/accommodationPermissions';
import { useAccommodationLifecycleConfirm } from '../../hooks/useAccommodationLifecycleConfirm';
import { useAccommodationActionSheetStore } from '../../store/accommodationActionSheetStore';
import { useToastStore } from '../../store/toastStore';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';

export type BuilderLifecycleEntityType =
  | 'building'
  | 'floor'
  | 'unit'
  | 'room'
  | 'bed';

export type MenuOption = {
  label: string;
  action: () => void;
  destructive?: boolean;
};

export type BuilderRowLifecycleMenuProps = {
  spaceId: UUID;
  buildingId: UUID;
  entityType: BuilderLifecycleEntityType;
  entityId: UUID;
  roomId?: UUID;
  role?: MembershipRole;
  onEdit: () => void;
  onDuplicate?: () => void;
  duplicateLabel?: string;
  prependOptions?: MenuOption[];
  sheetTitle?: string;
  forceShowTrigger?: boolean;
  onSuccess: (
    action: 'deactivate' | 'restore' | 'delete',
    entityType: BuilderLifecycleEntityType,
  ) => void;
};

const MENU_OPEN_DELAY_MS = 50;

async function loadEntityActions(
  spaceId: UUID,
  entityType: BuilderLifecycleEntityType,
  entityId: UUID,
  roomId?: UUID,
): Promise<AccommodationActionMetadata | undefined> {
  switch (entityType) {
    case 'building': {
      const building = await accommodationApi.getBuilding(spaceId, entityId);
      return building.actions;
    }
    case 'floor': {
      const floor = await accommodationApi.getFloorById(spaceId, entityId);
      return floor.actions;
    }
    case 'unit': {
      const unit = await accommodationApi.getUnitById(spaceId, entityId);
      return unit.actions;
    }
    case 'room': {
      const room = await accommodationApi.getRoom(spaceId, entityId);
      return room.actions;
    }
    case 'bed': {
      const bed = roomId
        ? await accommodationApi.getBed(spaceId, roomId, entityId)
        : await accommodationApi.getBedById(spaceId, entityId);
      return bed.actions;
    }
    default:
      return undefined;
  }
}

async function runLifecycleAction(
  spaceId: UUID,
  entityType: BuilderLifecycleEntityType,
  entityId: UUID,
  action: 'deactivate' | 'restore' | 'delete',
): Promise<void> {
  const api = accommodationLifecycleApi;
  const runners = {
    building: {
      deactivate: () => api.deactivateBuilding(spaceId, entityId),
      restore: () => api.restoreBuilding(spaceId, entityId),
      delete: () => api.deleteBuilding(spaceId, entityId),
    },
    floor: {
      deactivate: () => api.deactivateFloor(spaceId, entityId),
      restore: () => api.restoreFloor(spaceId, entityId),
      delete: () => api.deleteFloor(spaceId, entityId),
    },
    unit: {
      deactivate: () => api.deactivateUnit(spaceId, entityId),
      restore: () => api.restoreUnit(spaceId, entityId),
      delete: () => api.deleteUnit(spaceId, entityId),
    },
    room: {
      deactivate: () => api.deactivateRoom(spaceId, entityId),
      restore: () => api.restoreRoom(spaceId, entityId),
      delete: () => api.deleteRoom(spaceId, entityId),
    },
    bed: {
      deactivate: () => api.deactivateBed(spaceId, entityId),
      restore: () => api.restoreBed(spaceId, entityId),
      delete: () => api.deleteBed(spaceId, entityId),
    },
  } as const;

  await runners[entityType][action]();
  invalidateAccommodationQueries();
}

export function BuilderRowLifecycleMenu({
  spaceId,
  buildingId,
  entityType,
  entityId,
  roomId,
  role,
  onEdit,
  onDuplicate,
  duplicateLabel,
  prependOptions = [],
  sheetTitle,
  forceShowTrigger = false,
  onSuccess,
}: BuilderRowLifecycleMenuProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const closeActionSheet = useAccommodationActionSheetStore(state => state.close);
  const { confirmDeactivate, confirmRestore, confirmDelete } =
    useAccommodationLifecycleConfirm();

  const resolvedTitle = sheetTitle ?? t('accommodation.lifecycle.menuTitle');

  const buildLifecycleOptions = useCallback(
    (actions: AccommodationActionMetadata): MenuOption[] => {
      const lifecycleOptions: MenuOption[] = [];
      const isOwner = canDeactivateAccommodation(role);
      const canManage = canCreateOrUpdateAccommodation(role);

      if (actions.canEdit && canManage) {
        lifecycleOptions.push({
          label: t('accommodation.actions.edit'),
          action: onEdit,
        });
      }

      if (onDuplicate && canManage) {
        lifecycleOptions.push({
          label: duplicateLabel ?? t('accommodation.duplicate.confirm'),
          action: onDuplicate,
        });
      }

      if (isOwner && actions.canDeactivate) {
        lifecycleOptions.push({
          label: t('accommodation.lifecycle.deactivateConfirm'),
          destructive: true,
          action: () =>
            confirmDeactivate(
              () => runLifecycleAction(spaceId, entityType, entityId, 'deactivate'),
              () => {
                showToast(t('accommodation.lifecycle.deactivateSuccess'));
                onSuccess('deactivate', entityType);
              },
            ),
        });
      }

      if (isOwner && actions.canRestore) {
        lifecycleOptions.push({
          label: t('accommodation.lifecycle.restoreConfirm'),
          action: () =>
            confirmRestore(
              () => runLifecycleAction(spaceId, entityType, entityId, 'restore'),
              () => {
                showToast(t('accommodation.lifecycle.restoreSuccess'));
                onSuccess('restore', entityType);
              },
            ),
        });
      }

      if (isOwner && actions.canDelete) {
        lifecycleOptions.push({
          label: t('accommodation.lifecycle.deleteConfirm'),
          destructive: true,
          action: () =>
            confirmDelete(
              entityType,
              () => runLifecycleAction(spaceId, entityType, entityId, 'delete'),
              () => {
                showToast(t('accommodation.lifecycle.deleteSuccess'));
                onSuccess('delete', entityType);
              },
            ),
        });
      }

      return lifecycleOptions;
    },
    [
      confirmDeactivate,
      confirmDelete,
      confirmRestore,
      duplicateLabel,
      entityId,
      entityType,
      onDuplicate,
      onEdit,
      onSuccess,
      role,
      showToast,
      spaceId,
      t,
    ],
  );

  const presentActionSheet = useCallback(
    (options: MenuOption[]) => {
      if (options.length === 0) {
        return false;
      }

      // Defer so the opening tap does not dismiss the sheet immediately.
      setTimeout(() => {
        const { visible, open, setOptions } = useAccommodationActionSheetStore.getState();
        if (visible) {
          setOptions(options);
        } else {
          open(resolvedTitle, options);
        }
      }, MENU_OPEN_DELAY_MS);
      return true;
    },
    [resolvedTitle],
  );

  const showMenu = useCallback(async () => {
    const canManageLifecycle =
      canCreateOrUpdateAccommodation(role) || canDeactivateAccommodation(role);

    if (!canManageLifecycle && prependOptions.length === 0) {
      return;
    }

    if (prependOptions.length > 0) {
      presentActionSheet(prependOptions);
    }

    if (!canManageLifecycle) {
      return;
    }

    try {
      const actions = await loadEntityActions(
        spaceId,
        entityType,
        entityId,
        roomId,
      );

      const lifecycleOptions = actions ? buildLifecycleOptions(actions) : [];
      const isOwner = canDeactivateAccommodation(role);
      const mergedOptions = [...prependOptions, ...lifecycleOptions];

      if (
        mergedOptions.length === 0 &&
        isOwner &&
        actions &&
        !actions.canDelete &&
        actions.deleteReason
      ) {
        closeActionSheet();
        showToast(actions.deleteReason);
        return;
      }

      presentActionSheet(mergedOptions);
    } catch (err) {
      if (prependOptions.length === 0) {
        showToast(getAccommodationErrorMessage(err, 'accommodation.errors.generic'));
      }
    }
  }, [
    buildLifecycleOptions,
    closeActionSheet,
    entityId,
    entityType,
    prependOptions,
    presentActionSheet,
    role,
    roomId,
    showToast,
    spaceId,
  ]);

  const canShowTrigger =
    forceShowTrigger ||
    canCreateOrUpdateAccommodation(role) ||
    canDeactivateAccommodation(role) ||
    prependOptions.length > 0;

  if (!canShowTrigger) {
    return null;
  }

  return (
    <Pressable
      onPress={() => void showMenu()}
      hitSlop={8}
      style={styles.trigger}
      accessibilityRole="button"
      accessibilityLabel={t('accommodation.lifecycle.menuTitle')}>
      <Text style={styles.icon}>⋯</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    lineHeight: 22,
    color: colors.muted,
    fontWeight: '700',
  },
});
