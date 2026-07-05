import { PENDING_UPLOAD_FILE_URL } from '../api/memberApi';
import type { MemberDocumentResponse, MemberDocumentType } from '../api/types';

const IDENTITY_DOCUMENT_TYPES: MemberDocumentType[] = [
  'AADHAAR',
  'PAN',
  'PASSPORT',
  'DRIVING_LICENSE',
  'STUDENT_ID',
];

export type ProfileDocumentFormState = {
  identityDocumentType: MemberDocumentType | null;
  identityDocumentNumber: string;
  addressProofFileUrl: string;
  identityProofFileUrl: string;
  additionalDocumentFileUrl: string;
};

function isStoredFileUrl(fileUrl: string | null | undefined): fileUrl is string {
  return Boolean(fileUrl && fileUrl !== PENDING_UPLOAD_FILE_URL);
}

export function profileDocumentsToFormState(
  documents: MemberDocumentResponse[],
): ProfileDocumentFormState {
  const state: ProfileDocumentFormState = {
    identityDocumentType: null,
    identityDocumentNumber: '',
    addressProofFileUrl: '',
    identityProofFileUrl: '',
    additionalDocumentFileUrl: '',
  };

  for (const doc of documents) {
    if (IDENTITY_DOCUMENT_TYPES.includes(doc.documentType)) {
      if (!state.identityDocumentType) {
        state.identityDocumentType = doc.documentType;
        state.identityDocumentNumber = doc.documentNumber;
        if (isStoredFileUrl(doc.fileUrl)) {
          state.identityProofFileUrl = doc.fileUrl;
        }
      }
      continue;
    }

    if (doc.documentType !== 'OTHER') {
      continue;
    }

    if (doc.documentNumber === 'Address proof' && isStoredFileUrl(doc.fileUrl)) {
      state.addressProofFileUrl = doc.fileUrl;
    } else if (doc.documentNumber === 'Additional document' && isStoredFileUrl(doc.fileUrl)) {
      state.additionalDocumentFileUrl = doc.fileUrl;
    } else if (doc.documentNumber === 'Identity proof' && isStoredFileUrl(doc.fileUrl)) {
      state.identityProofFileUrl = doc.fileUrl;
    }
  }

  return state;
}

export function findPrimaryIdentityDocument(
  documents: MemberDocumentResponse[],
): MemberDocumentResponse | null {
  return (
    documents.find(doc => IDENTITY_DOCUMENT_TYPES.includes(doc.documentType)) ?? null
  );
}
