import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

type ListSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function ListSearchBar({ value, onChangeText, placeholder }: ListSearchBarProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const label = placeholder ?? t('list.search.placeholder');

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
          placeholder={label}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel={label}
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
    marginBottom: spacing.sm,
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
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  clearPressed: {
    backgroundColor: colors.border,
  },
});
