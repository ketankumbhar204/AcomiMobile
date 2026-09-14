import { launchImageLibrary } from 'react-native-image-picker';
import type { LocalFileInput } from '../services/fileUploadService';

export type PickedImage = {
  /** URI for on-screen preview (file://). */
  previewUri: string;
  uri: string;
  mime: string;
  size: number;
  name?: string;
  /** @deprecated Display only; do not send as file identity. */
  fileUrl: string;
};

function toPickedImage(asset: {
  uri?: string;
  type?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
}): PickedImage | null {
  if (!asset.uri) {
    return null;
  }
  const mime = asset.type && asset.type !== 'application/octet-stream' ? asset.type : 'image/jpeg';
  const size = asset.fileSize && asset.fileSize > 0 ? asset.fileSize : 1;
  return {
    previewUri: asset.uri,
    uri: asset.uri,
    mime,
    size,
    name: asset.fileName ?? undefined,
    fileUrl: asset.uri,
  };
}

export async function pickProfileImage(): Promise<PickedImage | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: false,
    selectionLimit: 1,
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
  });

  if (result.didCancel) {
    return null;
  }

  if (result.errorCode) {
    throw new Error(result.errorMessage ?? result.errorCode);
  }

  return toPickedImage(result.assets?.[0] ?? {});
}

export function toLocalFileInput(picked: PickedImage): LocalFileInput {
  return {
    uri: picked.uri,
    mime: picked.mime,
    size: picked.size,
    name: picked.name,
  };
}
