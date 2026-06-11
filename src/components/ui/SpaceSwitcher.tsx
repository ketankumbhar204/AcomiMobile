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

  const title =
    currentSpace?.spaceId === spaceId
      ? currentSpace.spaceName
      : mySpaces.find(item => item.spaceId === spaceId)?.spaceName ??
        t('navigation.dashboard');

  const sortedSpaces = useMemo(
    () =>
      [...mySpaces].sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }
        return 0;
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
        <View style={styles.popupRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('spaces.switcher.dismiss')}
          />
          <View style={styles.menu} onStartShouldSetResponder={() => true}>
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
                const isSelected = space.spaceId === currentSpace?.spaceId;

                return (
                  <Pressable
                    key={space.spaceId}
                    onPress={() => handleSelect(space.spaceId)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      index < sortedSpaces.length - 1 && styles.menuItemBorder,
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
                      {space.spaceName}
                    </Text>
                    {isSelected ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : space.isDefault ? (
                      <Text style={styles.defaultHint}>
                        {t('spaces.mySpaces.defaultBadge')}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
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
  popupRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  menu: {
    position: 'absolute',
    top: 96,
    right: spacing.lg,
    minWidth: 220,
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    gap: spacing.md,
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
    color: colors.textPrimary,
    flex: 1,
  },
  menuItemLabelSelected: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
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
