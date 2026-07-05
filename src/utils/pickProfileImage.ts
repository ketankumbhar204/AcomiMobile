import { launchImageLibrary } from 'react-native-image-picker';

export type PickedImage = {
  /** URI for on-screen preview (file:// or data:). */
  previewUri: string;
  /** Value persisted or sent to the API. */
  fileUrl: string;
};

export async function pickProfileImage(): Promise<PickedImage | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
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

  const asset = result.assets?.[0];
  if (!asset) {
    return null;
  }

  if (asset.base64) {
    const mime = asset.type ?? 'image/jpeg';
    const dataUri = `data:${mime};base64,${asset.base64}`;
    return { previewUri: dataUri, fileUrl: dataUri };
  }

  if (asset.uri) {
    return { previewUri: asset.uri, fileUrl: asset.uri };
  }

  return null;
}
