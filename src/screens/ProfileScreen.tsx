import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import { memberApi } from '../api/memberApi';
import type { MemberDetailsResponse, MemberDocumentType } from '../api/types';
import { LanguagePicker } from '../components/settings/LanguagePicker';
import { ProfileDocumentsSection } from '../components/profile/ProfileDocumentsSection';
import { ProfileDocumentUploadModal } from '../components/profile/ProfileDocumentUploadModal';
import { MemberSectionTitle } from '../components/member/MemberDetailRow';
import { UserProfileFields } from '../components/profile/UserProfileFields';
import {
  Button,
  Card,
  HeaderBackButton,
  Screen,
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
import { colors, spacing, typography } from '../theme';
import { buildCompleteProfilePayloadFromUser } from '../utils/buildCompleteProfilePayload';
import { isConsumerMembershipRole } from '../utils/profileCompletion';
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

  const loadProfileContext = useCallback(async () => {
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

  if (!user) {
    return (
      <Screen contentStyle={styles.content}>
        <Text style={styles.subheading}>{t('common.errors.authRequired')}</Text>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.eyebrow}>{t('settings.profile.eyebrow')}</Text>
      <Text style={styles.heading}>{t('settings.profile.heading')}</Text>
      <Text style={styles.subheading}>{t('settings.profile.subheading')}</Text>

      {correctionNotes.length > 0 ? (
        <>
          <MemberSectionTitle title={t('settings.profile.correctionRequests')} />
          {correctionNotes.map(note => (
            <Card key={note.noteId} style={styles.correctionCard}>
              <Text style={styles.correctionMessage}>{profileCorrectionMessage(note.note)}</Text>
              <Text style={styles.correctionMeta}>
                {t('settings.profile.correctionFromOwner', { name: note.createdByName })}
              </Text>
              <Button
                label={t('settings.profile.editProfile')}
                variant="secondary"
                onPress={handleEditProfile}
                style={styles.correctionAction}
              />
            </Card>
          ))}
        </>
      ) : null}

      <View style={styles.profileHeader}>
        <Button
          label={t('settings.profile.editProfile')}
          variant="secondary"
          onPress={handleEditProfile}
        />
      </View>

      <UserProfileFields
        user={user}
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

      {linkedMemberId && consumerSpaceId ? (
        <ProfileDocumentsSection
          spaceId={consumerSpaceId}
          memberId={linkedMemberId}
          onRequestUpload={handleOpenUpload}
          refreshKey={documentsRefreshKey}
        />
      ) : (
        <>
          <MemberSectionTitle title={t('settings.profile.documentsSection')} />
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('settings.profile.documentsNoSpace')}</Text>
            <Button
              label={t('settings.profile.editProfile')}
              variant="secondary"
              onPress={handleEditProfile}
              style={styles.documentsFallbackButton}
            />
          </Card>
        </>
      )}

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
  profileHeader: {
    marginBottom: spacing.lg,
  },
  correctionCard: {
    marginBottom: spacing.md,
  },
  correctionMessage: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  correctionMeta: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  correctionAction: {
    alignSelf: 'flex-start',
  },
  emptyCard: {
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  documentsFallbackButton: {
    alignSelf: 'flex-start',
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
