import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { entityPhotoApi } from '../../api/entityPhotoApi';
import { ENTITY_PHOTO_PURPOSE, type EntityPhotoKind } from '../../files/entityPhoto';
import { fetchSignedContentUrlWithRetry, uploadLocalFile } from '../../services/fileUploadService';
import { pickOptimizedImage, toLocalFileInput } from '../../utils/pickOptimizedImage';
import { FileUploadUserError } from '../../utils/fileLimits';
import { useToastStore } from '../../store/toastStore';
import { ImagePreviewModal } from './ImagePreviewModal';
import { colors } from '../../theme';

type EntityPhotoProps = {
  spaceId: string;
  entityId: string;
  kind: EntityPhotoKind;
  fileId?: string | null;
  canEdit: boolean;
  fallback: React.ReactNode;
  title?: string;
  onChanged?: (nextFileId: string | null) => void;
  size?: number;
  /** Rectangular frame for layout illustrations instead of a circular chip. */
  fill?: boolean;
  height?: number;
};

export function EntityPhoto({
  spaceId,
  entityId,
  kind,
  fileId,
  canEdit,
  fallback,
  title,
  onChanged,
  size = 44,
  fill = false,
  height,
}: EntityPhotoProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localFileId, setLocalFileId] = useState<string | null | undefined>(fileId);

  useEffect(() => {
    setLocalFileId(fileId);
  }, [fileId]);

  const activeFileId = localFileId;

  useEffect(() => {
    let cancelled = false;
    if (!activeFileId) {
      setPreviewUrl(null);
      return;
    }
    void fetchSignedContentUrlWithRetry(activeFileId)
      .then(url => {
        if (!cancelled) {
          setPreviewUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeFileId]);

  const startUpload = async () => {
    if (!canEdit || busyRef.current) {
      return;
    }
    const picked = await pickOptimizedImage(ENTITY_PHOTO_PURPOSE[kind]);
    if (!picked) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      const uploadedId = await uploadLocalFile(toLocalFileInput(picked), {
        purpose: ENTITY_PHOTO_PURPOSE[kind],
        spaceId,
      });
      await entityPhotoApi.replace(kind, spaceId, entityId, uploadedId);
      setLocalFileId(uploadedId);
      onChanged?.(uploadedId);
    } catch (error) {
      showToast(
        error instanceof FileUploadUserError
          ? error.message
          : t('files.uploadFailed', { defaultValue: 'Unable to upload the file. Please try again.' }),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handlePress = () => {
    if (activeFileId) {
      setViewerOpen(true);
      return;
    }
    if (canEdit) {
      void startUpload();
    }
  };

  const handleRemove = async () => {
    if (!canEdit || busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await entityPhotoApi.remove(kind, spaceId, entityId);
      setViewerOpen(false);
      setLocalFileId(null);
      onChanged?.(null);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : t('files.uploadFailed', { defaultValue: 'Unable to upload the file. Please try again.' }),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const interactive = Boolean(activeFileId) || canEdit;
  const frameStyle = fill
    ? [styles.wrap, styles.fill, height != null ? { height } : null]
    : [styles.wrap, { width: size, height: size, borderRadius: size / 2 }];

  return (
    <>
      <Pressable
        onPress={interactive ? handlePress : undefined}
        disabled={!interactive}
        accessibilityRole={interactive ? 'button' : undefined}
        accessibilityLabel={
          activeFileId
            ? t('files.view', { defaultValue: 'View photo' })
            : canEdit
              ? t('files.add', { defaultValue: 'Add photo' })
              : undefined
        }
        style={frameStyle}>
        {activeFileId && previewUrl ? (
          <Image source={{ uri: previewUrl }} style={styles.image} />
        ) : (
          fallback
        )}
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : null}
      </Pressable>
      <ImagePreviewModal
        visible={viewerOpen}
        fileId={activeFileId}
        title={title}
        canEdit={canEdit}
        onClose={() => setViewerOpen(false)}
        onReplace={() => {
          setViewerOpen(false);
          void startUpload();
        }}
        onRemove={() => void handleRemove()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    width: '100%',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  busy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
