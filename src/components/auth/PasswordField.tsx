import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  autoComplete?: TextInputProps['autoComplete'];
};

export function PasswordField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  focused = false,
  onFocus,
  onBlur,
  editable = true,
  textContentType = 'password',
  returnKeyType = 'done',
  onSubmitEditing,
  autoComplete,
}: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <View style={styles.fieldLabelRow}>
        <Lock size={14} color={colors.primaryDark} strokeWidth={2.2} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          error ? styles.inputWrapError : null,
        ]}>
        <View style={styles.inputSlot} collapsable={false}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            editable={editable}
            textContentType={textContentType}
            autoComplete={autoComplete}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            accessibilityLabel={label}
            underlineColorAndroid="transparent"
          />
        </View>
        <Pressable
          onPress={() => setVisible(current => !current)}
          hitSlop={8}
          style={({ pressed }) => [styles.eyeButton, pressed && styles.eyePressed]}
          accessibilityRole="button"
          accessibilityLabel={visible ? t('auth.password.hide') : t('auth.password.show')}>
          {visible ? (
            <EyeOff size={20} color={colors.primaryDark} strokeWidth={2.2} />
          ) : (
            <Eye size={20} color={colors.primaryDark} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  inputSlot: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  inputWrapFocused: {
    borderColor: colors.primary,
  },
  inputWrapError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  input: {
    width: '100%',
    minHeight: 48,
    paddingVertical: Platform.OS === 'android' ? 0 : spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 2,
    elevation: 2,
  },
  eyePressed: {
    opacity: 0.7,
  },
  fieldError: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
