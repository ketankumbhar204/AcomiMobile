import { launchImageLibrary } from 'react-native-image-picker';

export async function pickPaymentProofImage(): Promise<string | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
    selectionLimit: 1,
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 0.75,
  });

  if (result.didCancel || result.errorCode) {
    return null;
  }

  const asset = result.assets?.[0];
  if (!asset?.base64) {
    return null;
  }

  const mime = asset.type ?? 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}
