import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { memberApi, PENDING_UPLOAD_FILE_URL } from '../../api/memberApi';
import type { MemberDocumentResponse, UUID } from '../../api/types';
import { Button, Card, SkeletonCard, useConfirmDialog } from '../ui';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { MemberDetailRow, MemberSectionTitle } from '../member/MemberDetailRow';

type ProfileDocumentsSectionProps = {
  spaceId: UUID;
  memberId: UUID;
  onRequestUpload: () => void;
  refreshKey?: number;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function previewUriForFile(fileUrl: string): string {
  if (
    fileUrl.startsWith('file://') ||
    fileUrl.startsWith('data:') ||
    fileUrl.startsWith('http')
  ) {
    return fileUrl;
  }
  return '';
}

export function ProfileDocumentsSection({
  spaceId,
  memberId,
  onRequestUpload,
  refreshKey = 0,
}: ProfileDocumentsSectionProps) {
  const { t } = useTranslation();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);

  const [documents, setDocuments] = useState<MemberDocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const next = await memberApi.getMemberDocuments(spaceId, memberId);
      setDocuments(next);
    } catch {
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, [memberId, spaceId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments, refreshKey]);

  const confirmDelete = (documentId: UUID) => {
    showConfirm({
      title: t('membership.documents.deleteTitle'),
      message: t('membership.documents.deleteMessage'),
      confirmLabel: t('membership.documents.deleteConfirm'),
      destructive: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          await memberApi.deleteMemberDocument(spaceId, memberId, documentId);
          await loadDocuments();
        } catch {
          showToast(t('membership.errors.deleteDocument'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  if (documentsLoading && documents.length === 0) {
    return (
      <View style={styles.wrap}>
        <MemberSectionTitle title={t('settings.profile.documentsSection')} />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <MemberSectionTitle title={t('settings.profile.documentsSection')} />
      <Text style={styles.description}>{t('settings.profile.documentsDescription')}</Text>

      <Button
        label={t('settings.profile.documents.upload')}
        variant="secondary"
        onPress={onRequestUpload}
        style={styles.uploadButton}
      />

      {documents.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>{t('settings.profile.documentsEmpty')}</Text>
        </Card>
      ) : (
        documents.map(doc => {
          const preview = previewUriForFile(doc.fileUrl);
          return (
            <Card key={doc.documentId} style={styles.card}>
              {preview ? <Image source={{ uri: preview }} style={styles.previewImage} /> : null}
              <MemberDetailRow
                label={t('membership.documents.typeLabel')}
                value={t(`membership.documents.types.${doc.documentType}`)}
              />
              <MemberDetailRow
                label={t('membership.documents.numberLabel')}
                value={doc.documentNumber}
              />
              <MemberDetailRow
                label={t('membership.documents.verificationLabel')}
                value={t(`membership.documents.verification.${doc.verificationStatus}`)}
              />
              <MemberDetailRow
                label={t('membership.documents.uploadedLabel')}
                value={formatDate(doc.uploadedAt)}
              />
              <MemberDetailRow
                label={t('membership.documents.fileLabel')}
                value={
                  doc.fileUrl === PENDING_UPLOAD_FILE_URL
                    ? t('membership.documents.pendingUpload')
                    : t('settings.profile.documents.uploaded')
                }
                isLast
              />
              <Button
                label={t('membership.documents.deleteConfirm')}
                variant="ghost"
                onPress={() => confirmDelete(doc.documentId)}
                disabled={loading}
                style={styles.deleteButton}
              />
            </Card>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  uploadButton: {
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  deleteButton: {
    marginTop: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
});
