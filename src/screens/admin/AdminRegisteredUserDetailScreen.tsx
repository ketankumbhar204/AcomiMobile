import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Copy, RefreshCw } from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/types';
import { AdminDetailField, AdminDetailSection } from '../../components/admin';
import { PasswordField } from '../../components/auth/PasswordField';
import { Button, Card } from '../../components/ui';
import type { AdminStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  describeAdminAccountActivity,
  formatActivityFact,
  type ActivityFact,
} from '../../utils/adminAccountStatus';
import {
  formatAdminDate,
  formatAdminOnboardingStatus,
  formatAdminUserMobile,
  formatAdminUserName,
  formatAdminUserRole,
} from '../../utils/adminLabels';
import { copyTextToClipboard } from '../../utils/copyTextToClipboard';
import { canCopyPassword, generateStrongPassword } from '../../utils/generatePassword';
import { maskIndianMobile } from '../../utils/indianMobile';
import { confirmPasswordError, newPasswordError } from '../../utils/passwordMessages';
import { colors, spacing, typography } from '../../theme';

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
  const accountActivity = describeAdminAccountActivity(user);
  const activityLabels = {
    never: t('admin.users.activityNever', { defaultValue: 'Never' }),
    unknown: t('admin.users.activityUnknown', { defaultValue: 'Not recorded' }),
    justNow: t('admin.users.activityJustNow', { defaultValue: 'Just now' }),
    minutesAgo: (count: number) =>
      t('admin.users.activityMinutesAgo', { count, defaultValue: '{{count}} min ago' }),
    hoursAgo: (count: number) =>
      t('admin.users.activityHoursAgo', { count, defaultValue: '{{count}} hr ago' }),
    daysAgo: (count: number) =>
      t('admin.users.activityDaysAgo', { count, defaultValue: '{{count}} days ago' }),
  };
  const accountStatusLabel =
    accountActivity.status === 'active'
      ? t('admin.users.accountStatusActive', { defaultValue: 'Active' })
      : accountActivity.status === 'deactivated'
        ? t('admin.users.accountStatusDeactivated', { defaultValue: 'Deactivated' })
        : t('admin.users.accountStatusUnknown', { defaultValue: 'Unknown' });

  function activityText(fact: ActivityFact): string {
    return formatActivityFact(fact, activityLabels);
  }
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatedPending, setGeneratedPending] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [maskEpoch, setMaskEpoch] = useState(0);
  const savingRef = useRef(false);
  const draftRef = useRef({ password: '', confirmPassword: '' });
  draftRef.current = { password, confirmPassword };

  const clearSecrets = useCallback(() => {
    setPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setConfirmError(null);
    setGeneratedPending(false);
    setPasswordTouched(false);
    setConfirmTouched(false);
    setMaskEpoch(epoch => epoch + 1);
    draftRef.current = { password: '', confirmPassword: '' };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearSecrets();
      };
    }, [clearSecrets]),
  );

  function handlePasswordChange(value: string) {
    setPassword(value);
    setGeneratedPending(false);
    if (passwordTouched || passwordError) {
      setPasswordError(newPasswordError(t, value));
    }
    if (confirmTouched || confirmError || confirmPassword.length > 0) {
      setConfirmError(confirmPasswordError(t, value, confirmPassword));
    }
  }

  function handlePasswordBlur() {
    setPasswordTouched(true);
    const draft = draftRef.current;
    setPasswordError(newPasswordError(t, draft.password));
    if (draft.confirmPassword) {
      setConfirmError(confirmPasswordError(t, draft.password, draft.confirmPassword));
    }
  }

  function handleConfirmChange(value: string) {
    setConfirmPassword(value);
    if (confirmTouched || confirmError || value.length > 0) {
      setConfirmError(confirmPasswordError(t, draftRef.current.password, value));
    }
  }

  function handleConfirmBlur() {
    setConfirmTouched(true);
    const draft = draftRef.current;
    setConfirmError(confirmPasswordError(t, draft.password, draft.confirmPassword));
  }

  function handleGenerate() {
    if (savingRef.current) {
      return;
    }
    try {
      const next = generateStrongPassword();
      setPassword(next);
      setConfirmPassword(next);
      setPasswordError(null);
      setConfirmError(null);
      setPasswordTouched(false);
      setConfirmTouched(false);
      setGeneratedPending(true);
      setMaskEpoch(epoch => epoch + 1);
    } catch {
      showToast(
        t('admin.users.generatePasswordFailed', {
          defaultValue: 'Could not generate a password. Enter one manually.',
        }),
      );
    }
  }

  function handleCopy() {
    if (savingRef.current || !canCopyPassword(password)) {
      return;
    }
    try {
      copyTextToClipboard(password);
      showToast(t('admin.users.passwordCopied', { defaultValue: 'Password copied' }));
    } catch {
      showToast(
        t('admin.users.passwordCopyFailed', { defaultValue: 'Could not copy the password.' }),
      );
    }
  }

  function submitReset() {
    if (savingRef.current || isSelf) {
      return;
    }
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
            const draft = draftRef.current;
            const draftPasswordError = newPasswordError(t, draft.password);
            const draftConfirmError = confirmPasswordError(
              t,
              draft.password,
              draft.confirmPassword,
            );
            setPasswordError(draftPasswordError);
            setConfirmError(draftConfirmError);
            if (draftPasswordError || draftConfirmError || savingRef.current) {
              return;
            }
            savingRef.current = true;
            setSaving(true);
            adminApi
              .resetRegisteredUserPassword(user.id, {
                password: draft.password,
                confirmPassword: draft.confirmPassword,
              })
              .then(() => {
                clearSecrets();
                showToast(
                  t('admin.users.resetPasswordSuccess', {
                    defaultValue:
                      'Password updated. The user can sign in with the new password.',
                  }),
                );
              })
              .catch((err: unknown) => {
                showToast(
                  err instanceof ApiError
                    ? err.message
                    : t('admin.users.resetPasswordFailed', {
                        defaultValue: 'Could not reset the password.',
                      }),
                );
              })
              .finally(() => {
                savingRef.current = false;
                setSaving(false);
              });
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

      <SectionLabel>
        {t('admin.users.accountStatusSection', { defaultValue: 'Account status' })}
      </SectionLabel>
      <AdminDetailSection>
        <AdminDetailField
          label={t('admin.users.accountStatus', { defaultValue: 'Status' })}
          value={accountStatusLabel}
        />
        <AdminDetailField
          label={t('admin.users.lastActive', { defaultValue: 'Last active' })}
          value={activityText(accountActivity.lastActive)}
        />
        <AdminDetailField
          label={t('admin.users.lastLogin', { defaultValue: 'Last login' })}
          value={activityText(accountActivity.lastLogin)}
        />
        <Text style={styles.accountHint}>
          {t('admin.users.accountStatusHint', {
            defaultValue:
              'Whether this account can sign in. Separate from mobile verification and onboarding. Last active is recorded use, not a live session.',
          })}
        </Text>
      </AdminDetailSection>

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
      </AdminDetailSection>

      <Card style={styles.resetCard}>
        <Text style={styles.resetTitle}>
          {t('admin.users.resetPasswordTitle', { defaultValue: 'Reset Password' })}
        </Text>
        <Text style={styles.resetHint}>
          {isSelf
            ? t('admin.users.resetPasswordSelf', {
                defaultValue: 'Use account recovery to change your own password.',
              })
            : t('admin.users.resetPasswordHint', {
                defaultValue: 'Generate a temporary password or enter one manually.',
              })}
        </Text>
        {isSelf ? null : (
          <View style={styles.resetForm}>
            <Text style={styles.policy}>
              {t('auth.register.passwordTooShort')} {t('auth.register.passwordTooLong')}
            </Text>
            <PasswordField
              key={`new-${maskEpoch}`}
              label={t('admin.users.resetPasswordNew', { defaultValue: 'New password' })}
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={handlePasswordBlur}
              error={passwordError}
              editable={!saving}
              textContentType="newPassword"
              autoComplete="password-new"
              returnKeyType="next"
            />
            <PasswordField
              key={`confirm-${maskEpoch}`}
              label={t('admin.users.resetPasswordConfirm', {
                defaultValue: 'Confirm password',
              })}
              value={confirmPassword}
              onChangeText={handleConfirmChange}
              onBlur={handleConfirmBlur}
              error={confirmError}
              editable={!saving}
              textContentType="newPassword"
              autoComplete="password-new"
              returnKeyType="done"
            />
            {generatedPending ? (
              <Text style={styles.pending} accessibilityLiveRegion="polite">
                {t('admin.users.generatedNotApplied', {
                  defaultValue: 'This generated password has not been applied yet.',
                })}
              </Text>
            ) : null}
            <View style={styles.secondaryRow}>
              <Button
                label={t('admin.users.generatePassword', { defaultValue: 'Autogenerate' })}
                numberOfLines={1}
                icon={RefreshCw}
                variant="secondary"
                onPress={handleGenerate}
                disabled={saving}
                style={styles.secondaryButton}
              />
              <Button
                label={t('admin.users.copyPassword', { defaultValue: 'Copy' })}
                numberOfLines={1}
                icon={Copy}
                variant="secondary"
                onPress={handleCopy}
                disabled={saving || !canCopyPassword(password)}
                style={styles.secondaryButton}
              />
            </View>
            <Button
              label={
                saving
                  ? t('common.saving')
                  : t('admin.users.resetPassword', { defaultValue: 'Reset password' })
              }
              onPress={submitReset}
              loading={saving}
              disabled={saving}
            />
          </View>
        )}
      </Card>

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
  accountHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
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
  resetCard: { gap: spacing.sm, marginBottom: spacing.sm },
  resetTitle: { ...typography.bodyStrong, color: colors.textPrimary, fontSize: 18 },
  resetHint: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  resetForm: { gap: spacing.md, marginTop: spacing.xs },
  policy: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pending: { ...typography.caption, color: colors.warning, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  secondaryButton: { flexGrow: 1, flexBasis: 0, paddingHorizontal: spacing.md },
  footnote: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
