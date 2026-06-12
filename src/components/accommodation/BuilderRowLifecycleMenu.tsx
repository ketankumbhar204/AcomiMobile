import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import { accommodationLifecycleApi } from '../../api/accommodationLifecycleApi';
import type {
  AccommodationActionMetadata,
  MembershipRole,
  UUID,
} from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import {
  canCreateOrUpdateAccommodation,
  canDeactivateAccommodation,
} from '../../utils/accommodationPermissions';
import { useAccommodationLifecycleConfirm } from '../../hooks/useAccommodationLifecycleConfirm';
import { useToastStore } from '../../store/toastStore';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';

export type BuilderLifecycleEntityType =
  | 'building'
  | 'floor'
  | 'unit'
  | 'room'
  | 'bed';

type MenuOption = {
  label: string;
  action: () => void;
  destructive?: boolean;
};

type BuilderRowLifecycleMenuProps = {
  spaceId: UUID;
  buildingId: UUID;
  entityType: BuilderLifecycleEntityType;
  entityId: UUID;
  roomId?: UUID;
  role?: MembershipRole;
  onEdit: () => void;
  onDuplicate?: () => void;
  duplicateLabel?: string;
  onSuccess: (
    action: 'deactivate' | 'restore' | 'delete',
    entityType: BuilderLifecycleEntityType,
  ) => void;
};

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
  onSuccess,
}: BuilderRowLifecycleMenuProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const { confirmDeactivate, confirmRestore, confirmDelete } =
    useAccommodationLifecycleConfirm();
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setMenuOptions([]);
  }, []);

  const handleSelect = useCallback(
    (action: () => void) => {
      closeMenu();
      requestAnimationFrame(() => {
        action();
      });
    },
    [closeMenu],
  );

  const showMenu = useCallback(async () => {
    if (!canCreateOrUpdateAccommodation(role) && !canDeactivateAccommodation(role)) {
      return;
    }

    setLoading(true);
    try {
      const actions = await loadEntityActions(
        spaceId,
        entityType,
        entityId,
        roomId,
      );

      if (!actions) {
        return;
      }

      const isOwner = canDeactivateAccommodation(role);
      const canManage = canCreateOrUpdateAccommodation(role);
      const options: MenuOption[] = [];

      if (actions.canEdit && canManage) {
        options.push({
          label: t('accommodation.actions.edit'),
          action: onEdit,
        });
      }

      if (onDuplicate && canManage) {
        options.push({
          label: duplicateLabel ?? t('accommodation.duplicate.confirm'),
          action: onDuplicate,
        });
      }

      if (isOwner && actions.canDeactivate) {
        options.push({
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
        options.push({
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
        options.push({
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

      if (options.length === 0) {
        if (isOwner && !actions.canDelete && actions.deleteReason) {
          showToast(actions.deleteReason);
        }
        return;
      }

      setMenuOptions(options);
      setMenuVisible(true);
    } catch (err) {
      showToast(getAccommodationErrorMessage(err, 'accommodation.errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [
    confirmDeactivate,
    confirmDelete,
    confirmRestore,
    entityId,
    entityType,
    duplicateLabel,
    onDuplicate,
    onEdit,
    onSuccess,
    role,
    roomId,
    showToast,
    spaceId,
    t,
  ]);

  if (!canCreateOrUpdateAccommodation(role) && !canDeactivateAccommodation(role)) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={() => void showMenu()}
        hitSlop={8}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={t('accommodation.lifecycle.menuTitle')}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.muted} />
        ) : (
          <Text style={styles.icon}>⋯</Text>
        )}
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
        statusBarTranslucent>
        <Pressable
          style={styles.backdrop}
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>{t('accommodation.lifecycle.menuTitle')}</Text>
            {menuOptions.map((option, index) => (
              <Pressable
                key={option.label}
                onPress={() => handleSelect(option.action)}
                style={({ pressed }) => [
                  styles.menuItem,
                  index < menuOptions.length - 1 && styles.menuItemBorder,
                  pressed && styles.menuItemPressed,
                ]}
                accessibilityRole="menuitem">
                <Text
                  style={[
                    styles.menuItemLabel,
                    option.destructive && styles.menuItemDestructive,
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={closeMenu}
              style={({ pressed }) => [
                styles.cancelItem,
                pressed && styles.menuItemPressed,
              ]}
              accessibilityRole="button">
              <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.md,
  },
  sheetTitle: {
    ...typography.bodyStrong,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    color: colors.textPrimary,
  },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItemPressed: {
    backgroundColor: colors.surface,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  menuItemDestructive: {
    color: '#DC2626',
  },
  cancelItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
