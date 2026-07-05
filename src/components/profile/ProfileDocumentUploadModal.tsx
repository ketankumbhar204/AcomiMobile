import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { memberApi, PENDING_UPLOAD_FILE_URL } from '../../api/memberApi';
import type { MemberDocumentType, UUID } from '../../api/types';
import { Button, FormInput } from '../ui';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { pickProfileImage } from '../../utils/pickProfileImage';
import { DocumentTypePicker } from '../member/DocumentTypePicker';

type ProfileDocumentUploadModalProps = {
  visible: boolean;
  spaceId: UUID;
  memberId: UUID;
  onClose: () => void;
  onUploaded: () => void;
};

const MAX_DOCUMENT_FILE_URL_LENGTH = 2048;

function resolveUploadFileUrl(fileUrl: string): string {
  const trimmed = fileUrl.trim();
  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('data:') ||
    trimmed.length > MAX_DOCUMENT_FILE_URL_LENGTH
  ) {
    return PENDING_UPLOAD_FILE_URL;
  }
  return trimmed;
}

export function ProfileDocumentUploadModal({
  visible,
  spaceId,
  memberId,
  onClose,
  onUploaded,
}: ProfileDocumentUploadModalProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const refreshUser = useAuthStore(state => state.refreshUser);

  const [documentType, setDocumentType] = useState<MemberDocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [previewUri, setPreviewUri] = useState('');
  const [pickingImage, setPickingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDocumentType(null);
    setDocumentNumber('');
    setFileUrl('');
    setPreviewUri('');
    setFormError(null);
  }, [visible]);

  const handlePickImage = async () => {
    setPickingImage(true);
    setFormError(null);
    try {
      const picked = await pickProfileImage();
      if (!picked) {
        return;
      }
      setFileUrl(picked.fileUrl);
      setPreviewUri(picked.previewUri);
    } catch {
      showToast(t('profileCompletion.errors.pickFailed'));
    } finally {
      setPickingImage(false);
    }
  };

  const handleUpload = async () => {
    if (!documentType) {
      setFormError(t('membership.documents.typeRequired'));
      return;
    }
    if (!documentNumber.trim()) {
      setFormError(t('membership.documents.numberRequired'));
      return;
    }
    if (!fileUrl.trim()) {
      setFormError(t('settings.profile.documents.fileRequired'));
      return;
    }

    setLoading(true);
    try {
      await memberApi.addMemberDocument(spaceId, memberId, {
        documentType,
        documentNumber: documentNumber.trim(),
        fileUrl: resolveUploadFileUrl(fileUrl),
      });
      showToast(t('settings.profile.documents.uploadSuccess'));
      await refreshUser();
      onUploaded();
      onClose();
    } catch {
      showToast(t('settings.profile.documents.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.cancel')} />
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t('settings.profile.documents.upload')}</Text>
            <DocumentTypePicker value={documentType} onChange={setDocumentType} />
            <FormInput
              label={t('membership.documents.numberLabel')}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder={t('membership.documents.numberPlaceholder')}
            />
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.preview} />
            ) : null}
            <Button
              label={
                previewUri
                  ? t('profileCompletion.wizard.replacePhoto')
                  : t('settings.profile.documents.pickFile')
              }
              variant="secondary"
              onPress={() => void handlePickImage()}
              loading={pickingImage}
              disabled={pickingImage || loading}
            />
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            <View style={styles.actions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={onClose}
                disabled={loading}
                style={styles.actionButton}
              />
              <Button
                label={t('settings.profile.documents.upload')}
                onPress={() => void handleUpload()}
                loading={loading}
                disabled={loading || pickingImage}
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    maxHeight: '85%',
    ...shadows.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: radius.card,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.sm,
  },
});
