import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  changeAppLanguage,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';

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
        accessibilityLabel={t('settings.language.title')}>
        <Text style={styles.triggerValue}>{t(`settings.language.names.${value}`)}</Text>
        <Text style={styles.triggerChevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
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
                  ]}>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {t(`settings.language.names.${language}`)}
                  </Text>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
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
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  triggerPressed: {
    backgroundColor: colors.surface,
  },
  triggerValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  triggerChevron: {
    fontSize: 16,
    color: colors.muted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sheetTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
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
  check: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
