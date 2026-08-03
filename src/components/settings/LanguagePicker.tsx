import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Languages } from 'lucide-react-native';
import {
  changeAppLanguage,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from '../../i18n';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type LanguagePickerProps = {
  value: AppLanguage;
};

export function LanguagePicker({ value }: LanguagePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleSelect = async (language: AppLanguage) => {
    setOpen(false);
    if (language === value) {
      return;
    }
    await changeAppLanguage(language);
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('settings.language.title')}
        accessibilityHint={t('settings.language.select')}>
        <View style={styles.triggerIcon}>
          <Languages size={16} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <Text style={styles.triggerValue}>{t(`settings.language.names.${value}`)}</Text>
        <ChevronDown size={16} color={colors.muted} strokeWidth={2.4} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{t('settings.language.select')}</Text>
            {SUPPORTED_LANGUAGES.map(language => {
              const selected = language === value;
              return (
                <Pressable
                  key={language}
                  onPress={() => void handleSelect(language)}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && !selected && styles.optionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {t(`settings.language.names.${language}`)}
                  </Text>
                  {selected ? (
                    <Check size={16} color={colors.primaryDark} strokeWidth={2.6} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  triggerPressed: {
    backgroundColor: colors.surface,
  },
  triggerIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
  },
  triggerValue: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    ...shadows.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
