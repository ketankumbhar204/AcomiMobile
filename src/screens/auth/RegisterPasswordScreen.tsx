import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { TriangleAlert, UserRound } from 'lucide-react-native';
import { AuthHero, PasswordField } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { HeaderBackButton } from '../../components/ui';
import { useRegister } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import {
  isRegistrationTokenValid,
  useRegistrationDraftStore,
} from '../../store/registrationDraftStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { confirmPasswordError, newPasswordError } from '../../utils/passwordMessages';

type PasswordNav = NativeStackNavigationProp<AuthStackParamList, 'RegisterPassword'>;
type PasswordRoute = NativeStackScreenProps<AuthStackParamList, 'RegisterPassword'>['route'];

export function RegisterPasswordScreen() {
  const { t, i18n: i18nInstance } = useTranslation();
  const navigation = useNavigation<PasswordNav>();
  const route = useRoute<PasswordRoute>();
  const { mobileNumber } = route.params;
  const { submit, isLoading, error, clearError } = useRegister();
  const verificationToken = useRegistrationDraftStore(state => state.verificationToken);
  const verificationTokenExpiresAt = useRegistrationDraftStore(
    state => state.verificationTokenExpiresAt,
  );

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const headerLeft = useCallback(() => <HeaderBackButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.createPassword'),
      headerLeft,
      headerBackVisible: false,
    });
  }, [headerLeft, navigation, t, i18nInstance.language]);

  useFocusEffect(
    useCallback(() => {
      if (!isRegistrationTokenValid(verificationToken, verificationTokenExpiresAt)) {
        setTokenError(t('common.errors.registrationTokenExpired'));
      } else {
        setTokenError(null);
      }
    }, [t, verificationToken, verificationTokenExpiresAt]),
  );

  async function handleCreateAccount() {
    Keyboard.dismiss();
    clearError();

    if (!isRegistrationTokenValid(verificationToken, verificationTokenExpiresAt)) {
      setTokenError(t('common.errors.registrationTokenExpired'));
      return;
    }

    const nextNameError = fullName.trim() ? null : t('auth.register.nameRequired');
    const nextPasswordError = newPasswordError(t, password);
    const nextConfirmError = confirmPasswordError(t, password, confirmPassword);

    setNameError(nextNameError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextNameError || nextPasswordError || nextConfirmError) {
      return;
    }

    await submit({
      fullName: fullName.trim(),
      mobileNumber,
      password,
      confirmPassword,
      verificationToken: verificationToken as string,
    });
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <AuthHero
          icon={UserRound}
          eyebrow={t('auth.register.verifiedEyebrow')}
          heading={t('auth.register.passwordHeading')}
          subheading={t('auth.register.passwordSubheading')}
        />

        {error || tokenError ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{error ?? tokenError}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.verifiedMobile}>
            {t('auth.register.mobileVerified')}: +91 {mobileNumber}
          </Text>

          <View style={styles.fieldLabelRow}>
            <UserRound size={14} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>{t('auth.register.nameLabel')}</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              focusedField === 'name' && styles.inputFocused,
              nameError ? styles.inputError : null,
            ]}
            placeholder={t('auth.register.namePlaceholder')}
            placeholderTextColor={colors.muted}
            value={fullName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            onChangeText={text => {
              setFullName(text);
              if (nameError) {
                setNameError(null);
              }
              if (error) {
                clearError();
              }
            }}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel={t('auth.register.nameLabel')}
          />
          {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}

          <PasswordField
            label={t('auth.register.passwordLabel')}
            placeholder={t('auth.register.passwordPlaceholder')}
            value={password}
            focused={focusedField === 'password'}
            error={passwordError}
            onFocus={() => setFocusedField('password')}
            onBlur={() => {
              setFocusedField(null);
              setPasswordError(newPasswordError(t, password));
              if (confirmPassword) {
                setConfirmError(confirmPasswordError(t, password, confirmPassword));
              }
            }}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) {
                setPasswordError(newPasswordError(t, text));
              }
              if (confirmPassword) {
                setConfirmError(confirmPasswordError(t, text, confirmPassword));
              }
              if (error) {
                clearError();
              }
            }}
            textContentType="newPassword"
            returnKeyType="next"
          />

          <PasswordField
            label={t('auth.register.confirmPasswordLabel')}
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            value={confirmPassword}
            focused={focusedField === 'confirm'}
            error={confirmError}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => {
              setFocusedField(null);
              setConfirmError(confirmPasswordError(t, password, confirmPassword));
            }}
            onChangeText={text => {
              setConfirmPassword(text);
              if (confirmError || text.length > 0) {
                setConfirmError(confirmPasswordError(t, password, text));
              }
              if (error) {
                clearError();
              }
            }}
            textContentType="newPassword"
            onSubmitEditing={() => {
              void handleCreateAccount();
            }}
          />
        </View>
      </ScrollView>

      <StickyFormActions
        primary={{
          label: t('auth.register.submit'),
          onPress: () => {
            handleCreateAccount();
          },
          loading: isLoading,
          disabled: isLoading,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    flex: 1,
    color: '#DC2626',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  verifiedMobile: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    minHeight: 48,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'android' ? 0 : spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    ...typography.caption,
    color: '#DC2626',
  },
});
