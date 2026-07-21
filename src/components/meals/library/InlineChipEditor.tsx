import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../../theme';

type InlineChipEditorProps = {
  placeholder: string;
  initialValue?: string;
  onSave: (value: string) => void | Promise<void>;
  onCancel: () => void;
  autoFocus?: boolean;
  maxLength?: number;
  /** full = own row below chips; chip = compact tile inside horizontal scroll */
  layout?: 'full' | 'chip';
  style?: ViewStyle;
};

export function InlineChipEditor({
  placeholder,
  initialValue = '',
  onSave,
  onCancel,
  autoFocus = true,
  maxLength,
  layout = 'full',
  style,
}: InlineChipEditorProps) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const isChipLayout = layout === 'chip';

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed || saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.wrapper,
        isChipLayout ? styles.wrapperChip : styles.wrapperFull,
        style,
      ]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, isChipLayout ? styles.inputChip : styles.inputFull]}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onSubmitEditing={() => void handleSave()}
        returnKeyType="done"
        editable={!saving}
        maxLength={maxLength}
      />
      {saving ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.action} />
      ) : (
        <Pressable
          style={styles.saveAction}
          onPress={() => void handleSave()}
          hitSlop={6}
          accessibilityLabel={t('common.save')}>
          <Text style={styles.saveLabel}>✓</Text>
        </Pressable>
      )}
      <Pressable
        style={styles.cancelAction}
        onPress={onCancel}
        hitSlop={6}
        disabled={saving}
        accessibilityLabel={t('common.cancel')}>
        <Text style={styles.cancelLabel}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  wrapperFull: {
    width: '100%',
    alignSelf: 'stretch',
  },
  wrapperChip: {
    flexShrink: 0,
    minWidth: 200,
    maxWidth: 260,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
    margin: 0,
  },
  inputFull: {
    flex: 1,
    minWidth: 0,
  },
  inputChip: {
    flex: 1,
    minWidth: 100,
  },
  action: {
    flexShrink: 0,
  },
  saveAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  saveLabel: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 18,
  },
  cancelAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: colors.surface,
  },
  cancelLabel: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 24,
    marginTop: -2,
  },
});
