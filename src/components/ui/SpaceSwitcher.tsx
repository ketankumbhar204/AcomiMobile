import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, MapPin, Star } from 'lucide-react-native';
import { resetToDashboard } from '../../navigation/navigationRef';
import { spaceHeaderLines } from '../../navigation/spaceHeaderNav';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import { formatSpaceDisplayName } from '../../utils/spaceLabels';
import { devLog } from '../../utils/devLog';

type SpaceSwitcherProps = {
  spaceId: string;
};

export function SpaceSwitcher({ spaceId }: SpaceSwitcherProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const currentSpace = useSpaceStore(state => state.currentSpace);
  const selectedSpace = useSpaceStore(state => state.selectedSpace);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const loading = useSpaceStore(state => state.loading);
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const loadMySpaces = useSpaceStore(state => state.loadMySpaces);

  const activeId = currentSpace?.spaceId ?? spaceId;
  const activeSpace = mySpaces.find(item => item.spaceId === activeId);
  const address =
    activeSpace?.address ??
    (selectedSpace?.id === activeId ? selectedSpace.address : null);
  const { title, location } = spaceHeaderLines(
    activeSpace?.spaceName ?? currentSpace?.spaceName ?? t('navigation.dashboard'),
    address,
  );

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

  const canSwitch = mySpaces.length > 1;
  const listMaxHeight = Math.max(160, windowHeight - 96 - insets.bottom - spacing.lg);

  const toggleSwitcher = async () => {
    if (isOpen) {
      devLog('[SpaceSwitcher] close');
      setIsOpen(false);
      return;
    }

    if (!canSwitch) {
      return;
    }

    devLog('[SpaceSwitcher] open');
    await loadMySpaces();
    if (useSpaceStore.getState().mySpaces.length <= 1) {
      return;
    }
    setIsOpen(true);
  };

  const handleSelect = async (selectedSpaceId: string) => {
    devLog('[SpaceSwitcher] select', selectedSpaceId);
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
        onPress={canSwitch ? toggleSwitcher : undefined}
        disabled={!canSwitch}
        style={({ pressed }) => [
          styles.trigger,
          canSwitch && pressed && styles.triggerPressed,
        ]}
        hitSlop={8}
        accessibilityRole={canSwitch ? 'button' : 'text'}
        accessibilityLabel={canSwitch ? t('spaces.switcher.open') : title}
        accessibilityState={canSwitch ? { expanded: isOpen } : undefined}>
        <View style={styles.titleRow}>
          <Text style={styles.triggerText} numberOfLines={1}>
            {title}
          </Text>
          {canSwitch ? (
            <ChevronDown
              size={16}
              color={colors.textSecondary}
              strokeWidth={2.4}
            />
          ) : null}
        </View>
        {location ? (
          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.teal} strokeWidth={2.2} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent>
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('spaces.switcher.dismiss')}
          />
          <View style={styles.menu}>
            {sortedSpaces.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {loading
                    ? t('spaces.mySpaces.loading')
                    : t('spaces.mySpaces.emptyTitle')}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: listMaxHeight }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator>
                <View style={styles.menuHintRow}>
                  <Text style={styles.menuHint}>
                    {t('spaces.switcher.defaultHint', {
                      defaultValue:
                        'Tap a space to open it. Your default space opens first on launch — change it from Home.',
                    })}
                  </Text>
                </View>
                {sortedSpaces.map((space, index) => {
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
                    <View style={styles.menuItemBody}>
                      <Text
                        style={[
                          styles.menuItemLabel,
                          isSelected && styles.menuItemLabelSelected,
                        ]}
                        numberOfLines={1}>
                        {formatSpaceDisplayName(space)}
                      </Text>
                      {space.isDefault ? (
                        <View style={styles.defaultRow}>
                          <Star
                            size={12}
                            color={colors.primaryDark}
                            strokeWidth={2.2}
                            fill={colors.primaryDark}
                          />
                          <Text style={styles.defaultHint}>
                            {t('spaces.mySpaces.defaultBadge')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.menuItemTrailing}>
                      {isSelected ? (
                        <Check size={16} color={colors.primaryDark} strokeWidth={2.4} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: '100%',
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
    paddingRight: spacing.xs,
  },
  triggerPressed: {
    opacity: 0.6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    minWidth: 0,
    gap: spacing.xxs,
  },
  triggerText: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    width: '100%',
    minWidth: 0,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 0,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
  },
  menu: {
    position: 'absolute',
    zIndex: 1,
    top: 96,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.raised,
  },
  menuHintRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  menuHint: {
    ...typography.caption,
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceSecondary,
  },
  menuItemBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.textPrimary,
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
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  defaultHint: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
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
