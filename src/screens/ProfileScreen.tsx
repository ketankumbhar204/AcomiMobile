import React, { useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import { LanguagePicker } from '../components/settings/LanguagePicker';
import {
  Button,
  Card,
  FormInput,
  HeaderBackButton,
  Screen,
  useConfirmDialog,
} from '../components/ui';
import { useAuthenticatedUser } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';
import type { AppLanguage } from '../i18n';
import type { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { colors, spacing, typography } from '../theme';

type ProfileNav = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ProfileNav>();
  const user = useAuthenticatedUser();
  const updateUser = useAuthStore(state => state.updateUser);
  const logout = useLogout();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currentLanguage = i18n.language as AppLanguage;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.profile'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  const startEditing = () => {
    setFullName(user?.fullName ?? '');
    setNameError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setFullName(user?.fullName ?? '');
    setNameError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameError(t('settings.profile.nameRequired'));
      return;
    }

    if (!user) {
      return;
    }

    setSaving(true);
    try {
      let updated = user;
      try {
        updated = await authApi.updateMe({ fullName: trimmed });
      } catch {
        updated = { ...user, fullName: trimmed };
      }
      await updateUser(updated);
      setEditing(false);
      showToast(t('settings.profile.saveSuccess'));
    } catch {
      showToast(t('common.errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: t('settings.profile.logoutTitle'),
      message: t('settings.profile.logoutMessage'),
      confirmLabel: t('settings.profile.logoutConfirm'),
      destructive: true,
      onConfirm: async () => {
        setIsLoggingOut(true);
        try {
          await logout();
        } finally {
          setIsLoggingOut(false);
        }
      },
    });
  };

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.eyebrow}>{t('settings.profile.eyebrow')}</Text>
      <Text style={styles.heading}>{t('settings.profile.heading')}</Text>
      <Text style={styles.subheading}>{t('settings.profile.subheading')}</Text>

      <Card style={styles.profileCard}>
        {!editing ? (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Pressable onPress={startEditing} style={styles.editButton}>
                <Text style={styles.editButtonText}>{t('settings.profile.edit')}</Text>
              </Pressable>
            </View>
            <Text style={styles.name}>{user?.fullName ?? t('common.user')}</Text>
            <Text style={styles.mobile}>
              {user?.mobileNumber ? `+91 ${user.mobileNumber}` : '—'}
            </Text>
          </>
        ) : (
          <>
            <FormInput
              label={t('settings.profile.fullNameLabel')}
              placeholder={t('membership.add.fullNamePlaceholder')}
              value={fullName}
              onChangeText={value => {
                setFullName(value);
                if (nameError) {
                  setNameError(null);
                }
              }}
              error={nameError}
              autoCapitalize="words"
            />
            <FormInput
              label={t('settings.profile.mobileLabel')}
              value={user?.mobileNumber ? `+91 ${user.mobileNumber}` : '—'}
              editable={false}
              hint={t('settings.profile.mobileHint')}
            />
            <View style={styles.editActions}>
              <Button
                label={t('settings.profile.save')}
                onPress={() => void handleSave()}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
              />
              <Button
                label={t('settings.profile.cancel')}
                variant="ghost"
                onPress={cancelEditing}
                disabled={saving}
              />
            </View>
          </>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('settings.language.title')}</Text>
        <Text style={styles.sectionBody}>{t('settings.language.description')}</Text>
        <LanguagePicker value={currentLanguage} />
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
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  editButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  editButtonText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  name: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  mobile: {
    ...typography.body,
    color: colors.textSecondary,
  },
  editActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.xs,
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
  logoutButton: {
    borderColor: '#FECACA',
    marginTop: spacing.sm,
  },
});
