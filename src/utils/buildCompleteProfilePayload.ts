import type {
  CompleteUserProfileRequest,
  MemberDetailsResponse,
  UserResponse,
} from '../api/types';
import type { ProfileDocumentFormState } from './profileDocuments';

export function buildCompleteProfilePayloadFromUser(
  user: UserResponse,
  options: {
    linkedMember?: MemberDetailsResponse | null;
    documentState?: ProfileDocumentFormState;
    overrides?: Partial<CompleteUserProfileRequest>;
  } = {},
): CompleteUserProfileRequest {
  const documentState = options.documentState;
  const linkedMember = options.linkedMember;

  return {
    fullName: user.fullName,
    gender: user.gender ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    email: user.email ?? null,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    permanentAddress: user.permanentAddress ?? '',
    city: user.city ?? '',
    state: user.state ?? '',
    pincode: user.pincode ?? '',
    emergencyContactName: linkedMember?.emergencyContactName ?? null,
    emergencyContactMobile: linkedMember?.emergencyContactMobile ?? null,
    emergencyContactRelation: linkedMember?.emergencyContactRelation ?? null,
    identityDocumentType: documentState?.identityDocumentType ?? null,
    identityDocumentNumber: documentState?.identityDocumentNumber?.trim() || null,
    addressProofFileUrl: documentState?.addressProofFileUrl?.trim() || null,
    identityProofFileUrl: documentState?.identityProofFileUrl?.trim() || null,
    additionalDocumentFileUrl: documentState?.additionalDocumentFileUrl?.trim() || null,
    ...options.overrides,
  };
}
