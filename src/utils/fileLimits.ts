import type { FilePurpose } from '../api/filesApi';

export const ABSOLUTE_MAX_BYTES = 5 * 1024 * 1024;
export const ORIGINAL_READ_MAX_BYTES = 25 * 1024 * 1024;
export const IMAGE_OPTIMIZE_MAX_DIMENSION = 1800;
export const DOCUMENT_IMAGE_MAX_DIMENSION = 2000;
export const IMAGE_JPEG_QUALITY = 0.82;
export const DOCUMENT_IMAGE_JPEG_QUALITY = 0.85;

export type FileLimitErrorCode = 'TOO_LARGE' | 'UNSUPPORTED' | 'COMPRESS_FAILED' | 'TOO_LARGE_ORIGINAL';

export class FileUploadUserError extends Error {
  readonly code: FileLimitErrorCode;

  constructor(code: FileLimitErrorCode, message: string) {
    super(message);
    this.name = 'FileUploadUserError';
    this.code = code;
  }
}

const PURPOSE_MAX_BYTES: Record<FilePurpose, number> = {
  PROFILE_PHOTO: 2 * 1024 * 1024,
  IDENTITY_DOCUMENT: ABSOLUTE_MAX_BYTES,
  ADDRESS_PROOF: ABSOLUTE_MAX_BYTES,
  MEMBER_DOCUMENT: ABSOLUTE_MAX_BYTES,
  PAYMENT_PROOF: 4 * 1024 * 1024,
  MEAL_PAYMENT_PROOF: 4 * 1024 * 1024,
  SUBSCRIPTION_PAYMENT_PROOF: 4 * 1024 * 1024,
  COMPLAINT_ATTACHMENT: 4 * 1024 * 1024,
  BUILDING_PHOTO: ABSOLUTE_MAX_BYTES,
  FLOOR_PHOTO: ABSOLUTE_MAX_BYTES,
  UNIT_PHOTO: ABSOLUTE_MAX_BYTES,
  ROOM_PHOTO: ABSOLUTE_MAX_BYTES,
  BED_PHOTO: ABSOLUTE_MAX_BYTES,
  MENU_ITEM_PHOTO: ABSOLUTE_MAX_BYTES,
  COMBO_PHOTO: ABSOLUTE_MAX_BYTES,
  SPACE_PHOTO: ABSOLUTE_MAX_BYTES,
};

export function purposeMaxBytes(purpose: FilePurpose): number {
  return Math.min(PURPOSE_MAX_BYTES[purpose] ?? ABSOLUTE_MAX_BYTES, ABSOLUTE_MAX_BYTES);
}

export function purposeMaxMb(purpose: FilePurpose): number {
  return Math.max(1, Math.floor(purposeMaxBytes(purpose) / (1024 * 1024)));
}

export function isSupportedImageMime(mime: string | null | undefined): boolean {
  const normalized = (mime ?? '').split(';')[0].trim().toLowerCase();
  return (
    normalized === 'image/jpeg' ||
    normalized === 'image/jpg' ||
    normalized === 'image/png' ||
    normalized === 'image/webp'
  );
}

export function computeTargetDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: Math.max(1, width), height: Math.max(1, height) };
  }
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function isDocumentImagePurpose(purpose: FilePurpose): boolean {
  return (
    purpose === 'IDENTITY_DOCUMENT' ||
    purpose === 'ADDRESS_PROOF' ||
    purpose === 'MEMBER_DOCUMENT'
  );
}

export function fileLimitMessage(code: FileLimitErrorCode, maxMb = 5): string {
  switch (code) {
    case 'TOO_LARGE':
      return `File size must be ${maxMb} MB or less.`;
    case 'TOO_LARGE_ORIGINAL':
    case 'COMPRESS_FAILED':
      return 'This image is too large to upload. Please choose a smaller image.';
    case 'UNSUPPORTED':
      return 'This file type is not supported.';
    default:
      return 'Unable to upload the file. Please try again.';
  }
}

export function pickerOptionsForPurpose(purpose?: FilePurpose) {
  const document = purpose ? isDocumentImagePurpose(purpose) : false;
  return {
    mediaType: 'photo' as const,
    includeBase64: false,
    selectionLimit: 1,
    maxWidth: document ? DOCUMENT_IMAGE_MAX_DIMENSION : IMAGE_OPTIMIZE_MAX_DIMENSION,
    maxHeight: document ? DOCUMENT_IMAGE_MAX_DIMENSION : IMAGE_OPTIMIZE_MAX_DIMENSION,
    quality: document ? DOCUMENT_IMAGE_JPEG_QUALITY : IMAGE_JPEG_QUALITY,
  };
}
