import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import type { MemberDocumentType, UserResponse } from '../../api/types';
import { DashboardSectionHeader } from '../dashboard/shared/DashboardSectionHeader';
import { MemberDetailRow } from '../member/MemberDetailRow';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isSelectableMemberGender, memberGenderLabelKey } from '../../utils/memberGender';
import { ProfileAssetUploadRow } from './ProfileAssetUploadRow';

type UserProfileFieldsProps = {
  user: UserResponse;
  emergencyContact?: {
    name?: string | null;
    relation?: string | null;
    mobile?: string | null;
  };
  showPhoto?: boolean;
  /** When false, photo card shows upload only (hero already shows identity). */
  showPhotoMeta?: boolean;
  identityDocument?: {
    type: MemberDocumentType;
    number: string;
  } | null;
  identityProofPreviewUri?: string | null;
  addressProofPreviewUri?: string | null;
  canUploadAssets?: boolean;
  uploadingAsset?: 'profilePhoto' | 'identityProof' | 'addressProof' | null;
  onUploadProfilePhoto?: () => void;
  onUploadIdentityProof?: () => void;
  onUploadAddressProof?: () => void;
};

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function previewUriForStoredFile(stored?: string | null): string {
  if (!stored) {
    return '';
  }
  if (stored.startsWith('file://') || stored.startsWith('data:') || stored.startsWith('http')) {
    return stored;
  }
  return stored;
}

export function UserProfileFields({
  user,
  emergencyContact,
  showPhoto = true,
  showPhotoMeta = true,
  identityDocument,
  identityProofPreviewUri,
  addressProofPreviewUri,
  canUploadAssets = false,
  uploadingAsset = null,
  onUploadProfilePhoto,
  onUploadIdentityProof,
  onUploadAddressProof,
}: UserProfileFieldsProps) {
  const { t } = useTranslation();

  const genderLabel = isSelectableMemberGender(user.gender)
    ? t(memberGenderLabelKey(user.gender))
    : '—';

  const profileStatusLabel = user.profileStatus
    ? t(`settings.profile.profileStatus.${user.profileStatus}`)
    : '—';

  const kycStatusLabel = user.kycStatus
    ? t(`settings.profile.kycStatus.${user.kycStatus}`)
    : '—';

  const photoUri = previewUriForStoredFile(user.profilePhotoUrl);
  const showPhotoCard =
    showPhoto && (showPhotoMeta || (canUploadAssets && onUploadProfilePhoto));

  return (
    <View style={styles.root}>
      {showPhotoCard ? (
        <View style={styles.card}>
          {showPhotoMeta ? (
            <View style={styles.photoRow}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {(user.fullName ?? 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.photoMeta}>
                <Text style={styles.name}>{user.fullName}</Text>
                <Text style={styles.mobile}>
                  {user.mobileNumber ? `+91 ${user.mobileNumber}` : '—'}
                </Text>
              </View>
            </View>
          ) : null}
          {canUploadAssets && onUploadProfilePhoto ? (
            <ProfileAssetUploadRow
              label={t('profileCompletion.fields.profilePhoto')}
              onUpload={onUploadProfilePhoto}
              loading={uploadingAsset === 'profilePhoto'}
              showPreview={false}
            />
          ) : null}
        </View>
      ) : null}

      <DashboardSectionHeader
        title={t('settings.profile.personalSection')}
        icon={UserRound}
      />
      <View style={styles.card}>
        <MemberDetailRow label={t('settings.profile.fullNameLabel')} value={user.fullName || '—'} />
        <MemberDetailRow
          label={t('settings.profile.mobileLabel')}
          value={user.mobileNumber ? `+91 ${user.mobileNumber}` : '—'}
        />
        <MemberDetailRow label={t('settings.profile.emailLabel')} value={user.email ?? '—'} />
        <MemberDetailRow label={t('settings.profile.genderLabel')} value={genderLabel} />
        <MemberDetailRow
          label={t('settings.profile.dateOfBirthLabel')}
          value={formatDate(user.dateOfBirth)}
          isLast={!identityDocument && !canUploadAssets}
        />
        {identityDocument ? (
          <>
            <MemberDetailRow
              label={t('membership.documents.typeLabel')}
              value={t(`membership.documents.types.${identityDocument.type}`)}
            />
            <MemberDetailRow
              label={t('profileCompletion.fields.documentNumber')}
              value={identityDocument.number}
              isLast={!canUploadAssets}
            />
          </>
        ) : null}
        {canUploadAssets && onUploadIdentityProof ? (
          <ProfileAssetUploadRow
            label={t('profileCompletion.fields.identityProof')}
            previewUri={identityProofPreviewUri}
            onUpload={onUploadIdentityProof}
            loading={uploadingAsset === 'identityProof'}
            hint={
              identityDocument
                ? undefined
                : t('settings.profile.identityProofHint')
            }
          />
        ) : null}
      </View>

      <DashboardSectionHeader
        title={t('settings.profile.addressSection')}
        icon={MapPin}
      />
      <View style={styles.card}>
        <MemberDetailRow
          label={t('settings.profile.permanentAddressLabel')}
          value={user.permanentAddress ?? '—'}
        />
        <MemberDetailRow label={t('settings.profile.cityLabel')} value={user.city ?? '—'} />
        <MemberDetailRow label={t('settings.profile.stateLabel')} value={user.state ?? '—'} />
        <MemberDetailRow
          label={t('settings.profile.pincodeLabel')}
          value={user.pincode ?? '—'}
          isLast={!canUploadAssets}
        />
        {canUploadAssets && onUploadAddressProof ? (
          <ProfileAssetUploadRow
            label={t('profileCompletion.fields.addressProof')}
            previewUri={addressProofPreviewUri}
            onUpload={onUploadAddressProof}
            loading={uploadingAsset === 'addressProof'}
          />
        ) : null}
      </View>

      {emergencyContact ? (
        <>
          <DashboardSectionHeader
            title={t('settings.profile.emergencySection')}
            icon={Phone}
          />
          <View style={styles.card}>
            <MemberDetailRow
              label={t('membership.emergency.name')}
              value={emergencyContact.name ?? '—'}
            />
            <MemberDetailRow
              label={t('membership.emergency.relation')}
              value={emergencyContact.relation ?? '—'}
            />
            <MemberDetailRow
              label={t('membership.emergency.mobile')}
              value={emergencyContact.mobile ?? '—'}
              isLast
            />
          </View>
        </>
      ) : null}

      <DashboardSectionHeader
        title={t('settings.profile.kycSection')}
        icon={ShieldCheck}
      />
      <View style={styles.card}>
        <MemberDetailRow
          label={t('settings.profile.profileStatusLabel')}
          value={profileStatusLabel}
        />
        <MemberDetailRow label={t('settings.profile.kycStatusLabel')} value={kycStatusLabel} />
        <MemberDetailRow
          label={t('settings.profile.documentsUploadedLabel')}
          value={String(user.documentsUploaded ?? 0)}
        />
        <MemberDetailRow
          label={t('settings.profile.profileCompletedAtLabel')}
          value={formatDate(user.profileCompletedAt)}
          isLast
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  photoMeta: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    marginBottom: spacing.xxs,
    color: colors.textPrimary,
  },
  mobile: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
