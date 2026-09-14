import React, { useCallback, type ComponentType } from 'react';
import {
  InteractionManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export type QuickActionSheetOption = {
  label: string;
  /** Optional secondary line under the label. */
  subtitle?: string;
  action: () => void;
  destructive?: boolean;
  /** Optional leading Lucide icon. */
  icon?: ComponentType<IconProps>;
  /** Icon tint; defaults to primary / destructive red. */
  iconColor?: string;
  /** Soft icon chip background. */
  iconBackground?: string;
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
  const insets = useSafeAreaInsets();

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
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
          onPress={event => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <View style={styles.optionsBlock}>
            {options.map((option, index) => {
              const Icon = option.icon;
              const iconColor = option.iconColor
                ? option.iconColor
                : option.destructive
                  ? '#DC2626'
                  : colors.primaryDark;
              const iconBg = option.iconBackground
                ? option.iconBackground
                : option.destructive
                  ? '#FEE2E2'
                  : colors.successTint;

              return (
                <Pressable
                  key={`${option.label}-${index}`}
                  onPress={() => handleSelect(option.action)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    index < options.length - 1 && styles.menuItemBorder,
                    pressed && styles.menuItemPressed,
                  ]}
                  accessibilityRole="menuitem">
                  {Icon ? (
                    <View style={[styles.iconChip, { backgroundColor: iconBg }]}>
                      <Icon size={20} color={iconColor} strokeWidth={2.2} />
                    </View>
                  ) : null}
                  <View style={styles.menuTextBlock}>
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
                  </View>
                </Pressable>
              );
            })}
          </View>
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingTop: spacing.sm,
    ...shadows.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    color: colors.textPrimary,
  },
  optionsBlock: {
    paddingHorizontal: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
    borderRadius: radius.card,
    backgroundColor: colors.white,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderRadius: 0,
  },
  menuItemPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBlock: {
    flex: 1,
    gap: 2,
  },
  menuItemLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  menuItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  menuItemDestructive: {
    color: '#DC2626',
  },
  cancelItem: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.surfaceSecondary,
  },
  cancelLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
  },
});
