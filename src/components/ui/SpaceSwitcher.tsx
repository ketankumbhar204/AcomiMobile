import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { resetToDashboard } from '../../navigation/navigationRef';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import { formatSpaceDisplayName } from '../../utils/spaceLabels';

type SpaceSwitcherProps = {
  spaceId: string;
};

export function SpaceSwitcher({ spaceId }: SpaceSwitcherProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentSpace = useSpaceStore(state => state.currentSpace);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const loading = useSpaceStore(state => state.loading);
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const loadMySpaces = useSpaceStore(state => state.loadMySpaces);

  const activeSpace = mySpaces.find(
    item => item.spaceId === (currentSpace?.spaceId ?? spaceId),
  );
  const title = activeSpace
    ? formatSpaceDisplayName(activeSpace)
    : currentSpace?.spaceName ?? t('navigation.dashboard');

  const sortedSpaces = useMemo(
    () =>
      [...mySpaces].sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }
        return a.spaceName.localeCompare(b.spaceName);
      }),
    [mySpaces],
  );

  const toggleSwitcher = async () => {
    if (isOpen) {
      console.log('[SpaceSwitcher] close');
      setIsOpen(false);
      return;
    }

    console.log('[SpaceSwitcher] open');
    await loadMySpaces();
    setIsOpen(true);
  };

  const handleSelect = async (selectedSpaceId: string) => {
    console.log('[SpaceSwitcher] select', selectedSpaceId);
    setIsOpen(false);

    if (selectedSpaceId === currentSpace?.spaceId) {
      return;
    }

    const success = await switchSpace(selectedSpaceId);
    if (success) {
      invalidateAccommodationQueries();
      // Always land on Dashboard. Accommodation tab is absent for Mess — navigating
      // there remounts native tabs incorrectly and crashes Fabric (addViewAt).
      resetToDashboard(selectedSpaceId);
    }
  };

  return (
    <>
      <Pressable
        onPress={toggleSwitcher}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('spaces.switcher.open')}
        accessibilityState={{ expanded: isOpen }}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent>
        <Pressable
          style={styles.backdrop}
          onPress={() => setIsOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t('spaces.switcher.dismiss')}>
          <Pressable style={styles.menu} onPress={event => event.stopPropagation()}>
            {sortedSpaces.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {loading
                    ? t('spaces.mySpaces.loading')
                    : t('spaces.mySpaces.emptyTitle')}
                </Text>
              </View>
            ) : (
              sortedSpaces.map((space, index) => {
                const isSelected = space.spaceId === (currentSpace?.spaceId ?? spaceId);

                return (
                  <Pressable
                    key={space.spaceId}
                    onPress={() => handleSelect(space.spaceId)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      index < sortedSpaces.length - 1 && styles.menuItemBorder,
                      isSelected && styles.menuItemSelected,
                      pressed && styles.menuItemPressed,
                    ]}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSelected }}>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        isSelected && styles.menuItemLabelSelected,
                      ]}
                      numberOfLines={1}>
                      {formatSpaceDisplayName(space)}
                    </Text>
                    <View style={styles.menuItemTrailing}>
                      {isSelected ? (
                        <Text style={styles.checkmark}>✓</Text>
                      ) : space.isDefault ? (
                        <Text style={styles.defaultHint}>
                          {t('spaces.mySpaces.defaultBadge')}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 200,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  triggerPressed: {
    opacity: 0.6,
  },
  triggerText: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  chevron: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  menu: {
    position: 'absolute',
    top: 96,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItemSelected: {
    backgroundColor: colors.lightGreen,
  },
  menuItemPressed: {
    backgroundColor: colors.surface,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  menuItemLabelSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  menuItemTrailing: {
    minWidth: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  defaultHint: {
    ...typography.caption,
    color: colors.muted,
  },
  emptyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
});
