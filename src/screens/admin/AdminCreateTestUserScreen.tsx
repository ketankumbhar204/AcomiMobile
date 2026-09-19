import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import type { AdminActiveSpace, MembershipRole, SpaceType } from '../../api/types';
import { ApiError } from '../../api/types';
import {
  AdminFormHero,
  AdminFormSection,
  adminErrorBanner,
} from '../../components/admin';
import { PasswordField } from '../../components/auth/PasswordField';
import { FormInput, SpaceTypePicker } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { isValidIndianMobile } from '../../utils/indianMobile';
import { confirmPasswordError, newPasswordError } from '../../utils/passwordMessages';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminCreateTestUser'>;

const SPACE_ROLES: MembershipRole[] = ['OWNER', 'MANAGER', 'TENANT', 'CUSTOMER', 'STAFF'];
const SPACE_TYPES: SpaceType[] = ['PG', 'MESS', 'HOSTEL', 'CO_LIVING', 'RENTAL'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message.trim()) {
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

export function AdminCreateTestUserScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const showToast = useToastStore(state => state.showToast);

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [spaceRole, setSpaceRole] = useState<MembershipRole | null>(null);
  const [spaceType, setSpaceType] = useState<SpaceType | null>('PG');
  const [spaceName, setSpaceName] = useState('');
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<AdminActiveSpace[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [spacePickerOpen, setSpacePickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedSpace = useMemo(
    () => spaces.find(space => space.id === spaceId) ?? null,
    [spaces, spaceId],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadSpaces() {
      setLoadingSpaces(true);
      try {
        const active = await adminApi.listActiveSpaces();
        if (!cancelled) setSpaces(active);
      } catch (err) {
        if (!cancelled) {
          setSpaces([]);
          setError(errorMessage(err, t('admin.users.createTestUserFailed')));
        }
      } finally {
        if (!cancelled) setLoadingSpaces(false);
      }
    }
    void loadSpaces();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) {
      next.fullName = t('admin.users.createTestUserErrors.fullName');
    }
    if (!isValidIndianMobile(mobileNumber)) {
      next.mobileNumber = t('admin.users.createTestUserErrors.mobile');
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
      next.email = t('admin.users.createTestUserErrors.email');
    }
    const passwordErr = newPasswordError(t, password);
    if (passwordErr) next.password = passwordErr;
    const confirmErr = confirmPasswordError(t, password, confirmPassword);
    if (confirmErr) next.confirmPassword = confirmErr;
    if (!spaceRole) {
      next.spaceRole = t('admin.users.createTestUserErrors.spaceRole');
    } else if (spaceRole === 'OWNER') {
      if (!spaceType) next.spaceType = t('admin.users.createTestUserErrors.spaceType');
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }, [
    confirmPassword,
    email,
    fullName,
    mobileNumber,
    password,
    spaceRole,
    spaceType,
    t,
  ]);

  async function handleSubmit() {
    Keyboard.dismiss();
    setError(null);
    if (!validate() || !spaceRole) return;

    setLoading(true);
    try {
      const isOwner = spaceRole === 'OWNER';
      await adminApi.createRegisteredUser({
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim() || undefined,
        password,
        confirmPassword,
        spaceRole,
        spaceId: isOwner ? undefined : spaceId ?? undefined,
        spaceName: isOwner && spaceName.trim() ? spaceName.trim() : undefined,
        spaceType: isOwner ? spaceType ?? undefined : undefined,
      });
      showToast(t('admin.users.createTestUserSuccess'));
      navigation.goBack();
    } catch (err) {
      setError(errorMessage(err, t('admin.users.createTestUserFailed')));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.root}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AdminFormHero
              icon={FlaskConical}
              eyebrow={t('admin.labels.testUser')}
              heading={t('admin.users.createTestUserTitle')}
              subheading={t('admin.users.createTestUserHint')}
            />

            {error ? (
              <View style={adminErrorBanner.box}>
                <Text style={adminErrorBanner.text}>{error}</Text>
              </View>
            ) : null}

            <AdminFormSection title={t('admin.users.createTestUserSections.account')}>
              <FormInput
                label={t('admin.users.createTestUserFields.fullName')}
                value={fullName}
                onChangeText={setFullName}
                error={fieldErrors.fullName}
                autoCapitalize="words"
              />
              <FormInput
                label={t('admin.users.createTestUserFields.mobile')}
                value={mobileNumber}
                onChangeText={text => setMobileNumber(text.replace(/\D/g, '').slice(0, 10))}
                error={fieldErrors.mobileNumber}
                keyboardType="number-pad"
                maxLength={10}
              />
              <FormInput
                label={t('admin.users.createTestUserFields.email')}
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </AdminFormSection>

            <AdminFormSection title={t('admin.users.createTestUserSections.password')}>
              <PasswordField
                label={t('admin.users.createTestUserFields.password')}
                value={password}
                onChangeText={setPassword}
                error={fieldErrors.password}
                textContentType="newPassword"
                autoComplete="password-new"
              />
              <View style={styles.passwordGap} />
              <PasswordField
                label={t('admin.users.createTestUserFields.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={fieldErrors.confirmPassword}
                textContentType="newPassword"
                autoComplete="password-new"
              />
            </AdminFormSection>

            <AdminFormSection title={t('admin.users.createTestUserSections.membership')}>
              <Text style={styles.label}>{t('admin.users.createTestUserFields.spaceRole')}</Text>
              <Text style={styles.hint}>{t('admin.users.createTestUserFields.spaceRoleHint')}</Text>
              <View style={styles.roleGrid}>
                {SPACE_ROLES.map(role => {
                  const selected = spaceRole === role;
                  return (
                    <Pressable
                      key={role}
                      style={[styles.roleChip, selected && styles.roleChipSelected]}
                      onPress={() => {
                        setSpaceRole(role);
                        if (role === 'OWNER') setSpaceId(null);
                      }}>
                      <Text style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>
                        {t(`admin.users.createTestUserRoles.${role}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {fieldErrors.spaceRole ? (
                <Text style={styles.fieldError}>{fieldErrors.spaceRole}</Text>
              ) : null}

              {spaceRole === 'OWNER' ? (
                <>
                  <SpaceTypePicker
                    value={spaceType}
                    onChange={setSpaceType}
                    error={fieldErrors.spaceType}
                    allowedTypes={SPACE_TYPES}
                  />
                  <FormInput
                    label={t('admin.users.createTestUserFields.spaceName')}
                    value={spaceName}
                    onChangeText={setSpaceName}
                    hint={t('admin.users.createTestUserFields.spaceNameHint')}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>{t('admin.users.createTestUserFields.space')}</Text>
                  <Pressable
                    style={[
                      styles.spacePicker,
                      fieldErrors.spaceId ? styles.spacePickerError : null,
                      !spaceRole ? styles.spacePickerDisabled : null,
                    ]}
                    disabled={!spaceRole || loadingSpaces}
                    onPress={() => setSpacePickerOpen(true)}>
                    {loadingSpaces ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Text
                        style={
                          selectedSpace ? styles.spacePickerValue : styles.spacePickerPlaceholder
                        }>
                        {selectedSpace
                          ? `${selectedSpace.name} (${selectedSpace.type}) · ${selectedSpace.ownerName}`
                          : t('admin.users.createTestUserFields.spaceHint')}
                      </Text>
                    )}
                  </Pressable>
                  {fieldErrors.spaceId ? (
                    <Text style={styles.fieldError}>{fieldErrors.spaceId}</Text>
                  ) : null}
                </>
              )}
            </AdminFormSection>
          </ScrollView>

          <StickyFormActions
            primary={{
              label: loading ? t('common.saving') : t('admin.users.createTestUser'),
              onPress: () => {
                handleSubmit().catch(() => undefined);
              },
              loading,
              disabled: loading,
            }}
            secondary={{
              label: t('common.cancel'),
              onPress: () => navigation.goBack(),
              disabled: loading,
            }}
          />
        </View>
      </TouchableWithoutFeedback>

      <Modal
        visible={spacePickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSpacePickerOpen(false)}>
        <View style={styles.modalRoot}>
          <Text style={styles.modalTitle}>{t('admin.users.createTestUserFields.space')}</Text>
          <FlatList
            data={spaces}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('admin.users.createTestUserEmptySpaces')}</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.spaceRow}
                onPress={() => {
                  setSpaceId(item.id);
                  setSpacePickerOpen(false);
                }}>
                <Text style={styles.spaceRowTitle}>{item.name}</Text>
                <Text style={styles.spaceRowMeta}>
                  {item.type} · {item.ownerName} · {item.ownerMobile}
                </Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.modalClose} onPress={() => setSpacePickerOpen(false)}>
            <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  passwordGap: { height: spacing.sm },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  roleChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  roleChipText: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  roleChipTextSelected: {
    color: colors.primaryDark,
  },
  fieldError: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
  spacePicker: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.white,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  spacePickerError: {
    borderColor: '#DC2626',
  },
  spacePickerDisabled: {
    opacity: 0.6,
  },
  spacePickerValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  spacePickerPlaceholder: {
    ...typography.body,
    color: colors.muted,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  modalList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  spaceRow: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  spaceRowTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  spaceRowMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  modalClose: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCloseText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
