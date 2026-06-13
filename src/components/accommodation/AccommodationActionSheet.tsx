import React, { useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccommodationActionSheetStore } from '../../store/accommodationActionSheetStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const BACKDROP_DELAY_MS = 120;

/**
 * Single app-level action sheet for accommodation row/header menus.
 * Renders above FlatList rows and native headers (one Modal, not per list item).
 */
export function AccommodationActionSheet() {
  const { t } = useTranslation();
  const visible = useAccommodationActionSheetStore(state => state.visible);
  const backdropDismissible = useAccommodationActionSheetStore(
    state => state.backdropDismissible,
  );
  const title = useAccommodationActionSheetStore(state => state.title);
  const options = useAccommodationActionSheetStore(state => state.options);
  const close = useAccommodationActionSheetStore(state => state.close);
  const setBackdropDismissible = useAccommodationActionSheetStore(
    state => state.setBackdropDismissible,
  );
  const backdropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      if (backdropTimerRef.current) {
        clearTimeout(backdropTimerRef.current);
        backdropTimerRef.current = null;
      }
      return;
    }

    backdropTimerRef.current = setTimeout(() => {
      setBackdropDismissible(true);
      backdropTimerRef.current = null;
    }, BACKDROP_DELAY_MS);

    return () => {
      if (backdropTimerRef.current) {
        clearTimeout(backdropTimerRef.current);
        backdropTimerRef.current = null;
      }
    };
  }, [setBackdropDismissible, visible]);

  const handleSelect = useCallback(
    (action: () => void) => {
      close();
      requestAnimationFrame(() => {
        action();
      });
    },
    [close],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <Pressable
        style={styles.backdrop}
        onPress={backdropDismissible ? close : undefined}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}>
        <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((option, index) => (
            <Pressable
              key={`${option.label}-${index}`}
              onPress={() => handleSelect(option.action)}
              style={({ pressed }) => [
                styles.menuItem,
                index < options.length - 1 && styles.menuItemBorder,
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
            onPress={close}
            style={({ pressed }) => [styles.cancelItem, pressed && styles.menuItemPressed]}
            accessibilityRole="button">
            <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
