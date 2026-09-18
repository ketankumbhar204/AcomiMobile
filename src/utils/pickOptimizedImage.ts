import { Alert, InteractionManager, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { ImagePickerResponse } from 'react-native-image-picker';
import type { FilePurpose } from '../api/filesApi';
import type { LocalFileInput } from '../services/fileUploadService';
import { i18n } from '../i18n';
import {
  ABSOLUTE_MAX_BYTES,
  FileUploadUserError,
  fileLimitMessage,
  isSupportedImageMime,
  pickerOptionsForPurpose,
  purposeMaxBytes,
} from './fileLimits';

export type PickedImage = {
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
  if (!isSupportedImageMime(mime)) {
    throw new FileUploadUserError('UNSUPPORTED', fileLimitMessage('UNSUPPORTED'));
  }
  const size = asset.fileSize && asset.fileSize > 0 ? asset.fileSize : 1;
  if (size > ABSOLUTE_MAX_BYTES) {
    throw new FileUploadUserError('COMPRESS_FAILED', fileLimitMessage('COMPRESS_FAILED'));
  }
  return {
    previewUri: asset.uri,
    uri: asset.uri,
    mime,
    size,
    name: asset.fileName ?? undefined,
    fileUrl: asset.uri,
  };
}

function resultToPicked(result: ImagePickerResponse): PickedImage | null {
  if (result.didCancel) {
    return null;
  }
  if (result.errorCode) {
    throw new Error(result.errorMessage ?? result.errorCode);
  }
  return toPickedImage(result.assets?.[0] ?? {});
}

/**
 * CAMERA is declared in the Android manifest for "Take photo".
 * react-native-image-picker requires the runtime grant when CAMERA is declared.
 * Do NOT request READ_MEDIA_* — gallery uses Android Photo Picker (no media permission).
 */
async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  if (granted) {
    return true;
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
    title: i18n.t('files.cameraPermissionTitle', { defaultValue: 'Camera permission' }),
    message: i18n.t('files.cameraPermissionMessage', {
      defaultValue: 'ACOMI needs camera access to take a photo.',
    }),
    buttonPositive: i18n.t('common.ok', { defaultValue: 'OK' }),
    buttonNegative: i18n.t('common.cancel', { defaultValue: 'Cancel' }),
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function launchSource(
  source: 'camera' | 'gallery',
  purpose?: FilePurpose,
): Promise<PickedImage | null> {
  const options = pickerOptionsForPurpose(purpose) as Parameters<typeof launchCamera>[0];
  if (source === 'camera') {
    const allowed = await ensureCameraPermission();
    if (!allowed) {
      return null;
    }
    return resultToPicked(await launchCamera(options));
  }
  // Gallery: react-native-image-picker 8.x uses ActivityResultContracts.PickVisualMedia
  // (Android Photo Picker) — no READ_MEDIA_IMAGES / READ_MEDIA_VIDEO.
  return resultToPicked(await launchImageLibrary(options));
}

/** Wait until Alert/Modal dismiss animation finishes before opening the system picker. */
function afterUiSettles(): Promise<void> {
  return new Promise(resolve => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, Platform.OS === 'android' ? 350 : 50);
    });
  });
}

export async function pickOptimizedImage(purpose?: FilePurpose): Promise<PickedImage | null> {
  if (Platform.OS === 'web') {
    return launchSource('gallery', purpose);
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    let actionChosen = false;
    const finish = (value: PickedImage | null) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };
    const fail = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };

    Alert.alert(
      i18n.t('files.add', { defaultValue: 'Add photo' }),
      undefined,
      [
        {
          text: i18n.t('files.takePhoto', { defaultValue: 'Take photo' }),
          onPress: () => {
            actionChosen = true;
            void afterUiSettles()
              .then(() => launchSource('camera', purpose))
              .then(finish)
              .catch(fail);
          },
        },
        {
          text: i18n.t('files.chooseGallery', { defaultValue: 'Choose from gallery' }),
          onPress: () => {
            actionChosen = true;
            void afterUiSettles()
              .then(() => launchSource('gallery', purpose))
              .then(finish)
              .catch(fail);
          },
        },
        {
          text: i18n.t('common.cancel', { defaultValue: 'Cancel' }),
          style: 'cancel',
          onPress: () => finish(null),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          // Android may fire onDismiss after a button press; ignore once an action was chosen.
          if (!actionChosen) {
            finish(null);
          }
        },
      },
    );
  });
}

export function toLocalFileInput(picked: PickedImage): LocalFileInput {
  return {
    uri: picked.uri,
    mime: picked.mime,
    size: picked.size,
    name: picked.name,
  };
}

export function assertPickedSize(picked: PickedImage, purpose: FilePurpose): void {
  if (picked.size > purposeMaxBytes(purpose) || picked.size > ABSOLUTE_MAX_BYTES) {
    throw new FileUploadUserError(
      'TOO_LARGE',
      fileLimitMessage('TOO_LARGE', Math.max(1, Math.floor(purposeMaxBytes(purpose) / (1024 * 1024)))),
    );
  }
}
