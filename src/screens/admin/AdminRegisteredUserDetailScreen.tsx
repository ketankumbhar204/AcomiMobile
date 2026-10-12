import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/types';
import { AdminDetailField, AdminDetailSection } from '../../components/admin';
import { PasswordField } from '../../components/auth/PasswordField';
import { Card } from '../../components/ui';
import type { AdminStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  formatAdminDate,
  formatAdminOnboardingStatus,
  formatAdminUserMobile,
  formatAdminUserName,
  formatAdminUserRole,
} from '../../utils/adminLabels';
import { maskIndianMobile } from '../../utils/indianMobile';
import { confirmPasswordError, newPasswordError } from '../../utils/passwordMessages';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminRegisteredUserDetail'>;

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function AdminRegisteredUserDetailScreen({ route }: Props) {
  const { t } = useTranslation();
  const user = route.params.user;
  const displayName = formatAdminUserName(user.fullName);
  const currentUserId = useAuthStore(state => state.user?.id);
  const showToast = useToastStore(state => state.showToast);
  const isSelf = currentUserId != null && currentUserId === user.id;
  const [resetOpen, setResetOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function submitReset() {
    const nextPasswordError = newPasswordError(t, password);
    const nextConfirmError = confirmPasswordError(t, password, confirmPassword);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextPasswordError || nextConfirmError) {
      return;
    }
    Alert.alert(
      t('admin.users.resetPasswordConfirmTitle', { defaultValue: 'Reset this password?' }),
      t('admin.users.resetPasswordConfirmBody', {
        defaultValue:
          'This sets a new password for {{name}} ({{mobile}}). Their current sessions will stop working. The existing password is not shown.',
        name: displayName,
        mobile: maskIndianMobile(user.mobileNumber),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.users.resetPassword', { defaultValue: 'Reset password' }),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSaving(true);
              try {
                await adminApi.resetRegisteredUserPassword(user.id, {
                  password,
                  confirmPassword,
                });
                setPassword('');
                setConfirmPassword('');
                setResetOpen(false);
                showToast(
                  t('admin.users.resetPasswordSuccess', {
                    defaultValue: 'Password updated. The user can sign in with the new password.',
                  }),
                );
              } catch (err) {
                showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <Text style={styles.title} numberOfLines={2}>
          {displayName}
        </Text>
        <Text style={styles.subtitle}>
          {formatAdminUserMobile(user.mobileNumber)} ·{' '}
          {user.mobileVerified ? t('admin.labels.verified') : t('admin.labels.notVerified')}
        </Text>
      </Card>

      <SectionLabel>{t('admin.users.profileSection', { defaultValue: 'Profile' })}</SectionLabel>
      <AdminDetailSection>
        <AdminDetailField
          label={t('admin.users.fullName', { defaultValue: 'Full name' })}
          value={displayName}
        />
        <AdminDetailField
          label={t('admin.common.mobile')}
          value={formatAdminUserMobile(user.mobileNumber)}
        />
        <AdminDetailField
          label={t('admin.users.registeredAt', { defaultValue: 'Registered' })}
          value={formatAdminDate(user.registeredAt)}
        />
      </AdminDetailSection>

      <SectionLabel>
        {t('admin.users.verificationSection', { defaultValue: 'Verification' })}
      </SectionLabel>
      <AdminDetailSection>
        <AdminDetailField
          label={t('admin.labels.verified')}
          value={user.mobileVerified ? t('common.yes') : t('common.no')}
        />
        {user.mobileVerifiedAt ? (
          <AdminDetailField
            label={t('admin.users.verifiedAt', { defaultValue: 'Verified at' })}
            value={new Date(user.mobileVerifiedAt).toLocaleString()}
          />
        ) : null}
        <AdminDetailField
          label={t('admin.users.onboarding', { defaultValue: 'Onboarding' })}
          value={formatAdminOnboardingStatus(user.onboardingStatus)}
        />
        <AdminDetailField
          label={t('admin.users.profileCompleted', { defaultValue: 'Profile completed' })}
          value={user.profileCompleted ? t('common.yes') : t('common.no')}
        />
      </AdminDetailSection>

      <SectionLabel>{t('admin.users.roleSection', { defaultValue: 'Role' })}</SectionLabel>
      <AdminDetailSection>
        <AdminDetailField
          label={t('admin.users.selectedRole', { defaultValue: 'Selected role' })}
          value={formatAdminUserRole(user.selectedRole)}
        />
      </AdminDetailSection>

      <SectionLabel>
        {t('admin.users.spacesSection', { defaultValue: 'Associated spaces' })}
      </SectionLabel>
      <AdminDetailSection>
        {user.spaces.length === 0 ? (
          <Text style={styles.emptySpaces}>
            {t('admin.users.noSpaces', { defaultValue: 'No associated spaces.' })}
          </Text>
        ) : (
          user.spaces.map(space => (
            <View key={space.id} style={styles.spaceRow}>
              <Text style={styles.spaceName} numberOfLines={1}>
                {space.name}
              </Text>
              <Text style={styles.spaceMeta}>
                {space.type} · {space.membershipRole}
              </Text>
            </View>
          ))
        )}
      </AdminDetailSection>

      <SectionLabel>
        {t('admin.users.securitySection', { defaultValue: 'Security' })}
      </SectionLabel>
      <AdminDetailSection>
        <Text style={styles.spaceName}>{displayName}</Text>
        <Text style={styles.spaceMeta}>{maskIndianMobile(user.mobileNumber)}</Text>
        {isSelf ? (
          <Text style={styles.emptySpaces}>
            {t('admin.users.resetPasswordSelf', {
              defaultValue: 'Use account recovery to change your own password.',
            })}
          </Text>
        ) : (
          <>
            <Pressable
              onPress={() => setResetOpen(open => !open)}
              style={styles.resetButton}
              accessibilityRole="button">
              <Text style={styles.resetButtonText}>
                {t('admin.users.resetPassword', { defaultValue: 'Reset password' })}
              </Text>
            </Pressable>
            {resetOpen ? (
              <View style={styles.resetForm}>
                <PasswordField
                  label={t('admin.users.resetPasswordNew', { defaultValue: 'New password' })}
                  value={password}
                  onChangeText={setPassword}
                  error={passwordError}
                  editable={!saving}
                  textContentType="newPassword"
                  autoComplete="password-new"
                />
                <PasswordField
                  label={t('admin.users.resetPasswordConfirm', {
                    defaultValue: 'Confirm password',
                  })}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={confirmError}
                  editable={!saving}
                  textContentType="newPassword"
                  autoComplete="password-new"
                />
                <Pressable
                  onPress={submitReset}
                  disabled={saving}
                  style={[styles.resetSubmit, saving && styles.resetSubmitDisabled]}
                  accessibilityRole="button">
                  <Text style={styles.resetSubmitText}>
                    {saving
                      ? t('common.saving')
                      : t('admin.users.resetPassword', { defaultValue: 'Reset password' })}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </AdminDetailSection>

      <Text style={styles.footnote}>
        {t('admin.users.detailFootnote', {
          defaultValue:
            'Admin user detail shows fields returned by the registered-users API. Email, documents, and KYC are not exposed on this endpoint.',
        })}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.sm },
  headerCard: { marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
  emptySpaces: { ...typography.caption, color: colors.textSecondary },
  spaceRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  spaceName: { ...typography.bodyStrong, color: colors.textPrimary },
  spaceMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  footnote: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
