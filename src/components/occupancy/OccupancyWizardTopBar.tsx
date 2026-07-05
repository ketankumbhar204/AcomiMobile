import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon } from '../ui/icons/ChevronLeftIcon';
import { colors, spacing, typography } from '../../theme';

type OccupancyWizardTopBarProps = {
  title: string;
  onBack?: () => void;
  onCancel?: () => void;
  showBack?: boolean;
};

export function OccupancyWizardTopBar({
  title,
  onBack,
  onCancel,
  showBack = true,
}: OccupancyWizardTopBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {showBack && onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}>
            <ChevronLeftIcon size={22} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>
        {onCancel ? (
          <Pressable onPress={onCancel} hitSlop={8} style={styles.cancelWrap}>
            <Text style={styles.close}>{t('common.cancel')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  side: {
    width: 72,
    justifyContent: 'center',
  },
  backButton: {
    minWidth: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  cancelWrap: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xs,
  },
  close: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.5,
  },
});
