import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  FileText,
  Info,
  Languages,
  LogOut,
  SquarePen,
  Trash2,
  TriangleAlert,
  UserRound,
} from 'lucide-react-native';
import { authApi } from '../api/authApi';
import { memberApi } from '../api/memberApi';
import type { MemberDetailsResponse, MemberDocumentType, MembershipRole } from '../api/types';
import { LanguagePicker } from '../components/settings/LanguagePicker';
import { ProfileDocumentsSection } from '../components/profile/ProfileDocumentsSection';
import { ProfileDocumentUploadModal } from '../components/profile/ProfileDocumentUploadModal';
import { ProfileHero } from '../components/profile/ProfileHero';
import { SettingsGroupCard } from '../components/profile/SettingsGroupCard';
import { UserProfileFields } from '../components/profile/UserProfileFields';
import { DashboardActionRow } from '../components/dashboard/shared/DashboardActionRow';
import {
  Button,
  EmptyState,
  HeaderBackButton,
  Screen,
  Skeleton,
  SkeletonCard,
  useConfirmDialog,
} from '../components/ui';
import { useAuthenticatedUser } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';
import type { AppLanguage } from '../i18n';
import type { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { env } from '../config/env';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { buildCompleteProfilePayloadFromUser } from '../utils/buildCompleteProfilePayload';
import { invalidateDashboardQueries } from '../utils/dashboardQueryCache';
import {
  isConsumerMembershipRole,
  profileCompletionPercentage,
} from '../utils/profileCompletion';
import {
  findPrimaryIdentityDocument,
  profileDocumentsToFormState,
  type ProfileDocumentFormState,
} from '../utils/profileDocuments';
import { pickProfileImage } from '../utils/pickProfileImage';
import {
  isProfileCorrectionNote,
  profileCorrectionMessage,
} from '../utils/profileCorrection';

type ProfileNav = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

function roleToneLabel(
  role: MembershipRole | undefined,
  t: (key: string, opts?: { defaultValue?: string }) => string,
): string | null {
  if (!role) {
    return null;
  }
  return t(`spaces.roles.${role}`, { defaultValue: role });
}

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ProfileNav>();
  const user = useAuthenticatedUser();
  const refreshUser = useAuthStore(state => state.refreshUser);
  const updateUser = useAuthStore(state => state.updateUser);
  const logout = useLogout();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);
  const selectedSpaceId = useSpaceStore(state => state.selectedSpaceId);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const notes = useMemberStore(state => state.notes);
  const loadNotes = useMemberStore(state => state.loadNotes);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [linkedMember, setLinkedMember] = useState<MemberDetailsResponse | null>(null);
  const [linkedMemberId, setLinkedMemberId] = useState<string | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);
  const [identityDocument, setIdentityDocument] = useState<{
    type: MemberDocumentType;
    number: string;
  } | null>(null);
  const [documentState, setDocumentState] = useState<ProfileDocumentFormState | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<
    'profilePhoto' | 'identityProof' | 'addressProof' | null
  >(null);
  const currentLanguage = i18n.language as AppLanguage;

  const consumerSpaceId = useMemo(() => {
    if (selectedSpaceId) {
      const selected = mySpaces.find(space => space.spaceId === selectedSpaceId);
      if (selected && isConsumerMembershipRole(selected.membershipRole)) {
        return selectedSpaceId;
      }
    }

    return (
      mySpaces.find(space => isConsumerMembershipRole(space.membershipRole))?.spaceId ?? null
    );
  }, [mySpaces, selectedSpaceId]);

  const currentSpace = useMemo(() => {
    if (selectedSpaceId) {
      return mySpaces.find(space => space.spaceId === selectedSpaceId) ?? null;
    }
    return mySpaces[0] ?? null;
  }, [mySpaces, selectedSpaceId]);

  const loadProfileContext = useCallback(async () => {
    setContextLoading(true);
    try {
      await refreshUser();

      if (!consumerSpaceId) {
        setLinkedMember(null);
        setLinkedMemberId(null);
        setIdentityDocument(null);
        setDocumentState(null);
        return;
      }

      try {
        const linked = await memberApi.getMyLinkedMember(consumerSpaceId);
        setLinkedMemberId(linked.memberId);

        const details = await memberApi.getMember(consumerSpaceId, linked.memberId);
        setLinkedMember(details);
        await loadNotes(linked.memberId, true);

        const documents = await memberApi.getMemberDocuments(consumerSpaceId, linked.memberId);
        const docState = profileDocumentsToFormState(documents);
        setDocumentState(docState);
        const primary = findPrimaryIdentityDocument(documents);
        setIdentityDocument(
          primary
            ? { type: primary.documentType, number: primary.documentNumber }
            : docState.identityDocumentType && docState.identityDocumentNumber
              ? {
                  type: docState.identityDocumentType,
                  number: docState.identityDocumentNumber,
                }
              : null,
        );
      } catch {
        setLinkedMember(null);
        setLinkedMemberId(null);
        setIdentityDocument(null);
        setDocumentState(null);
      }
    } finally {
      setContextLoading(false);
    }
  }, [consumerSpaceId, loadNotes, refreshUser]);

  useFocusEffect(
    useCallback(() => {
      void loadProfileContext();
    }, [loadProfileContext]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.profile'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

  const handleEditProfile = () => {
    navigation.navigate('CompleteProfile', { mode: 'edit' });
  };

  const handleOpenMySpaces = () => {
    navigation.navigate('MySpaces');
  };

  const handleOpenUpload = () => {
    if (!linkedMemberId || !consumerSpaceId) {
      showToast(t('settings.profile.documentsNoSpace'));
      return;
    }
    setUploadModalVisible(true);
  };

  const saveProfileAsset = async (
    asset: 'profilePhoto' | 'identityProof' | 'addressProof',
    overrides: Parameters<typeof buildCompleteProfilePayloadFromUser>[1]['overrides'],
  ) => {
    if (!user) {
      return;
    }

    setUploadingAsset(asset);
    try {
      const picked = await pickProfileImage();
      if (!picked) {
        return;
      }

      const fileOverride =
        asset === 'profilePhoto'
          ? { profilePhotoUrl: picked.fileUrl }
          : asset === 'identityProof'
            ? { identityProofFileUrl: picked.fileUrl }
            : { addressProofFileUrl: picked.fileUrl };

      const payload = buildCompleteProfilePayloadFromUser(user, {
        linkedMember,
        documentState: documentState ?? undefined,
        overrides: { ...overrides, ...fileOverride },
      });

      const updated = await authApi.completeProfile(payload);
      await updateUser(updated);
      await loadProfileContext();
      setDocumentsRefreshKey(key => key + 1);
      invalidateDashboardQueries();
      showToast(t('settings.profile.saveSuccess'));
    } catch {
      showToast(t('common.errors.generic'));
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleUploadProfilePhoto = () => {
    void saveProfileAsset('profilePhoto', {});
  };

  const handleUploadIdentityProof = () => {
    if (!identityDocument && !documentState?.identityDocumentType) {
      showConfirm({
        title: t('profileCompletion.fields.identityProof'),
        message: t('settings.profile.identityProofHint'),
        confirmLabel: t('settings.profile.editProfile'),
        cancelLabel: t('common.cancel'),
        onConfirm: handleEditProfile,
      });
      return;
    }
    void saveProfileAsset('identityProof', {
      identityDocumentType:
        identityDocument?.type ?? documentState?.identityDocumentType ?? null,
      identityDocumentNumber:
        identityDocument?.number ?? documentState?.identityDocumentNumber ?? null,
    });
  };

  const handleUploadAddressProof = () => {
    void saveProfileAsset('addressProof', {});
  };

  const canUploadAssets = Boolean(consumerSpaceId && linkedMemberId);

  const correctionNotes = useMemo(
    () => notes.filter(note => isProfileCorrectionNote(note.note)),
    [notes],
  );

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

  const handleDeleteAccount = () => {
    navigation.navigate('DeleteAccount');
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await Linking.openURL(env.privacyPolicyUrl);
    } catch {
      showToast(t('common.errors.generic'));
    }
  };

  const completionPercent = profileCompletionPercentage(user);
  const profileStatusLabel = user?.profileStatus
    ? t(`settings.profile.profileStatus.${user.profileStatus}`)
    : null;
  const profileStatusTone =
    user?.profileStatus === 'VERIFIED' || user?.profileStatus === 'COMPLETED'
      ? ('active' as const)
      : user?.profileStatus === 'REJECTED'
        ? ('inactive' as const)
        : ('neutral' as const);

  if (!user) {
    return (
      <Screen contentStyle={styles.content}>
        <EmptyState
          Icon={UserRound}
          title={t('common.errors.authRequired')}
          description={t('settings.profile.subheading')}
        />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <Screen scrollable contentStyle={styles.content}>
        <ProfileHero
          fullName={user.fullName ?? ''}
          mobile={user.mobileNumber}
          photoUrl={user.profilePhotoUrl}
          roleLabel={roleToneLabel(currentSpace?.membershipRole, t)}
          spaceName={currentSpace?.spaceName ?? null}
          statusLabel={profileStatusLabel}
          statusTone={profileStatusTone}
          membershipLabel={
            mySpaces.length > 0
              ? t('settings.profile.spacesJoined', {
                  count: mySpaces.length,
                  defaultValue: '{{count}} spaces',
                })
              : null
          }
          completionPercent={completionPercent}
          completionLabel={t('settings.profile.completionLabel', {
            defaultValue: 'Profile completion',
          })}
          editLabel={t('settings.profile.editProfile')}
          onEdit={handleEditProfile}
        />

        <View style={styles.quickActions}>
          <DashboardActionRow
            title={t('settings.profile.editProfile')}
            subtitle={t('settings.profile.quickEditSubtitle', {
              defaultValue: 'Update personal details and KYC',
            })}
            icon={SquarePen}
            onPress={handleEditProfile}
          />
          <DashboardActionRow
            title={t('settings.profile.switchSpace', {
              defaultValue: 'Switch space',
            })}
            subtitle={
              currentSpace?.spaceName ??
              t('settings.profile.switchSpaceSubtitle', {
                defaultValue: 'Open My Spaces',
              })
            }
            icon={Building2}
            onPress={handleOpenMySpaces}
          />
          {canUploadAssets ? (
            <DashboardActionRow
              title={t('settings.profile.documentsSection')}
              subtitle={t('settings.profile.documentsDescription', {
                defaultValue: 'Upload identity and address proofs',
              })}
              icon={FileText}
              onPress={handleOpenUpload}
            />
          ) : null}
        </View>

        {correctionNotes.length > 0 ? (
          <SettingsGroupCard
            title={t('settings.profile.correctionRequests')}
            icon={TriangleAlert}
            accent="#D97706">
            {correctionNotes.map(note => (
              <View key={note.noteId} style={styles.correctionCard}>
                <View style={styles.correctionIcon}>
                  <TriangleAlert size={16} color="#D97706" strokeWidth={2.2} />
                </View>
                <View style={styles.correctionBody}>
                  <Text style={styles.correctionMessage}>
                    {profileCorrectionMessage(note.note)}
                  </Text>
                  <Text style={styles.correctionMeta}>
                    {t('settings.profile.correctionFromOwner', { name: note.createdByName })}
                  </Text>
                  <Button
                    label={t('settings.profile.editProfile')}
                    variant="secondary"
                    onPress={handleEditProfile}
                    style={styles.correctionAction}
                  />
                </View>
              </View>
            ))}
          </SettingsGroupCard>
        ) : null}

        {contextLoading && !linkedMemberId ? (
          <View style={styles.loadingWrap}>
            <SkeletonCard />
            <View style={styles.skeletonRow}>
              <Skeleton width={28} height={28} borderRadius={radius.sm} />
              <Skeleton width="70%" height={14} />
            </View>
            <SkeletonCard />
          </View>
        ) : (
          <UserProfileFields
            user={user}
            showPhoto
            showPhotoMeta={false}
            identityDocument={identityDocument}
            identityProofPreviewUri={documentState?.identityProofFileUrl}
            addressProofPreviewUri={documentState?.addressProofFileUrl}
            canUploadAssets={canUploadAssets}
            uploadingAsset={uploadingAsset}
            onUploadProfilePhoto={handleUploadProfilePhoto}
            onUploadIdentityProof={handleUploadIdentityProof}
            onUploadAddressProof={handleUploadAddressProof}
            emergencyContact={
              linkedMember
                ? {
                    name: linkedMember.emergencyContactName,
                    relation: linkedMember.emergencyContactRelation,
                    mobile: linkedMember.emergencyContactMobile,
                  }
                : undefined
            }
          />
        )}

        {linkedMemberId && consumerSpaceId ? (
          <ProfileDocumentsSection
            spaceId={consumerSpaceId}
            memberId={linkedMemberId}
            onRequestUpload={handleOpenUpload}
            refreshKey={documentsRefreshKey}
          />
        ) : (
          <SettingsGroupCard
            title={t('settings.profile.documentsSection')}
            icon={FileText}
            description={t('settings.profile.documentsNoSpace')}>
            <Button
              label={t('settings.profile.editProfile')}
              variant="secondary"
              onPress={handleEditProfile}
              style={styles.documentsFallbackButton}
            />
          </SettingsGroupCard>
        )}

        <SettingsGroupCard
          title={t('settings.language.title')}
          icon={Languages}
          description={t('settings.language.description')}>
          <LanguagePicker value={currentLanguage} />
        </SettingsGroupCard>

        <SettingsGroupCard
          title={t('settings.profile.sessionTitle')}
          icon={Info}
          description={t('settings.profile.sessionBody')}>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionMetaLabel}>
              {t('settings.profile.versionLabel', { defaultValue: 'App version' })}
            </Text>
            <Text style={styles.sessionMetaValue}>0.0.1</Text>
          </View>
        </SettingsGroupCard>

        <Button
          label={t('settings.profile.privacyPolicy')}
          variant="ghost"
          icon={FileText}
          onPress={() => {
            void handleOpenPrivacyPolicy();
          }}
          disabled={isLoggingOut}
        />

        <Button
          label={t('settings.profile.deleteAccount')}
          variant="ghost"
          icon={Trash2}
          onPress={handleDeleteAccount}
          disabled={isLoggingOut}
          style={styles.deleteAccountButton}
        />

        <Button
          label={t('settings.profile.logout')}
          variant="ghost"
          icon={LogOut}
          onPress={handleLogout}
          loading={isLoggingOut}
          disabled={isLoggingOut}
          style={styles.logoutButton}
        />
      </Screen>

      {consumerSpaceId && linkedMemberId ? (
        <ProfileDocumentUploadModal
          visible={uploadModalVisible}
          spaceId={consumerSpaceId}
          memberId={linkedMemberId}
          onClose={() => setUploadModalVisible(false)}
          onUploaded={() => setDocumentsRefreshKey(key => key + 1)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.section,
    gap: spacing.sm,
  },
  quickActions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingWrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  correctionCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.warningTint,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.md,
  },
  correctionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
  },
  correctionBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  correctionMessage: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  correctionMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  correctionAction: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  documentsFallbackButton: {
    alignSelf: 'flex-start',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  sessionMetaLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  sessionMetaValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: spacing.sm,
    backgroundColor: '#FEF2F2',
    ...shadows.sm,
  },
  deleteAccountButton: {
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: spacing.sm,
    backgroundColor: '#FEF2F2',
    ...shadows.sm,
  },
});
