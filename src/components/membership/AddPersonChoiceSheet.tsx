import React, { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpRight, Plus } from 'lucide-react-native';
import type { AddPersonNoun } from '../../features/membership/addPersonChoice';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type AddPersonChoiceSheetProps = {
  visible: boolean;
  noun: AddPersonNoun;
  importableCount?: number;
  onAddNew: () => void;
  onImportFromAnotherSpace: () => void;
  onClose: () => void;
};

type ChoiceOption = {
  label: string;
  description: string;
  icon: typeof Plus;
  onPress: () => void;
};

/**
 * Compact choice before Add Member / Add Customer.
 * It does not create people or call membership APIs.
 */
export function AddPersonChoiceSheet({
  visible,
  noun,
  importableCount = 0,
  onAddNew,
  onImportFromAnotherSpace,
  onClose,
}: AddPersonChoiceSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const title =
    noun === 'customer'
      ? t('membership.add.choice.titleCustomer')
      : t('membership.add.choice.titleMember');
  const addNewLabel =
    noun === 'customer'
      ? t('membership.add.choice.addNewCustomer')
      : t('membership.add.choice.addNewMember');

  const options: ChoiceOption[] = [
    {
      label: addNewLabel,
      description: t('membership.add.choice.addNewDescription'),
      icon: Plus,
      onPress: onAddNew,
    },
    {
      label: t('membership.add.choice.import'),
      description:
        importableCount > 0
          ? t(
              noun === 'customer'
                ? 'membership.add.choice.importAvailableCustomer'
                : 'membership.add.choice.importAvailable',
              { count: importableCount },
            )
          : t('membership.add.choice.importDescription'),
      icon: ArrowUpRight,
      onPress: onImportFromAnotherSpace,
    },
  ];

  const select = useCallback((action: () => void) => {
    action();
  }, []);

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
          onPress={event => event.stopPropagation()}
          accessibilityRole="summary"
          accessibilityLabel={title}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{t('membership.add.choice.subtitle')}</Text>
          <View style={styles.options}>
            {options.map(option => {
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => select(option.onPress)}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label}. ${option.description}`}>
                  <View style={styles.iconChip}>
                    <Icon size={20} color={colors.primaryDark} strokeWidth={2.2} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}>
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
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    paddingHorizontal: spacing.xl,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  options: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successTint,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  optionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cancel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
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
