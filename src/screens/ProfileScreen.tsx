import React, { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Button, Card, HeaderBackButton, Screen } from '../components/ui';
import { useAuthenticatedUser } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';
import {
  changeAppLanguage,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from '../i18n';
import type { MainStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type ProfileNav = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ProfileNav>();
  const user = useAuthenticatedUser();
  const logout = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const currentLanguage = i18n.language as AppLanguage;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.profile'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  const handleLanguageChange = async (language: AppLanguage) => {
    if (language === currentLanguage) {
      return;
    }

    await changeAppLanguage(language);
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.profile.logoutTitle'),
      t('settings.profile.logoutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.profile.logoutConfirm'),
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.eyebrow}>{t('settings.profile.eyebrow')}</Text>
      <Text style={styles.heading}>{t('settings.profile.heading')}</Text>
      <Text style={styles.subheading}>{t('settings.profile.subheading')}</Text>

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName ?? t('common.user')}</Text>
        <Text style={styles.mobile}>
          {user?.mobileNumber ? `+91 ${user.mobileNumber}` : '—'}
        </Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('settings.language.title')}</Text>
        <Text style={styles.sectionBody}>{t('settings.language.description')}</Text>
        <View style={styles.languageList}>
          {SUPPORTED_LANGUAGES.map(language => {
            const isSelected = currentLanguage === language;

            return (
              <Pressable
                key={language}
                onPress={() => handleLanguageChange(language)}
                style={({ pressed }) => [
                  styles.languageOption,
                  isSelected && styles.languageOptionSelected,
                  pressed && !isSelected && styles.languageOptionPressed,
                ]}>
                <Text
                  style={[
                    styles.languageOptionText,
                    isSelected && styles.languageOptionTextSelected,
                  ]}>
                  {t(`settings.language.names.${language}`)}
                </Text>
                {isSelected ? <Text style={styles.languageCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('settings.profile.sessionTitle')}</Text>
        <Text style={styles.sectionBody}>{t('settings.profile.sessionBody')}</Text>
      </Card>

      <Button
        label={t('settings.profile.logout')}
        variant="ghost"
        onPress={handleLogout}
        loading={isLoggingOut}
        disabled={isLoggingOut}
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  name: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  mobile: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  languageList: {
    gap: spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  languageOptionSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  languageOptionPressed: {
    backgroundColor: colors.surface,
  },
  languageOptionText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  languageOptionTextSelected: {
    color: colors.primaryDark,
  },
  languageCheck: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  logoutButton: {
    borderColor: '#FECACA',
    marginTop: spacing.sm,
  },
});
