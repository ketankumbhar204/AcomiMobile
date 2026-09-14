import { launchImageLibrary } from 'react-native-image-picker';
import type { LocalFileInput } from '../services/fileUploadService';
import { pickProfileImage, type PickedImage } from './pickProfileImage';

export type PickedPaymentProof = PickedImage;

export async function pickPaymentProofImage(): Promise<PickedPaymentProof | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: false,
    selectionLimit: 1,
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 0.75,
  });

  if (result.didCancel || result.errorCode) {
    return null;
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    return null;
  }
  const mime = asset.type && asset.type !== 'application/octet-stream' ? asset.type : 'image/jpeg';
  return {
    previewUri: asset.uri,
    uri: asset.uri,
    mime,
    size: asset.fileSize && asset.fileSize > 0 ? asset.fileSize : 1,
    name: asset.fileName ?? undefined,
    fileUrl: asset.uri,
  };
}

export function paymentProofToLocalFile(picked: PickedPaymentProof): LocalFileInput {
  return {
    uri: picked.uri,
    mime: picked.mime,
    size: picked.size,
    name: picked.name,
  };
}

/** @deprecated Use pickPaymentProofImage() object form. */
export async function pickPaymentProofImageDataUri(): Promise<string | null> {
  const picked = await pickProfileImage();
  return picked?.previewUri ?? null;
}
