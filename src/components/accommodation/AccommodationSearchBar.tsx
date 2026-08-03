import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

type AccommodationSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function AccommodationSearchBar({
  value,
  onChangeText,
  placeholder,
}: AccommodationSearchBarProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.searchWrap, focused && styles.searchWrapFocused]}>
        <Search
          size={16}
          color={focused ? colors.primaryDark : colors.muted}
          strokeWidth={2.2}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? t('accommodation.search.placeholder')}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={placeholder ?? t('accommodation.search.placeholder')}
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={12}
            style={({ pressed }) => [styles.clearButton, pressed && styles.clearPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.clear', { defaultValue: 'Clear' })}>
            <X size={12} color={colors.muted} strokeWidth={2.6} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  searchWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchWrapFocused: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  clearPressed: {
    backgroundColor: colors.border,
  },
});
