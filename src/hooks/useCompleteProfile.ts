import { useCallback, useState } from 'react';
import { authApi } from '../api/authApi';
import { memberApi, PENDING_UPLOAD_FILE_URL } from '../api/memberApi';
import { ApiError } from '../api/types';
import type { CompleteUserProfileRequest, MemberDocumentType, UUID } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { isConsumerMembershipRole } from '../utils/profileCompletion';

const MAX_DOCUMENT_FILE_URL_LENGTH = 2048;

function resolveMemberDocumentFileUrl(fileUrl: string | null | undefined): string | null {
  const trimmed = fileUrl?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('file://') || trimmed.length > MAX_DOCUMENT_FILE_URL_LENGTH) {
    return PENDING_UPLOAD_FILE_URL;
  }
  return trimmed;
}

export type CompleteProfileInput = CompleteUserProfileRequest;

type UseCompleteProfileResult = {
  completeProfile: (payload: CompleteProfileInput) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
};

async function syncLinkedMemberProfile(
  spaceId: UUID,
  memberId: UUID,
  payload: CompleteProfileInput,
): Promise<void> {
  const member = await memberApi.getMember(spaceId, memberId);

  await memberApi.updateMember(spaceId, memberId, {
    fullName: payload.fullName.trim(),
    mobileNumber: member.mobileNumber,
    role: member.role,
    gender: payload.gender ?? member.gender ?? null,
  });

  if (
    payload.emergencyContactName?.trim() ||
    payload.emergencyContactMobile?.trim() ||
    payload.emergencyContactRelation?.trim()
  ) {
    await memberApi.updateEmergencyContact(spaceId, memberId, {
      emergencyContactName: payload.emergencyContactName?.trim() || null,
      emergencyContactMobile: payload.emergencyContactMobile?.trim() || null,
      emergencyContactRelation: payload.emergencyContactRelation?.trim() || null,
    });
  }

  const uploads: Array<{ type: MemberDocumentType; number: string; fileUrl: string }> = [];

  const identityFileUrl = resolveMemberDocumentFileUrl(payload.identityProofFileUrl);
  if (payload.identityDocumentType && (payload.identityDocumentNumber?.trim() || identityFileUrl)) {
    uploads.push({
      type: payload.identityDocumentType,
      number: payload.identityDocumentNumber?.trim() || 'Identity document',
      fileUrl: identityFileUrl || PENDING_UPLOAD_FILE_URL,
    });
  } else if (identityFileUrl) {
    uploads.push({
      type: 'OTHER',
      number: 'Identity proof',
      fileUrl: identityFileUrl,
    });
  }

  const addressFileUrl = resolveMemberDocumentFileUrl(payload.addressProofFileUrl);
  if (addressFileUrl) {
    uploads.push({
      type: 'OTHER',
      number: 'Address proof',
      fileUrl: addressFileUrl,
    });
  }

  const additionalFileUrl = resolveMemberDocumentFileUrl(payload.additionalDocumentFileUrl);
  if (additionalFileUrl) {
    uploads.push({
      type: 'OTHER',
      number: 'Additional document',
      fileUrl: additionalFileUrl,
    });
  }

  for (const upload of uploads) {
    await memberApi.addMemberDocument(spaceId, memberId, {
      documentType: upload.type,
      documentNumber: upload.number,
      fileUrl: upload.fileUrl,
    });
  }
}

export function useCompleteProfile(): UseCompleteProfileResult {
  const updateUser = useAuthStore(state => state.updateUser);
  const refreshUser = useAuthStore(state => state.refreshUser);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeProfile = useCallback(
    async (payload: CompleteProfileInput) => {
      setIsSubmitting(true);
      setError(null);

      try {
        let user;
        let usedFallback = false;
        try {
          user = await authApi.completeProfile(payload);
        } catch (err) {
          if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
            usedFallback = true;
            const baseUser = await authApi.updateMe({ fullName: payload.fullName.trim() });
            user = {
              ...baseUser,
              email: payload.email ?? baseUser.email ?? null,
              gender: payload.gender ?? baseUser.gender ?? null,
              dateOfBirth: payload.dateOfBirth ?? baseUser.dateOfBirth ?? null,
              profilePhotoUrl: payload.profilePhotoUrl ?? baseUser.profilePhotoUrl ?? null,
              permanentAddress: payload.permanentAddress,
              city: payload.city,
              state: payload.state,
              pincode: payload.pincode,
              profileCompleted: true,
              profileStatus: 'COMPLETED',
              profileCompletedAt: new Date().toISOString(),
              profileCompletionPercentage: 100,
            };
          } else {
            throw err;
          }
        }

        await updateUser(user);

        if (usedFallback) {
          const consumerSpaces = mySpaces.filter(space =>
            isConsumerMembershipRole(space.membershipRole),
          );

          for (const space of consumerSpaces) {
            try {
              const linked = await memberApi.getMyLinkedMember(space.spaceId);
              await syncLinkedMemberProfile(space.spaceId, linked.memberId, payload);
            } catch (syncErr) {
              console.warn('[CompleteProfile] linked member sync skipped', space.spaceId, syncErr);
            }
          }
        }

        const refreshed = await refreshUser();
        if (refreshed?.profileCompleted !== true && user.profileCompleted) {
          await updateUser(user);
        }
        return true;
      } catch (err) {
        console.error('[CompleteProfile] failed', err);
        setError(
          err instanceof ApiError ? err.message : 'profileCompletion.errors.submitFailed',
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mySpaces, refreshUser, updateUser],
  );

  const clearError = useCallback(() => setError(null), []);

  return { completeProfile, isSubmitting, error, clearError };
}
