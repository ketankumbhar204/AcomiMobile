import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Languages } from 'lucide-react-native';
import {
  changeAppLanguage,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from '../../i18n';
import { colors, radius, shadows, spacing, typography } from '../../theme';

/** Compact header control to switch app language from any space screen. */
export function HeaderLanguageButton() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = (i18n.language?.split('-')[0] ?? 'en') as AppLanguage;
  const value = SUPPORTED_LANGUAGES.includes(current) ? current : 'en';

  const handleSelect = async (language: AppLanguage) => {
    setOpen(false);
    if (language === value) {
      return;
    }
    await changeAppLanguage(language);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('settings.language.select')}>
        <Languages size={18} color={colors.primaryDark} strokeWidth={2.2} />
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
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
  },
  triggerPressed: {
    opacity: 0.85,
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
