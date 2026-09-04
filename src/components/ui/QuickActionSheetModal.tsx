import React, { useCallback } from 'react';
import { InteractionManager, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type QuickActionSheetOption = {
  label: string;
  /** Optional secondary line under the label. */
  subtitle?: string;
  action: () => void;
  destructive?: boolean;
};

type QuickActionSheetModalProps = {
  visible: boolean;
  title: string;
  options: QuickActionSheetOption[];
  onClose: () => void;
};

export function QuickActionSheetModal({
  visible,
  title,
  options,
  onClose,
}: QuickActionSheetModalProps) {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (action: () => void) => {
      onClose();
      InteractionManager.runAfterInteractions(() => {
        action();
      });
    },
    [onClose],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
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
              {option.subtitle ? (
                <Text style={styles.menuItemSubtitle}>{option.subtitle}</Text>
              ) : null}
            </Pressable>
          ))}
          <Pressable
            onPress={onClose}
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
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
    backgroundColor: colors.surfaceSecondary,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  menuItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
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
    backgroundColor: colors.surfaceSecondary,
  },
  cancelLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
