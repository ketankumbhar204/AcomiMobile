import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PENDING_UPLOAD_FILE_URL } from '../../api/memberApi';
import type { MemberDocumentType } from '../../api/types';
import { Button, EmptyState, FormInput, SkeletonCard, useConfirmDialog } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { DocumentTypePicker } from './DocumentTypePicker';
import { VerificationStatusBadge } from './VerificationStatusBadge';

type MemberDocumentsTabProps = {
  memberId: string;
  canEdit: boolean;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

export function MemberDocumentsTab({ memberId, canEdit }: MemberDocumentsTabProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const documents = useMemberStore(state => state.documents);
  const documentsLoading = useMemberStore(state => state.documentsLoading);
  const loading = useMemberStore(state => state.loading);
  const loadDocuments = useMemberStore(state => state.loadDocuments);
  const addDocument = useMemberStore(state => state.addDocument);
  const deleteDocument = useMemberStore(state => state.deleteDocument);
  const { showConfirm } = useConfirmDialog();

  const [modalVisible, setModalVisible] = useState(false);
  const [documentType, setDocumentType] = useState<MemberDocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[MemberDocumentsTab] first visit, load documents', memberId);
    void loadDocuments(memberId);
  }, [loadDocuments, memberId]);

  const openAddModal = () => {
    setDocumentType(null);
    setDocumentNumber('');
    setFormError(null);
    setModalVisible(true);
  };

  const handleAdd = async () => {
    if (!documentType) {
      setFormError(t('membership.documents.typeRequired'));
      return;
    }
    if (!documentNumber.trim()) {
      setFormError(t('membership.documents.numberRequired'));
      return;
    }

    console.log('[MemberDocumentsTab] add document', documentType);
    const created = await addDocument(memberId, {
      documentType,
      documentNumber: documentNumber.trim(),
      fileUrl: PENDING_UPLOAD_FILE_URL,
    });
    if (created) {
      showToast(t('membership.documents.successToast'));
      setModalVisible(false);
      setFormError(null);
    }
  };

  const confirmDelete = (documentId: string) => {
    showConfirm({
      title: t('membership.documents.deleteTitle'),
      message: t('membership.documents.deleteMessage'),
      confirmLabel: t('membership.documents.deleteConfirm'),
      destructive: true,
      onConfirm: async () => {
        console.log('[MemberDocumentsTab] delete document', documentId);
        await deleteDocument(memberId, documentId);
      },
    });
  };

  if (documentsLoading && documents.length === 0) {
    return <SkeletonCard />;
  }

  return (
    <View>
      {canEdit ? (
        <Button
          label={t('membership.documents.add')}
          onPress={openAddModal}
          style={styles.actionButton}
        />
      ) : null}

      {documents.length === 0 ? (
        <EmptyState
          title={t('membership.documents.emptyTitle')}
          description={t('membership.documents.emptyDescription')}
          icon="📄"
        />
      ) : (
        <View style={styles.list}>
          {documents.map(doc => (
            <View key={doc.documentId} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {t(`membership.documents.types.${doc.documentType}`)}
                </Text>
                <VerificationStatusBadge status={doc.verificationStatus} />
              </View>
              <Text style={styles.cardMeta}>
                {t('membership.documents.number', { value: doc.documentNumber })}
              </Text>
              <Text style={styles.cardMeta}>
                {doc.fileUrl === PENDING_UPLOAD_FILE_URL
                  ? t('membership.documents.pendingUpload')
                  : t('membership.documents.fileUrl', { value: doc.fileUrl })}
              </Text>
              <Text style={styles.cardMeta}>
                {t('membership.documents.uploadedAt', {
                  date: formatDate(doc.uploadedAt),
                })}
              </Text>
              {canEdit ? (
                <Button
                  label={t('membership.documents.deleteConfirm')}
                  variant="ghost"
                  onPress={() => confirmDelete(doc.documentId)}
                  disabled={loading}
                  style={styles.deleteButton}
                />
              ) : null}
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('membership.documents.add')}</Text>
            <DocumentTypePicker
              value={documentType}
              onChange={setDocumentType}
            />
            <FormInput
              label={t('membership.documents.numberLabel')}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder={t('membership.documents.numberPlaceholder')}
            />
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                label={t('common.save')}
                onPress={handleAdd}
                disabled={loading}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  cardMeta: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.md,
  },
  modalTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
